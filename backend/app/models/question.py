from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class QuestionType(Base):
    """Lookup table: 1=mcq, 2=short, 3=fill in the blanks"""
    __tablename__ = "question_type"

    question_type_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type_name:        Mapped[str] = mapped_column(Text, nullable=False)


class Question(Base):
    __tablename__ = "questions"

    question_id:    Mapped[int]         = mapped_column(Integer, primary_key=True)
    subject_id:     Mapped[int | None]  = mapped_column(Integer, ForeignKey("subjects.subject_id"))
    chapter_id:     Mapped[int | None]  = mapped_column(Integer, ForeignKey("chapters.chapter_id"))
    question_text:  Mapped[str]         = mapped_column(Text, nullable=False)
    # options: JSON array ["opt1","opt2","opt3","opt4"] for MCQ, NULL for others
    options:        Mapped[list | None] = mapped_column(JSON)
    correct_answer: Mapped[str | None]  = mapped_column(Text)
    # question_type: integer FK → question_type table (1=mcq, 2=short, 3=fib)
    question_type:  Mapped[int | None]  = mapped_column(Integer, ForeignKey("question_type.question_type_id"))
    created_at:     Mapped[datetime]    = mapped_column(DateTime, server_default=func.now())

    chapter:   Mapped["Chapter"]                 = relationship("Chapter", back_populates="questions")
    metadata_: Mapped["QuestionMetadata | None"] = relationship(
        "QuestionMetadata",
        back_populates="question",
        uselist=False,
        foreign_keys="QuestionMetadata.question_id",
        lazy="select",
    )
    type_info: Mapped["QuestionType | None"] = relationship(
        "QuestionType",
        foreign_keys=[question_type],
        lazy="select",
    )


class QuestionMetadata(Base):
    __tablename__ = "question_metadata"

    question_id:      Mapped[int]         = mapped_column(Integer, ForeignKey("questions.question_id", ondelete="CASCADE"), primary_key=True)
    difficulty_level: Mapped[str | None]  = mapped_column(String(10))
    embedding_vector: Mapped[dict | None] = mapped_column(JSON)

    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="metadata_",
        foreign_keys=[question_id],
    )