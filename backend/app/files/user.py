from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id:       Mapped[int]           = mapped_column(Integer, primary_key=True)
    full_name:     Mapped[str | None]    = mapped_column(String(100))
    email:         Mapped[str]           = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str | None]    = mapped_column(Text)          # nullable for Google users
    avatar_url:    Mapped[str | None]    = mapped_column(Text)
    google_id:     Mapped[str | None]    = mapped_column(String(255), unique=True)
    created_at:    Mapped[datetime]      = mapped_column(DateTime, server_default=func.now())

    # relationships
    xp:            Mapped["UserXP | None"]         = relationship("UserXP", back_populates="user", uselist=False)
    sessions:      Mapped[list["PracticeSession"]] = relationship("PracticeSession", back_populates="user")
    progress:      Mapped[list["UserProgress"]]    = relationship("UserProgress", back_populates="user")


class UserXP(Base):
    __tablename__ = "user_xp"

    xp_id:      Mapped[int]      = mapped_column(Integer, primary_key=True)
    user_id:    Mapped[int]      = mapped_column(Integer, nullable=False, unique=True)
    total_xp:   Mapped[int]      = mapped_column(Integer, default=0)
    level:      Mapped[int]      = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="xp")
