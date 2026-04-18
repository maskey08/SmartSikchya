"""
Sessions router — adaptive practice with IRT (2PL model).

ADAPTIVE FLOW:
  1. /start  — load user θ, fetch questions, pre-sort by Fisher Information
  2. /answer — grade, award XP, update θ via MAP Newton-Raphson, update question b_param
  3. /complete — persist θ, update progress, XP, streak
  4. /review  — post-session summary with per-question results
  5. /explain — Gemini explanation for a question/answer pair
  6. /irt-status — return user's current θ and mapped difficulty for a chapter
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.database import get_db
from app.models.question import Question
from app.models.session import PracticeSession, SessionResponse, UserProgress
from app.models.user import UserXP, User
from app.schemas.session import (
    StartSessionIn, StartSessionOut, QuestionOut,
    AnswerIn, AnswerOut,
    CompleteSessionOut,
    ReviewOut, ReviewItem,
)
from app.services.adaptive import (
    get_target_difficulty, get_questions_for_session,
    calculate_xp, calculate_level, build_recommendation, SESSION_COMPLETION_BONUS,
)
from app.services.auth_service import get_current_user
from app.services.gemini_service import get_explanation
from app.services.streak_service import update_streak
from app.services.irt_service import (
    get_user_theta, save_user_theta,
    get_question_irt_params,
    update_theta, update_question_b_param,
    theta_to_difficulty_label, difficulty_label_to_b,
    fisher_information, irt_probability,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

TYPE_MAP = {1: "mcq", 2: "short", 3: "fib", None: "mcq"}

def _type_str(q): return TYPE_MAP.get(q.question_type, "mcq")

def _build_options(q):
    if not q.options or not isinstance(q.options, list): return None
    keys = ["A","B","C","D","E"]
    return {keys[i]: opt for i, opt in enumerate(q.options) if i < len(keys)}


# ── 1. Start session ─────────────────────────────────────────────
@router.post("/start", response_model=StartSessionOut)
async def start_session(
    body: StartSessionIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id    = current_user.user_id
    chapter_id = body.chapter_id

    # ── IRT: load current θ ──────────────────────────────────────
    theta = await get_user_theta(db, user_id, chapter_id)
    # Map θ to a difficulty label for question fetching
    # IRT selects within a difficulty band to avoid extreme difficulty jumps on first sessions
    target_difficulty = theta_to_difficulty_label(theta)

    # ── Fetch questions ───────────────────────────────────────────
    questions = await get_questions_for_session(db, chapter_id, target_difficulty)
    if not questions:
        # Fall back: try all difficulties
        questions = await get_questions_for_session(db, chapter_id, "medium")
    if not questions:
        raise HTTPException(404, "No questions found for this chapter.")

    # ── IRT: sort questions by Fisher Information at θ ───────────
    irt_params = await get_question_irt_params(db, chapter_id)
    irt_lookup = {p["question_id"]: p for p in irt_params}

    def info_score(q):
        p = irt_lookup.get(q.question_id, {"a": 1.0, "b": difficulty_label_to_b(
            q.metadata_.difficulty_level if q.metadata_ else "medium"
        )})
        return fisher_information(theta, p["a"], p["b"])

    questions_sorted = sorted(questions, key=info_score, reverse=True)

    subject_id = questions_sorted[0].subject_id
    session    = PracticeSession(
        user_id=user_id, subject_id=subject_id, chapter_id=chapter_id,
        total_q=len(questions_sorted), start_time=datetime.now(timezone.utc)
    )
    db.add(session)
    await db.flush()
    for q in questions_sorted:
        db.add(SessionResponse(
            session_id=session.session_id,
            question_id=q.question_id,
            chapter_id=chapter_id,
        ))
    await db.commit()
    await db.refresh(session)

    question_out = []
    for q in questions_sorted:
        diff = q.metadata_.difficulty_level if q.metadata_ else "medium"
        question_out.append(QuestionOut(
            question_id=q.question_id, question_text=q.question_text,
            question_type=_type_str(q), options=_build_options(q),
            difficulty=diff or "medium",
        ))

    return StartSessionOut(
        session_id=session.session_id,
        questions=question_out,
        target_difficulty=target_difficulty,
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

    is_correct = _grade_with_embeddings(question, body.given_answer)
    difficulty  = question.metadata_.difficulty_level if question.metadata_ else "medium"
    xp          = calculate_xp(difficulty, is_correct)

    # ── IRT: update θ after this answer ──────────────────────────
    theta = await get_user_theta(db, current_user.user_id, session.chapter_id)
    irt_params = await get_question_irt_params(db, session.chapter_id)
    irt_lookup = {p["question_id"]: p for p in irt_params}
    q_params   = irt_lookup.get(question.question_id, {
        "a": 1.0,
        "b": difficulty_label_to_b(difficulty),
    })
    new_theta = update_theta(theta, q_params["a"], q_params["b"], is_correct)
    # Don't save yet — save on complete to avoid per-answer commits
    # Store on session response for now via a soft field (xp_awarded doubles as holder)
    # We'll persist in complete. Pass theta in response for frontend display.

    # Update question b_param with online learning
    await update_question_b_param(db, question.question_id, is_correct, theta)

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

    explanation = await get_explanation(question.question_text, question.correct_answer or "")

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
        xp_rec = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
        xp_row = xp_rec.scalar_one_or_none()
        accuracy = session.correct_count / max(1, session.total_q)
        return CompleteSessionOut(
            session_id=session_id, total_q=session.total_q,
            correct_count=session.correct_count, accuracy_pct=round(accuracy*100,1),
            xp_earned=session.xp_earned, total_xp=xp_row.total_xp if xp_row else 0,
            level=xp_row.level if xp_row else 1, levelled_up=False,
        )

    final_xp = session.xp_earned + SESSION_COMPLETION_BONUS
    accuracy  = session.correct_count / max(1, session.total_q)

    await db.execute(
        update(PracticeSession)
        .where(PracticeSession.session_id == session_id)
        .values(is_completed=True, end_time=datetime.now(timezone.utc), xp_earned=final_xp)
    )

    # ── IRT: compute final θ from all session responses ──────────
    resp_result = await db.execute(
        select(SessionResponse)
        .where(SessionResponse.session_id == session_id)
        .options(selectinload(SessionResponse.question) if hasattr(SessionResponse, 'question') else select(SessionResponse))
    )
    responses = resp_result.scalars().all()

    theta = await get_user_theta(db, user_id, session.chapter_id)
    irt_params = await get_question_irt_params(db, session.chapter_id)
    irt_lookup = {p["question_id"]: p for p in irt_params}

    for resp in responses:
        if resp.given_answer is None:
            continue
        q_result = await db.execute(
            select(Question).where(Question.question_id == resp.question_id)
            .options(selectinload(Question.metadata_))
        )
        q = q_result.scalar_one_or_none()
        if not q:
            continue
        qp = irt_lookup.get(q.question_id, {
            "a": 1.0,
            "b": difficulty_label_to_b(
                q.metadata_.difficulty_level if q.metadata_ else "medium"
            ),
        })
        theta = update_theta(theta, qp["a"], qp["b"], bool(resp.is_correct))

    await save_user_theta(db, user_id, session.chapter_id, theta)

    # ── Progress update ───────────────────────────────────────────
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
        # Also persist theta in user_progress if column exists
        if hasattr(progress, "current_theta"):
            progress.current_theta = round(theta, 4)
    else:
        kwargs = dict(
            user_id=user_id, subject_id=session.subject_id, chapter_id=session.chapter_id,
            total_attempts=session.total_q, correct_answers=session.correct_count,
            weakness_score=round(1.0-accuracy, 3),
        )
        db.add(UserProgress(**kwargs))

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
    await update_streak(db, user_id)

    return CompleteSessionOut(
        session_id=session_id, total_q=session.total_q,
        correct_count=session.correct_count, accuracy_pct=round(accuracy*100,1),
        xp_earned=final_xp, total_xp=xp_row.total_xp,
        level=xp_row.level, levelled_up=xp_row.level > old_level,
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
            select(Question).where(Question.question_id == r.question_id)
            .options(selectinload(Question.metadata_))
        )
        q = q_result.scalar_one_or_none()
        if not q:
            continue
        diff = q.metadata_.difficulty_level if q.metadata_ else "medium"
        items.append(ReviewItem(
            question_id=q.question_id, question_text=q.question_text,
            question_type=_type_str(q), options=_build_options(q),
            given_answer=r.given_answer, correct_answer=q.correct_answer,
            is_correct=bool(r.is_correct), difficulty=diff or "medium",
            xp_awarded=r.xp_awarded,
        ))
    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == current_user.user_id))
    xp_row    = xp_result.scalar_one_or_none()
    total = len(items); correct = sum(1 for i in items if i.is_correct)
    return ReviewOut(
        session_id=session_id, items=items,
        total_xp=xp_row.total_xp if xp_row else 0,
        level=xp_row.level if xp_row else 1,
        recommendation=build_recommendation(correct/max(1,total), items[0].difficulty if items else "medium"),
    )


# ── 5. AI Explanation ────────────────────────────────────────────
class ExplainIn(BaseModel):
    question_text: str
    correct_answer: str

@router.post("/explain")
async def explain_question(
    body: ExplainIn,
    current_user: User = Depends(get_current_user),
):
    explanation = await get_explanation(body.question_text, body.correct_answer)
    return {"explanation": explanation}


# ── 6. IRT status endpoint ───────────────────────────────────────
@router.get("/irt-status/{chapter_id}")
async def get_irt_status(
    chapter_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the student's current IRT ability estimate (θ) for a chapter.
    Used by the SubjectDetail page to show adaptive difficulty next to each chapter.
    """
    theta = await get_user_theta(db, current_user.user_id, chapter_id)
    label = theta_to_difficulty_label(theta)
    p_easy   = round(irt_probability(theta, 1.0, -1.0) * 100, 1)
    p_medium = round(irt_probability(theta, 1.0,  0.0) * 100, 1)
    p_hard   = round(irt_probability(theta, 1.0,  1.0) * 100, 1)
    return {
        "chapter_id":         chapter_id,
        "theta":              round(theta, 3),
        "target_difficulty":  label,
        "p_correct_easy":     p_easy,
        "p_correct_medium":   p_medium,
        "p_correct_hard":     p_hard,
        "interpretation": (
            "Beginner" if theta < -1 else
            "Below average" if theta < -0.5 else
            "Average" if theta < 0.5 else
            "Above average" if theta < 1 else
            "Advanced"
        ),
    }


# ── Grading helpers ──────────────────────────────────────────────
def _grade(question, given):
    correct = (question.correct_answer or "").strip()
    given   = (given or "").strip()
    qtype   = question.question_type
    if qtype == 1:
        if question.options and isinstance(question.options, list):
            keys = ["A","B","C","D","E"]
            opts = {keys[i]: opt for i, opt in enumerate(question.options) if i < len(keys)}
            return opts.get(given.upper(), "").lower().strip() == correct.lower().strip()
        return given.upper() == correct.upper()
    elif qtype == 3:
        return given.lower().strip() == correct.lower().strip()
    return given.lower().strip() == correct.lower().strip()

def _grade_with_embeddings(question, given):
    correct = (question.correct_answer or "").strip()
    given_s = (given or "").strip()
    if not given_s:
        return False
    qtype = question.question_type
    if qtype == 1:
        return _grade(question, given)
    try:
        from app.services.embedding_service import grade_short_answer
        if qtype == 3:
            return grade_short_answer(given_s, correct, threshold=0.80)
        return grade_short_answer(given_s, correct, threshold=0.70)
    except Exception:
        return _grade(question, given)
