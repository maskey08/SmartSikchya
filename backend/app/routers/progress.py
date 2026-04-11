"""
Progress router — per-user analytics.

Why a separate router and not inside sessions?
Because "progress" is a read-only analytics concern — it aggregates
historical data across many sessions. Sessions are write-heavy (create,
answer, complete). Keeping them separate means we can cache progress
independently later without touching session logic.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserXP
from app.models.subject import Subject, Chapter
from app.models.session import UserProgress, PracticeSession
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/me")
async def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns everything the ProgressPage needs in one call:
    - XP + level
    - Per-subject summary (accuracy, attempts)
    - Per-chapter detail with weakness scores
    - Session history (last 10)
    - Overall stats
    """
    user_id = current_user.user_id

    # ── XP row ───────────────────────────────────────────────────
    xp_result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp_row    = xp_result.scalar_one_or_none()
    total_xp  = xp_row.total_xp if xp_row else 0
    level     = xp_row.level    if xp_row else 1
    # XP needed to reach next level (500 XP per level)
    xp_in_level  = total_xp % 500
    xp_to_next   = 500 - xp_in_level

    # ── All user_progress rows for this user ─────────────────────
    prog_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    all_progress = prog_result.scalars().all()

    # ── Total stats across all chapters ──────────────────────────
    total_attempts  = sum(p.total_attempts  for p in all_progress)
    total_correct   = sum(p.correct_answers for p in all_progress)
    overall_accuracy = round(total_correct / max(1, total_attempts) * 100, 1)
    chapters_studied = len([p for p in all_progress if p.total_attempts > 0])

    # ── Session count + completed ─────────────────────────────────
    sess_count_r = await db.execute(
        select(func.count()).select_from(PracticeSession)
        .where(PracticeSession.user_id == user_id)
    )
    total_sessions = sess_count_r.scalar() or 0

    comp_count_r = await db.execute(
        select(func.count()).select_from(PracticeSession)
        .where(PracticeSession.user_id == user_id, PracticeSession.is_completed == True)
    )
    completed_sessions = comp_count_r.scalar() or 0

    # ── Build per-subject breakdown ───────────────────────────────
    subjects_result = await db.execute(select(Subject).order_by(Subject.subject_id))
    subjects = subjects_result.scalars().all()

    subject_breakdown = []
    for subj in subjects:
        # Get chapters for this subject
        ch_result = await db.execute(
            select(Chapter).where(Chapter.subject_id == subj.subject_id)
        )
        chapters = ch_result.scalars().all()

        # Progress for each chapter
        chapter_details = []
        subj_attempts = 0
        subj_correct  = 0

        for ch in chapters:
            prog = next((p for p in all_progress if p.chapter_id == ch.chapter_id), None)
            attempts = prog.total_attempts  if prog else 0
            correct  = prog.correct_answers if prog else 0
            accuracy = round(correct / max(1, attempts) * 100, 1) if attempts > 0 else None
            weakness = prog.weakness_score  if prog else None

            subj_attempts += attempts
            subj_correct  += correct

            chapter_details.append({
                "chapter_id":   ch.chapter_id,
                "chapter_name": ch.chapter_name,
                "order_num":    ch.order_num,
                "attempts":     attempts,
                "correct":      correct,
                "accuracy_pct": accuracy,
                "weakness_score": round(weakness, 2) if weakness is not None else None,
                "status": (
                    "not_started" if attempts == 0
                    else "mastered"  if accuracy and accuracy >= 80
                    else "improving" if accuracy and accuracy >= 50
                    else "struggling"
                ),
            })

        subj_accuracy = round(subj_correct / max(1, subj_attempts) * 100, 1) if subj_attempts > 0 else None

        subject_breakdown.append({
            "subject_id":   subj.subject_id,
            "subject_name": subj.subject_name,
            "icon":         subj.icon,
            "color_class":  subj.color_class,
            "attempts":     subj_attempts,
            "correct":      subj_correct,
            "accuracy_pct": subj_accuracy,
            "chapters":     chapter_details,
        })

    # ── Recent sessions (last 10) ─────────────────────────────────
    recent_result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.user_id == user_id, PracticeSession.is_completed == True)
        .order_by(PracticeSession.start_time.desc())
        .limit(10)
    )
    recent_sessions = []
    for s in recent_result.scalars().all():
        ch_r = await db.execute(select(Chapter).where(Chapter.chapter_id == s.chapter_id))
        ch   = ch_r.scalar_one_or_none()
        accuracy = round(s.correct_count / max(1, s.total_q) * 100, 1) if s.total_q > 0 else 0
        recent_sessions.append({
            "session_id":   s.session_id,
            "chapter_name": ch.chapter_name if ch else "—",
            "correct":      s.correct_count,
            "total_q":      s.total_q,
            "accuracy_pct": accuracy,
            "xp_earned":    s.xp_earned,
            "date":         s.start_time.isoformat() if s.start_time else None,
        })

    return {
        # XP & level
        "total_xp":    total_xp,
        "level":       level,
        "xp_in_level": xp_in_level,
        "xp_to_next":  xp_to_next,
        # Overall stats
        "overall_accuracy":  overall_accuracy,
        "total_attempts":    total_attempts,
        "chapters_studied":  chapters_studied,
        "total_sessions":    total_sessions,
        "completed_sessions":completed_sessions,
        # Breakdowns
        "subjects":          subject_breakdown,
        "recent_sessions":   recent_sessions,
    }


@router.get("/streak")
async def get_my_streak(current_user: User = Depends(get_current_user)):
    return {
        "current_streak":    current_user.current_streak,
        "longest_streak":    current_user.longest_streak,
        "last_active_date":  current_user.last_active_date.isoformat() if current_user.last_active_date else None,
    }