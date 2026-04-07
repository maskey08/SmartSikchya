"""
Adaptive question selection engine.
Rule-based difficulty selection — DistilBERT plugs in here later.
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.session import UserProgress
from app.models.question import Question, QuestionMetadata

XP_MAP = {"easy": 10, "medium": 20, "hard": 30}
SESSION_COMPLETION_BONUS = 50
XP_PER_LEVEL = 500


async def get_target_difficulty(
    db: AsyncSession,
    user_id: int,
    chapter_id: int,
) -> str:
    """
    Rule-based difficulty selection based on historical accuracy:
      - No history       → medium
      - accuracy < 40%   → easy
      - accuracy 40-70%  → medium
      - accuracy > 70%   → hard
    """
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.chapter_id == chapter_id,
        )
    )
    progress = result.scalar_one_or_none()

    if not progress or progress.total_attempts == 0:
        return "medium"

    accuracy = progress.correct_answers / progress.total_attempts
    if accuracy < 0.40:
        return "easy"
    elif accuracy <= 0.70:
        return "medium"
    else:
        return "hard"


async def get_questions_for_session(
    db: AsyncSession,
    chapter_id: int,
    target_difficulty: str,
    limit: int = 10,
) -> list[Question]:
    """
    Fetch questions with metadata eagerly loaded (avoids MissingGreenlet error).
    Strategy: 60% target difficulty, 20% below, 20% above.
    Falls back to any chapter question if counts are insufficient.
    """
    difficulty_order = ["easy", "medium", "hard"]
    idx   = difficulty_order.index(target_difficulty)
    below = difficulty_order[max(0, idx - 1)]
    above = difficulty_order[min(2, idx + 1)]

    target_count = max(1, int(limit * 0.6))
    other_count  = max(1, int(limit * 0.2))

    async def fetch(difficulty: str, count: int) -> list[Question]:
        stmt = (
            select(Question)
            .join(QuestionMetadata, QuestionMetadata.question_id == Question.question_id)
            .where(
                Question.chapter_id == chapter_id,
                QuestionMetadata.difficulty_level == difficulty,
            )
            # ← CRITICAL: eager-load metadata so async sessions don't lazy-load later
            .options(selectinload(Question.metadata_))
            .order_by(func.random())
            .limit(count)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    questions = await fetch(target_difficulty, target_count)

    if len(questions) < limit:
        extra = await fetch(below, other_count)
        seen  = {q.question_id for q in questions}
        questions += [q for q in extra if q.question_id not in seen]

    if len(questions) < limit:
        extra = await fetch(above, other_count)
        seen  = {q.question_id for q in questions}
        questions += [q for q in extra if q.question_id not in seen]

    # Final fallback: any question in this chapter
    if len(questions) < limit:
        ids_seen = [q.question_id for q in questions]
        stmt = (
            select(Question)
            .where(
                Question.chapter_id == chapter_id,
                Question.question_id.not_in(ids_seen) if ids_seen else True,
            )
            .options(selectinload(Question.metadata_))  # ← eager load here too
            .order_by(func.random())
            .limit(limit - len(questions))
        )
        result = await db.execute(stmt)
        questions += list(result.scalars().all())

    return questions[:limit]


def calculate_xp(difficulty: str, is_correct: bool) -> int:
    if not is_correct:
        return 0
    return XP_MAP.get(difficulty, 10)


def calculate_level(total_xp: int) -> int:
    return max(1, total_xp // XP_PER_LEVEL + 1)


def build_recommendation(accuracy: float, target_difficulty: str) -> str:
    pct = int(accuracy * 100)
    if accuracy >= 0.80:
        return (
            f"Excellent! {pct}% accuracy. You're mastering this chapter. "
            f"Try harder chapters or subjects to keep growing."
        )
    elif accuracy >= 0.50:
        return (
            f"Good effort! {pct}% accuracy. Review the questions you got wrong "
            f"and try again — aim for 80%+."
        )
    else:
        return (
            f"Keep practising! {pct}% accuracy. Focus on understanding the explanations "
            f"for wrong answers. You'll improve with repetition."
        )
