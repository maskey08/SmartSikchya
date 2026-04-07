"""
Recommendations router — rule-based suggestions.

Why rule-based and not AI yet?
The AI (DistilBERT) is for difficulty CLASSIFICATION of question text.
Recommendations are a different problem: "what should this student study next?"
That's answered by looking at performance data — no ML needed.

Rules:
1. Chapters with lowest accuracy (struggling) → "Review needed"
2. Chapters never attempted → "Not started yet"
3. Chapters with good accuracy → "Ready to advance"

The AI step later will enrich question difficulty labels, which feeds
BETTER data into these same rules — so the rules don't change, just the
quality of the underlying data improves.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject, Chapter
from app.models.session import UserProgress
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/me")
async def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.user_id

    # Get all user progress rows
    prog_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    all_progress = {p.chapter_id: p for p in prog_result.scalars().all()}

    # Get all subjects with their chapters
    subjects_result = await db.execute(select(Subject).order_by(Subject.subject_id))
    subjects = subjects_result.scalars().all()

    struggling   = []   # accuracy < 50%, at least 1 attempt
    not_started  = []   # 0 attempts
    ready        = []   # accuracy >= 80% → ready for harder

    for subj in subjects:
        ch_result = await db.execute(
            select(Chapter)
            .where(Chapter.subject_id == subj.subject_id, Chapter.is_locked == False)
            .order_by(Chapter.order_num)
        )
        chapters = ch_result.scalars().all()

        for ch in chapters:
            prog = all_progress.get(ch.chapter_id)

            if not prog or prog.total_attempts == 0:
                not_started.append({
                    "chapter_id":   ch.chapter_id,
                    "chapter_name": ch.chapter_name,
                    "subject_name": subj.subject_name,
                    "subject_icon": subj.icon,
                    "color_class":  subj.color_class,
                    "type":         "not_started",
                    "reason":       "You haven't tried this chapter yet.",
                    "accuracy_pct": None,
                    "attempts":     0,
                })
            else:
                accuracy = prog.correct_answers / max(1, prog.total_attempts)
                accuracy_pct = round(accuracy * 100, 1)

                if accuracy < 0.50:
                    struggling.append({
                        "chapter_id":   ch.chapter_id,
                        "chapter_name": ch.chapter_name,
                        "subject_name": subj.subject_name,
                        "subject_icon": subj.icon,
                        "color_class":  subj.color_class,
                        "type":         "struggling",
                        "reason":       f"Your accuracy is {accuracy_pct}%. Review and retry.",
                        "accuracy_pct": accuracy_pct,
                        "attempts":     prog.total_attempts,
                    })
                elif accuracy >= 0.80:
                    ready.append({
                        "chapter_id":   ch.chapter_id,
                        "chapter_name": ch.chapter_name,
                        "subject_name": subj.subject_name,
                        "subject_icon": subj.icon,
                        "color_class":  subj.color_class,
                        "type":         "ready",
                        "reason":       f"Great work — {accuracy_pct}% accuracy! Challenge yourself further.",
                        "accuracy_pct": accuracy_pct,
                        "attempts":     prog.total_attempts,
                    })

    # Sort struggling by worst accuracy first (most urgent)
    struggling.sort(key=lambda x: x["accuracy_pct"] or 100)

    # Only return first chapter per subject for not_started (avoid overwhelming)
    seen_subjects: set = set()
    filtered_not_started = []
    for item in not_started:
        if item["subject_name"] not in seen_subjects:
            filtered_not_started.append(item)
            seen_subjects.add(item["subject_name"])

    return {
        "struggling":  struggling[:4],           # top 4 weakest
        "not_started": filtered_not_started[:4], # 1 per subject max
        "ready":       ready[:3],                # top 3 mastered
        "summary": {
            "total_struggling":  len(struggling),
            "total_not_started": len(not_started),
            "total_mastered":    len(ready),
        }
    }
