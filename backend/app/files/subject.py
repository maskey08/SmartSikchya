from sqlalchemy import Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    subject_id:  Mapped[int]          = mapped_column(Integer, primary_key=True)
    subject_name:Mapped[str]          = mapped_column(String(100), nullable=False)
    slug:        Mapped[str | None]   = mapped_column(String(120), unique=True)
    description: Mapped[str | None]   = mapped_column(Text)
    icon:        Mapped[str | None]   = mapped_column(String(80), default="menu_book")
    color_class: Mapped[str | None]   = mapped_column(String(120), default="bg-primary/10 text-primary")

    chapters:    Mapped[list["Chapter"]] = relationship("Chapter", back_populates="subject", order_by="Chapter.order_num")


class Chapter(Base):
    __tablename__ = "chapters"

    chapter_id:  Mapped[int]          = mapped_column(Integer, primary_key=True)
    subject_id:  Mapped[int | None]   = mapped_column(Integer, nullable=True)
    chapter_name:Mapped[str]          = mapped_column(String(150), nullable=False)
    order_num:   Mapped[int]          = mapped_column(Integer, default=1)
    description: Mapped[str | None]   = mapped_column(Text)
    is_locked:   Mapped[bool]         = mapped_column(Boolean, default=False)

    subject:     Mapped["Subject"]       = relationship("Subject", back_populates="chapters")
    questions:   Mapped[list["Question"]]= relationship("Question", back_populates="chapter")
