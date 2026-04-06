"""
Sessions router — uses real auth (JWT cookie) for user_id.
"""
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.question import Question, QuestionMetadata
from app.models.session import PracticeSession, SessionResponse, UserProgress
from app.models.user import User, UserXP
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
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])

TYPE_MAP = {1: "mcq", 2: "short", 3: "fib", None: "mcq"}


def _type_str(q: Question) -> str:
    return TYPE_MAP.get(q.question_type, "mcq")


def _build_options(q: Question) -> dict | None:
    if not q.options or not isinstance(q.options, list):
        return None
    keys = ["A", "B", "C", "D", "E"]
    return {keys[i]: opt for i, opt in enumerate(q.options) if i < len(keys)}


async def _get_ai_explanation(question_text: str, correct_answer: str) -> str | None:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"Content-Type": "application/json"},
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 120,
                    "messages": [{
                        "role": "user",
                        "content": (
                            f"Question: {question_text}\n"
                            f"Correct answer: {correct_answer}\n"
                            "Give a 1-2 sentence explanation of why this is correct. "
                            "Be concise and student-friendly."
                        )
                    }]
                },
                timeout=8.0,
            )
            data = resp.json()
            if data.get("content"):
                return data["content"][0].get("text", "").strip()
    except Exception:
        pass
    return None


# ── 1. Start session ─────────────────────────────────────────────
@router.post("/start", response_model=StartSessionOut)
async def start_session(
    body: StartSessionIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id    = current_user.user_id
    difficulty = await get_target_difficulty(db, user_id, body.chapter_id)
    questions  = await get_questions_for_session(db, body.chapter_id, difficulty)

    if not questions:
        raise HTTPException(404, "No questions found for this chapter.")

    subject_id = questions[0].subject_id
    session = PracticeSession(
        user_id=user_id,
        subject_id=subject_id,
        chapter_id=body.chapter_id,
        total_q=len(questions),
        start_time=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()

    for q in questions:
        db.add(SessionResponse(
            session_id=session.session_id,
            question_id=q.question_id,
            chapter_id=body.chapter_id,
        ))

    await db.commit()
    await db.refresh(session)

    question_out = []
    for q in questions:
        diff = q.metadata_.difficulty_level if q.metadata_ else "medium"
        question_out.append(QuestionOut(
            question_id=q.question_id,
            question_text=q.question_text,
            question_type=_type_str(q),
            options=_build_options(q),
            difficulty=diff or "medium",
        ))

    return StartSessionOut(
        session_id=session.session_id,
        questions=question_out,
        target_difficulty=difficulty,
    )


# ── 2. Submit answer ─────────────────────────────────────────────
@router.post("/{session_id}/answer", response_model=AnswerOut)
async def submit_answer(
    session_id: int,
    body: AnswerIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sess_result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.session_id == session_id,
            PracticeSession.user_id == current_user.user_id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session or session.is_completed:
        raise HTTPException(404, "Session not found or already completed")

    q_result = await db.execute(
        select(Question)
        .where(Question.question_id == body.question_id)
        .options(selectinload(Question.metadata_))
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(404, "Question not found")

    is_correct = _grade(question, body.given_answer)
    difficulty  = question.metadata_.difficulty_level if question.metadata_ else "medium"
    xp          = calculate_xp(difficulty, is_correct)

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
    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(
            correct_count=PracticeSession.correct_count + (1 if is_correct else 0),
            xp_earned=PracticeSession.xp_earned + xp,
        )
    )
    await db.commit()

    explanation = await _get_ai_explanation(question.question_text, question.correct_answer or "")

    return AnswerOut(
        is_correct=is_correct,
        correct_answer=question.correct_answer or "",
        explanation=explanation,
        xp_awarded=xp,
    )


# ── 3. Complete session ──────────────────────────────────────────
@router.post("/{session_id}/complete", response_model=CompleteSessionOut)
async def complete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.user_id
    sess_result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.session_id == session_id,
            PracticeSession.user_id == user_id,
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    if session.is_completed:
        xp_rec   = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
        xp_row   = xp_rec.scalar_one_or_none()
        accuracy = session.correct_count / max(1, session.total_q)
        return CompleteSessionOut(
            session_id=session_id, total_q=session.total_q,
            correct_count=session.correct_count,
            accuracy_pct=round(accuracy * 100, 1),
            xp_earned=session.xp_earned,
            total_xp=xp_row.total_xp if xp_row else 0,
            level=xp_row.level if xp_row else 1,
            levelled_up=False,
        )

    final_xp = session.xp_earned + SESSION_COMPLETION_BONUS
    accuracy  = session.correct_count / max(1, session.total_q)

    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(is_completed=True, end_time=datetime.now(timezone.utc), xp_earned=final_xp)
    )

    # Upsert progress
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
        progress.weakness_score   = round(1.0 - progress.correct_answers / max(1, progress.total_attempts), 3)
    else:
        db.add(UserProgress(
            user_id=user_id,
            subject_id=session.subject_id,
            chapter_id=session.chapter_id,
            total_attempts=session.total_q,
            correct_answers=session.correct_count,
            weakness_score=round(1.0 - accuracy, 3),
        ))

    # Upsert XP
    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp_row    = xp_result.scalar_one_or_none()
    old_level = xp_row.level if xp_row else 1

    if xp_row:
        xp_row.total_xp += final_xp
        xp_row.level     = calculate_level(xp_row.total_xp)
    else:
        xp_row = UserXP(user_id=user_id, total_xp=final_xp, level=calculate_level(final_xp))
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


# ── 4. Review ────────────────────────────────────────────────────
@router.get("/{session_id}/review", response_model=ReviewOut)
async def get_review(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resp_result = await db.execute(
        select(SessionResponse).where(SessionResponse.session_id == session_id)
    )
    responses = resp_result.scalars().all()
    if not responses:
        raise HTTPException(404, "Session has no responses")

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
        diff = q.metadata_.difficulty_level if q.metadata_ else "medium"
        items.append(ReviewItem(
            question_id=q.question_id,
            question_text=q.question_text,
            question_type=_type_str(q),
            options=_build_options(q),
            given_answer=r.given_answer,
            correct_answer=q.correct_answer,
            is_correct=bool(r.is_correct),
            difficulty=diff or "medium",
            xp_awarded=r.xp_awarded,
        ))

    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == current_user.user_id))
    xp_row    = xp_result.scalar_one_or_none()

    total   = len(items)
    correct = sum(1 for i in items if i.is_correct)
    target_diff = items[0].difficulty if items else "medium"

    return ReviewOut(
        session_id=session_id,
        items=items,
        total_xp=xp_row.total_xp if xp_row else 0,
        level=xp_row.level if xp_row else 1,
        recommendation=build_recommendation(correct / max(1, total), target_diff),
    )


# ── Grading helper ────────────────────────────────────────────────
def _grade(question: Question, given: str) -> bool:
    correct = (question.correct_answer or "").strip()
    given   = (given or "").strip()
    qtype   = question.question_type

    if qtype == 1:  # MCQ
        if question.options and isinstance(question.options, list):
            keys = ["A", "B", "C", "D", "E"]
            opts = {keys[i]: opt for i, opt in enumerate(question.options) if i < len(keys)}
            return opts.get(given.upper(), "").lower().strip() == correct.lower().strip()
        return given.upper() == correct.upper()
    elif qtype == 3:  # FIB
        return given.lower() == correct.lower()
    return bool(given)  # Short answer — attempted = correct
