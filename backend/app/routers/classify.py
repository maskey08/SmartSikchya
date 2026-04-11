"""
classify.py — Admin-only endpoint to run DistilBERT on questions.

WHY a separate router and not inside admin.py?
Admin.py is getting large. Classifier is a distinct concern — it's
an AI pipeline action, not a CRUD operation. Keeping it separate
makes it easier to disable or replace later.

Endpoints:
  POST /classify/questions — classify all unclassified questions
  POST /classify/question/{id} — classify a single question
  GET  /classify/status — check if model is loaded
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.question import Question, QuestionMetadata
from app.models.user import User
from app.services.auth_service import get_current_admin
from app.services.classifier import classify_batch, classify_difficulty, is_model_available

router = APIRouter(prefix="/classify", tags=["classify"])


@router.get("/status")
async def classifier_status(_: User = Depends(get_current_admin)):
    """Check if the DistilBERT model is available."""
    available = is_model_available()
    return {
        "model_available": available,
        "message": (
            "DistilBERT model is loaded and ready."
            if available
            else "Model not found. Train the model first (see models/train.py)."
        )
    }


@router.post("/question/{question_id}")
async def classify_single(
    question_id: int,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Classify a single question's difficulty using DistilBERT."""
    if not is_model_available():
        raise HTTPException(503, "DistilBERT model not loaded. Train it first.")

    result = await db.execute(select(Question).where(Question.question_id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Question not found")

    difficulty = classify_difficulty(q.question_text)

    # Update or create metadata row
    meta_result = await db.execute(
        select(QuestionMetadata).where(QuestionMetadata.question_id == question_id)
    )
    meta = meta_result.scalar_one_or_none()
    if meta:
        old = meta.difficulty_level
        meta.difficulty_level = difficulty
    else:
        meta = QuestionMetadata(question_id=question_id, difficulty_level=difficulty)
        db.add(meta)
        old = None

    await db.commit()
    return {
        "question_id":    question_id,
        "question_text":  q.question_text,
        "old_difficulty": old,
        "new_difficulty": difficulty,
        "message": "Classified successfully",
    }


@router.post("/questions")
async def classify_all_questions(
    overwrite: bool = False,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Classify all questions using DistilBERT.

    overwrite=False (default): Only classifies questions with no label yet.
    overwrite=True: Re-classifies ALL questions (overwrites existing labels).

    WHY batch processing?
    Running DistilBERT one question at a time is slow because each call
    loads data into the model separately. Batching 16 questions at once
    is ~5x faster due to parallelism in matrix operations.
    """
    if not is_model_available():
        raise HTTPException(
            503,
            "DistilBERT model not loaded. "
            "Run models/train.py first, then copy models/saved_model/ to backend/app/ai/difficulty_model/"
        )

    # Fetch questions to classify
    stmt = select(Question)
    if not overwrite:
        # Only questions that don't have a metadata row OR have NULL difficulty
        from sqlalchemy import outerjoin
        stmt = (
            select(Question)
            .outerjoin(QuestionMetadata, QuestionMetadata.question_id == Question.question_id)
            .where(
                (QuestionMetadata.question_id == None) |
                (QuestionMetadata.difficulty_level == None)
            )
        )

    result    = await db.execute(stmt)
    questions = result.scalars().all()

    if not questions:
        return {"message": "No questions to classify", "classified_count": 0}

    # Batch classify
    texts  = [q.question_text for q in questions]
    labels = classify_batch(texts)

    updated = 0
    for q, label in zip(questions, labels):
        meta_result = await db.execute(
            select(QuestionMetadata).where(QuestionMetadata.question_id == q.question_id)
        )
        meta = meta_result.scalar_one_or_none()
        if meta:
            meta.difficulty_level = label
        else:
            db.add(QuestionMetadata(question_id=q.question_id, difficulty_level=label))
        updated += 1

    await db.commit()

    # Return summary
    from collections import Counter
    label_counts = dict(Counter(labels))
    return {
        "message":          f"Classified {updated} questions",
        "classified_count": updated,
        "label_distribution": label_counts,
    }
