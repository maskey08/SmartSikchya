from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.question import Question, QuestionMetadata
from app.models.session import PracticeSession, SessionResponse, UserProgress
from app.models.user import UserXP
from app.schemas.session import (
    StartSessionIn, StartSessionOut, QuestionOut,
    AnswerIn, AnswerOut,
    CompleteSessionOut,
    ReviewOut, ReviewItem,
)
from app.services.adaptive import (
    get_target_difficulty,
    get_questions_for_session,
    calculate_xp,
    calculate_level,
    build_recommendation,
    SESSION_COMPLETION_BONUS,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ── 1. Start a practice session ─────────────────────────────────
@router.post("/start", response_model=StartSessionOut)
async def start_session(body: StartSessionIn, db: AsyncSession = Depends(get_db)):
    # Pick target difficulty based on user history
    difficulty = await get_target_difficulty(db, body.user_id, body.chapter_id)

    # Fetch adaptive question set
    questions = await get_questions_for_session(db, body.chapter_id, difficulty)

    if not questions:
        raise HTTPException(
            status_code=404,
            detail="No questions found for this chapter. Please add questions first.",
        )

    # Get subject_id from first question
    subject_id = questions[0].subject_id

    # Create the session record
    session = PracticeSession(
        user_id=body.user_id,
        subject_id=subject_id,
        chapter_id=body.chapter_id,
        total_q=len(questions),
        start_time=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()  # get session_id without committing

    # Pre-create response slots so frontend can POST answers by question_id
    for q in questions:
        meta = q.metadata_
        db.add(SessionResponse(
            session_id=session.session_id,
            question_id=q.question_id,
            chapter_id=body.chapter_id,
        ))

    await db.commit()
    await db.refresh(session)

    # Build response (don't send correct_answer to frontend)
    question_out = []
    for q in questions:
        difficulty_label = "medium"
        if q.metadata_:
            difficulty_label = q.metadata_.difficulty_level or "medium"
        question_out.append(QuestionOut(
            question_id=q.question_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=q.options,
            difficulty=difficulty_label,
        ))

    return StartSessionOut(
        session_id=session.session_id,
        questions=question_out,
        target_difficulty=difficulty,
    )


# ── 2. Submit a single answer ────────────────────────────────────
@router.post("/{session_id}/answer", response_model=AnswerOut)
async def submit_answer(
    session_id: int,
    body: AnswerIn,
    db: AsyncSession = Depends(get_db),
):
    # Load session
    session_result = await db.execute(
        select(PracticeSession).where(PracticeSession.session_id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session or session.is_completed:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    # Load question + metadata
    q_result = await db.execute(
        select(Question)
        .where(Question.question_id == body.question_id)
        .options(selectinload(Question.metadata_))
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Grade the answer
    is_correct = _grade(question, body.given_answer)
    difficulty  = question.metadata_.difficulty_level if question.metadata_ else "medium"
    xp          = calculate_xp(difficulty, is_correct)

    # Update the response row
    await db.execute(
        update(SessionResponse)
        .where(
            SessionResponse.session_id == session_id,
            SessionResponse.question_id == body.question_id,
        )
        .values(
            given_answer=body.given_answer,
            is_correct=is_correct,
            time_taken_seconds=body.time_taken_seconds,
            xp_awarded=xp,
        )
    )

    # Update session running totals
    new_correct = session.correct_count + (1 if is_correct else 0)
    new_xp      = session.xp_earned + xp
    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(correct_count=new_correct, xp_earned=new_xp)
    )

    await db.commit()

    return AnswerOut(
        is_correct=is_correct,
        correct_answer=question.correct_answer or "",
        explanation=question.explanation,
        xp_awarded=xp,
    )


# ── 3. Complete the session ──────────────────────────────────────
@router.post("/{session_id}/complete", response_model=CompleteSessionOut)
async def complete_session(
    session_id: int,
    user_id: int = 1,    # TODO: replace with auth middleware
    db: AsyncSession = Depends(get_db),
):
    # Load session
    sess_result = await db.execute(
        select(PracticeSession).where(PracticeSession.session_id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_completed:
        # Idempotent — return current state
        xp_rec = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
        xp_row = xp_rec.scalar_one_or_none()
        total_xp = xp_row.total_xp if xp_row else 0
        level    = xp_row.level    if xp_row else 1
        accuracy = session.correct_count / max(1, session.total_q)
        return CompleteSessionOut(
            session_id=session_id, total_q=session.total_q,
            correct_count=session.correct_count,
            accuracy_pct=round(accuracy * 100, 1),
            xp_earned=session.xp_earned, total_xp=total_xp, level=level, levelled_up=False,
        )

    # Add completion bonus
    final_xp = session.xp_earned + SESSION_COMPLETION_BONUS
    accuracy  = session.correct_count / max(1, session.total_q)

    # Mark session complete
    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(
            is_completed=True,
            end_time=datetime.now(timezone.utc),
            xp_earned=final_xp,
        )
    )

    # Upsert UserProgress for this chapter
    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.chapter_id == session.chapter_id,
        )
    )
    progress = prog_result.scalar_one_or_none()
    if progress:
        progress.total_attempts  += session.total_q
        progress.correct_answers += session.correct_count
        weakness = 1.0 - (progress.correct_answers / max(1, progress.total_attempts))
        progress.weakness_score   = round(weakness, 3)
    else:
        weakness = 1.0 - accuracy
        db.add(UserProgress(
            user_id=user_id,
            subject_id=session.subject_id,
            chapter_id=session.chapter_id,
            total_attempts=session.total_q,
            correct_answers=session.correct_count,
            weakness_score=round(weakness, 3),
        ))

    # Upsert UserXP
    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp_row    = xp_result.scalar_one_or_none()
    old_level = xp_row.level if xp_row else 1

    if xp_row:
        xp_row.total_xp += final_xp
        xp_row.level     = calculate_level(xp_row.total_xp)
    else:
        new_total = final_xp
        xp_row    = UserXP(
            user_id=user_id,
            total_xp=new_total,
            level=calculate_level(new_total),
        )
        db.add(xp_row)

    await db.commit()
    await db.refresh(xp_row)

    return CompleteSessionOut(
        session_id=session_id,
        total_q=session.total_q,
        correct_count=session.correct_count,
        accuracy_pct=round(accuracy * 100, 1),
        xp_earned=final_xp,
        total_xp=xp_row.total_xp,
        level=xp_row.level,
        levelled_up=xp_row.level > old_level,
    )


# ── 4. Review — all questions + user answers ─────────────────────
@router.get("/{session_id}/review", response_model=ReviewOut)
async def get_review(
    session_id: int,
    user_id: int = 1,
    db: AsyncSession = Depends(get_db),
):
    # Load responses with questions
    resp_result = await db.execute(
        select(SessionResponse)
        .where(SessionResponse.session_id == session_id)
        .options(selectinload(SessionResponse.session))
    )
    responses = resp_result.scalars().all()

    if not responses:
        raise HTTPException(status_code=404, detail="Session has no responses")

    items = []
    for r in responses:
        q_result = await db.execute(
            select(Question)
            .where(Question.question_id == r.question_id)
            .options(selectinload(Question.metadata_))
        )
        q = q_result.scalar_one_or_none()
        if not q:
            continue
        difficulty = q.metadata_.difficulty_level if q.metadata_ else "medium"
        items.append(ReviewItem(
            question_id=q.question_id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=q.options,
            given_answer=r.given_answer,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            is_correct=bool(r.is_correct),
            difficulty=difficulty,
            xp_awarded=r.xp_awarded,
        ))

    # Get XP totals
    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp_row    = xp_result.scalar_one_or_none()
    total_xp  = xp_row.total_xp if xp_row else 0
    level     = xp_row.level    if xp_row else 1

    # Build recommendation
    total    = len(items)
    correct  = sum(1 for i in items if i.is_correct)
    accuracy = correct / max(1, total)
    # Use target difficulty from session (stored via first question's metadata)
    target_diff = items[0].difficulty if items else "medium"
    recommendation = build_recommendation(accuracy, target_diff)

    return ReviewOut(
        session_id=session_id,
        items=items,
        total_xp=total_xp,
        level=level,
        recommendation=recommendation,
    )


# ── Helpers ──────────────────────────────────────────────────────
def _grade(question: Question, given: str) -> bool:
    correct = (question.correct_answer or "").strip()
    given   = (given or "").strip()
    if question.question_type == "mcq":
        return given.upper() == correct.upper()
    elif question.question_type == "fib":
        return given.lower() == correct.lower()
    else:
        # short answer — always mark as "attempted" (manual grading out of scope)
        return bool(given)
