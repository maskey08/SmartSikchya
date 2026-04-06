from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id:       Mapped[int]           = mapped_column(Integer, primary_key=True)
    full_name:     Mapped[str | None]    = mapped_column(String(100))
    email:         Mapped[str]           = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str | None]    = mapped_column(Text)
    avatar_url:    Mapped[str | None]    = mapped_column(Text)
    google_id:     Mapped[str | None]    = mapped_column(String(255), unique=True)
    role:          Mapped[str]           = mapped_column(String(20), default="student")
    refresh_token: Mapped[str | None]    = mapped_column(Text)
    created_at:    Mapped[datetime]      = mapped_column(DateTime, server_default=func.now())

    xp:       Mapped["UserXP | None"]         = relationship("UserXP", back_populates="user", uselist=False, lazy="selectin")
    sessions: Mapped[list["PracticeSession"]] = relationship("PracticeSession", back_populates="user", lazy="select")
    progress: Mapped[list["UserProgress"]]    = relationship("UserProgress", back_populates="user", lazy="select")


class UserXP(Base):
    __tablename__ = "user_xp"

    xp_id:      Mapped[int]      = mapped_column(Integer, primary_key=True)
    user_id:    Mapped[int]      = mapped_column(Integer, ForeignKey("users.user_id") ,unique=True, nullable=False)
    total_xp:   Mapped[int]      = mapped_column(Integer, default=0)
    level:      Mapped[int]      = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="xp")