from datetime import datetime
from sqlalchemy import Integer, Text, Boolean, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    session_id:    Mapped[int]           = mapped_column(Integer, primary_key=True)
    user_id:       Mapped[int | None]    = mapped_column(Integer)
    subject_id:    Mapped[int | None]    = mapped_column(Integer)
    chapter_id:    Mapped[int | None]    = mapped_column(Integer)
    start_time:    Mapped[datetime | None] = mapped_column(DateTime, server_default=func.now())
    end_time:      Mapped[datetime | None] = mapped_column(DateTime)
    total_q:       Mapped[int]           = mapped_column(Integer, default=0)
    correct_count: Mapped[int]           = mapped_column(Integer, default=0)
    xp_earned:     Mapped[int]           = mapped_column(Integer, default=0)
    is_completed:  Mapped[bool]          = mapped_column(Boolean, default=False)

    user:      Mapped["User"]                   = relationship("User", back_populates="sessions")
    responses: Mapped[list["SessionResponse"]]  = relationship("SessionResponse", back_populates="session")


class SessionResponse(Base):
    __tablename__ = "session_responses"

    response_id:       Mapped[int]         = mapped_column(Integer, primary_key=True)
    session_id:        Mapped[int | None]  = mapped_column(Integer)
    question_id:       Mapped[int | None]  = mapped_column(Integer)
    chapter_id:        Mapped[int | None]  = mapped_column(Integer)
    given_answer:      Mapped[str | None]  = mapped_column(Text)
    is_correct:        Mapped[bool | None] = mapped_column(Boolean)
    time_taken_seconds:Mapped[int | None]  = mapped_column(Integer)
    xp_awarded:        Mapped[int]         = mapped_column(Integer, default=0)

    session: Mapped["PracticeSession"] = relationship("PracticeSession", back_populates="responses")


class UserProgress(Base):
    __tablename__ = "user_progress"

    progress_id:    Mapped[int]          = mapped_column(Integer, primary_key=True)
    user_id:        Mapped[int | None]   = mapped_column(Integer)
    subject_id:     Mapped[int | None]   = mapped_column(Integer)
    chapter_id:     Mapped[int | None]   = mapped_column(Integer)
    total_attempts: Mapped[int]          = mapped_column(Integer, default=0)
    correct_answers:Mapped[int]          = mapped_column(Integer, default=0)
    weakness_score: Mapped[float | None] = mapped_column(Float)  # 0=strong, 1=weak

    user: Mapped["User"] = relationship("User", back_populates="progress")
