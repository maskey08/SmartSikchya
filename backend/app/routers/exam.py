"""
Exam router — subject-wide timed examination.

How it differs from practice sessions:
- User picks a SUBJECT, not a chapter
- Questions pulled from ALL chapters of that subject
- Fixed question count (20 questions)
- No per-question feedback during the exam (only at the end)
- Timed at the frontend (the backend just records the session)
- Results show per-chapter breakdown so student sees where they struggled

Why no chapter selection?
The exam simulates a real test where you don't get to pick topics.
It forces comprehensive recall across the whole subject.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.subject import Subject, Chapter
from app.models.question import Question, QuestionMetadata
from app.models.session import PracticeSession, SessionResponse, UserProgress
from app.models.user import User, UserXP
from app.schemas.session import QuestionOut, AnswerIn, AnswerOut
from app.services.adaptive import calculate_xp, calculate_level, SESSION_COMPLETION_BONUS
from app.services.auth_service import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/exam", tags=["exam"])

# Exam question count per subject
EXAM_QUESTION_COUNT = 20

TYPE_MAP = {1: "mcq", 2: "short", 3: "fib", None: "mcq"}

def _type_str(q: Question) -> str:
    return TYPE_MAP.get(q.question_type, "mcq")

def _build_options(q: Question) -> dict | None:
    if not q.options or not isinstance(q.options, list):
        return None
    keys = ["A", "B", "C", "D", "E"]
    return {keys[i]: opt for i, opt in enumerate(q.options) if i < len(keys)}


class StartExamIn(BaseModel):
    subject_id: int


class StartExamOut(BaseModel):
    session_id:     int
    subject_name:   str
    questions:      list[QuestionOut]
    total_questions:int
    time_limit_mins:int   # frontend uses this to run the countdown


@router.post("/start", response_model=StartExamOut)
async def start_exam(
    body: StartExamIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch EXAM_QUESTION_COUNT questions spread across all chapters of the subject.
    Strategy: distribute evenly across chapters, random within each chapter.
    """
    # Verify subject exists
    subj_result = await db.execute(select(Subject).where(Subject.subject_id == body.subject_id))
    subject = subj_result.scalar_one_or_none()
    if not subject:
        raise HTTPException(404, "Subject not found")

    # Get all unlocked chapters for this subject
    ch_result = await db.execute(
        select(Chapter)
        .where(Chapter.subject_id == body.subject_id, Chapter.is_locked == False)
        .order_by(Chapter.order_num)
    )
    chapters = ch_result.scalars().all()
    if not chapters:
        raise HTTPException(404, "No chapters available for this subject")

    # Distribute questions evenly across chapters
    per_chapter = max(2, EXAM_QUESTION_COUNT // len(chapters))
    all_questions: list[Question] = []

    for ch in chapters:
        stmt = (
            select(Question)
            .where(Question.chapter_id == ch.chapter_id)
            .options(selectinload(Question.metadata_))
            .order_by(func.random())
            .limit(per_chapter)
        )
        result = await db.execute(stmt)
        all_questions.extend(result.scalars().all())

    # If we got fewer than minimum (small DB), grab more from anywhere in subject
    if len(all_questions) < 5:
        raise HTTPException(404, "Not enough questions for an exam in this subject. Need at least 5.")

    # Shuffle and cap at EXAM_QUESTION_COUNT
    import random
    random.shuffle(all_questions)
    all_questions = all_questions[:EXAM_QUESTION_COUNT]

    # Create practice session — reuse the same table, just subject-level
    session = PracticeSession(
        user_id=current_user.user_id,
        subject_id=body.subject_id,
        chapter_id=None,         # null = exam mode (not chapter-specific)
        total_q=len(all_questions),
        start_time=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()

    for q in all_questions:
        db.add(SessionResponse(
            session_id=session.session_id,
            question_id=q.question_id,
            chapter_id=q.chapter_id,
        ))

    await db.commit()
    await db.refresh(session)

    question_out = []
    for q in all_questions:
        diff = q.metadata_.difficulty_level if q.metadata_ else "medium"
        question_out.append(QuestionOut(
            question_id=q.question_id,
            question_text=q.question_text,
            question_type=_type_str(q),
            options=_build_options(q),
            difficulty=diff or "medium",
        ))

    return StartExamOut(
        session_id=session.session_id,
        subject_name=subject.subject_name,
        questions=question_out,
        total_questions=len(question_out),
        time_limit_mins=len(question_out) * 2,  # 2 minutes per question
    )


@router.post("/{session_id}/submit")
async def submit_exam(
    session_id: int,
    answers: list[AnswerIn],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit all answers at once (exam-style, not one-by-one).
    Returns full results with per-chapter breakdown.
    """
    sess_result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.session_id == session_id, PracticeSession.user_id == current_user.user_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Exam session not found")
    if session.is_completed:
        raise HTTPException(400, "Exam already submitted")

    total_xp     = 0
    correct_count = 0
    chapter_stats: dict[int, dict] = {}  # chapter_id → {correct, total, name}
    result_items = []

    for ans in answers:
        q_result = await db.execute(
            select(Question)
            .where(Question.question_id == ans.question_id)
            .options(selectinload(Question.metadata_))
        )
        q = q_result.scalar_one_or_none()
        if not q:
            continue

        is_correct = _grade(q, ans.given_answer)
        diff       = q.metadata_.difficulty_level if q.metadata_ else "medium"
        xp         = calculate_xp(diff, is_correct)

        if is_correct:
            correct_count += 1
        total_xp += xp

        # Update response row
        from sqlalchemy import update
        await db.execute(
            update(SessionResponse)
            .where(SessionResponse.session_id == session_id, SessionResponse.question_id == q.question_id)
            .values(given_answer=ans.given_answer, is_correct=is_correct, xp_awarded=xp)
        )

        # Track per-chapter stats
        ch_id = q.chapter_id or 0
        if ch_id not in chapter_stats:
            ch_r  = await db.execute(select(Chapter).where(Chapter.chapter_id == ch_id))
            ch    = ch_r.scalar_one_or_none()
            chapter_stats[ch_id] = {"name": ch.chapter_name if ch else "—", "correct": 0, "total": 0}
        chapter_stats[ch_id]["correct"] += 1 if is_correct else 0
        chapter_stats[ch_id]["total"]   += 1

        result_items.append({
            "question_id":   q.question_id,
            "question_text": q.question_text,
            "question_type": _type_str(q),
            "options":       _build_options(q),
            "given_answer":  ans.given_answer,
            "correct_answer":q.correct_answer,
            "is_correct":    is_correct,
            "difficulty":    diff,
            "xp_awarded":    xp,
        })

    # Add completion bonus
    final_xp  = total_xp + SESSION_COMPLETION_BONUS
    accuracy  = correct_count / max(1, len(answers))

    # Mark session complete
    from sqlalchemy import update
    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(is_completed=True, end_time=datetime.now(timezone.utc),
                correct_count=correct_count, xp_earned=final_xp)
    )

    # Update per-chapter user_progress for all chapters touched
    for ch_id, stats in chapter_stats.items():
        if ch_id == 0:
            continue
        prog_r = await db.execute(
            select(UserProgress)
            .where(UserProgress.user_id == current_user.user_id, UserProgress.chapter_id == ch_id)
        )
        prog = prog_r.scalar_one_or_none()
        if prog:
            prog.total_attempts  += stats["total"]
            prog.correct_answers += stats["correct"]
            prog.weakness_score   = round(1.0 - prog.correct_answers / max(1, prog.total_attempts), 3)
        else:
            ch_accuracy = stats["correct"] / max(1, stats["total"])
            db.add(UserProgress(
                user_id=current_user.user_id,
                subject_id=session.subject_id,
                chapter_id=ch_id,
                total_attempts=stats["total"],
                correct_answers=stats["correct"],
                weakness_score=round(1.0 - ch_accuracy, 3),
            ))

    # Update XP
    xp_r = await db.execute(select(UserXP).where(UserXP.user_id == current_user.user_id))
    xp_row = xp_r.scalar_one_or_none()
    old_level = xp_row.level if xp_row else 1
    if xp_row:
        xp_row.total_xp += final_xp
        xp_row.level     = calculate_level(xp_row.total_xp)
    else:
        xp_row = UserXP(user_id=current_user.user_id, total_xp=final_xp, level=calculate_level(final_xp))
        db.add(xp_row)

    await db.commit()
    await db.refresh(xp_row)

    # Build per-chapter breakdown for the results screen
    chapter_breakdown = [
        {
            "chapter_name": v["name"],
            "correct":      v["correct"],
            "total":        v["total"],
            "accuracy_pct": round(v["correct"] / max(1, v["total"]) * 100, 1),
        }
        for k, v in chapter_stats.items() if k != 0
    ]

    return {
        "session_id":        session_id,
        "total_questions":   len(answers),
        "correct_count":     correct_count,
        "accuracy_pct":      round(accuracy * 100, 1),
        "xp_earned":         final_xp,
        "total_xp":          xp_row.total_xp,
        "level":             xp_row.level,
        "levelled_up":       xp_row.level > old_level,
        "chapter_breakdown": chapter_breakdown,
        "items":             result_items,
    }


def _grade(question: Question, given: str) -> bool:
    correct = (question.correct_answer or "").strip()
    given   = (given or "").strip()
    qtype   = question.question_type
    if qtype == 1:
        if question.options and isinstance(question.options, list):
            keys = ["A", "B", "C", "D", "E"]
            opts = {keys[i]: opt for i, opt in enumerate(question.options) if i < len(keys)}
            return opts.get(given.upper(), "").lower().strip() == correct.lower().strip()
        return given.upper() == correct.upper()
    elif qtype == 3:
        return given.lower() == correct.lower()
    return bool(given)
