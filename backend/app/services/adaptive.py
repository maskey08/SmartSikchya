"""
Adaptive question selection engine.

Current implementation: rule-based on user's historical accuracy.
Future: swap get_target_difficulty() to call DistilBERT classifier
that reads question text and returns predicted difficulty.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import UserProgress
from app.models.question import Question, QuestionMetadata


# XP awarded per difficulty
XP_MAP = {"easy": 10, "medium": 20, "hard": 30}
SESSION_COMPLETION_BONUS = 50
XP_PER_LEVEL = 500


async def get_target_difficulty(
    db: AsyncSession,
    user_id: int,
    chapter_id: int,
) -> str:
    """
    Rule-based difficulty selection:
    - No history       → medium (balanced start)
    - accuracy < 40%   → easy   (struggling)
    - accuracy 40–70%  → medium (on track)
    - accuracy > 70%   → hard   (push further)
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
    Fetch questions for a session.
    Strategy:
    - 60% target difficulty
    - 20% one level below (consolidation)
    - 20% one level above (stretch)

    Falls back to any available questions if counts are low.
    """
    difficulty_order = ["easy", "medium", "hard"]
    idx = difficulty_order.index(target_difficulty)
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
            .order_by(func.random())
            .limit(count)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    questions = await fetch(target_difficulty, target_count)

    # Fill with easier/harder if not enough at target difficulty
    if len(questions) < limit:
        questions += await fetch(below, other_count)
    if len(questions) < limit:
        questions += await fetch(above, other_count)

    # If still short, grab any from chapter (no difficulty filter)
    if len(questions) < limit:
        ids_seen = [q.question_id for q in questions]
        stmt = (
            select(Question)
            .where(
                Question.chapter_id == chapter_id,
                ~Question.question_id.in_(ids_seen),
            )
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
    if accuracy >= 0.80:
        return (
            f"Great work! You're mastering this chapter. "
            f"Try a harder chapter next, or tackle more {target_difficulty} questions to solidify."
        )
    elif accuracy >= 0.50:
        return (
            f"Good effort! Accuracy at {int(accuracy*100)}%. "
            f"Review the questions you got wrong and try again to push past 80%."
        )
    else:
        return (
            f"This chapter needs more practice. Accuracy at {int(accuracy*100)}%. "
            f"Focus on the explanations for wrong answers — you'll get there."
        )
