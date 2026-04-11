"""
streak_service.py — Updates streak on the User model directly.
No separate table — streak lives in users.current_streak / longest_streak / last_active_date.
Called after every completed session (practice or exam).
"""
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


async def update_streak(db: AsyncSession, user_id: int) -> dict:
    today = date.today()

    result = await db.execute(select(User).where(User.user_id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        return {"current_streak": 0, "longest_streak": 0, "is_new_day": False}

    last = user.last_active_date

    if last == today:
        # Already counted today
        return {"current_streak": user.current_streak, "longest_streak": user.longest_streak, "is_new_day": False}

    if last == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1   # reset

    user.last_active_date = today
    user.longest_streak   = max(user.longest_streak, user.current_streak)
    await db.commit()

    return {"current_streak": user.current_streak, "longest_streak": user.longest_streak, "is_new_day": True}
