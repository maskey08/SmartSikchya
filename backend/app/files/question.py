from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    question_id:   Mapped[int]         = mapped_column(Integer, primary_key=True)
    subject_id:    Mapped[int | None]  = mapped_column(Integer)
    chapter_id:    Mapped[int | None]  = mapped_column(Integer)
    question_text: Mapped[str]         = mapped_column(Text, nullable=False)
    question_type: Mapped[str]         = mapped_column(String(10), default="mcq")  # mcq | fib | short
    options:       Mapped[dict | None] = mapped_column(JSON)                        # {"A": "...", "B": "..."}
    correct_answer:Mapped[str | None]  = mapped_column(Text)
    explanation:   Mapped[str | None]  = mapped_column(Text)
    created_at:    Mapped[datetime]    = mapped_column(DateTime, server_default=func.now())

    chapter:   Mapped["Chapter"]            = relationship("Chapter", back_populates="questions")
    metadata_: Mapped["QuestionMetadata | None"] = relationship("QuestionMetadata", back_populates="question", uselist=False)


class QuestionMetadata(Base):
    __tablename__ = "question_metadata"

    question_id:      Mapped[int]          = mapped_column(Integer, primary_key=True)
    difficulty_level: Mapped[str | None]   = mapped_column(String(10))  # easy | medium | hard
    embedding_vector: Mapped[dict | None]  = mapped_column(JSON)         # reserved for DistilBERT

    question: Mapped["Question"] = relationship("Question", back_populates="metadata_")
