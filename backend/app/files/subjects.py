from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.subject import Subject, Chapter
from app.models.session import UserProgress
from app.schemas.subject import SubjectOut, SubjectDetailOut, ChapterOut

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectOut])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).order_by(Subject.subject_id))
    return result.scalars().all()


@router.get("/{subject_id}", response_model=SubjectDetailOut)
async def get_subject(subject_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subject)
        .where(Subject.subject_id == subject_id)
        .options(selectinload(Subject.chapters))
    )
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.get("/{subject_id}/chapters", response_model=list[ChapterOut])
async def get_chapters(
    subject_id: int,
    user_id: int = 1,        # TODO: replace with auth dependency
    db: AsyncSession = Depends(get_db),
):
    # Fetch chapters
    result = await db.execute(
        select(Chapter)
        .where(Chapter.subject_id == subject_id)
        .order_by(Chapter.order_num)
    )
    chapters = result.scalars().all()

    # Fetch progress for this user+subject
    prog_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.subject_id == subject_id,
        )
    )
    progress_map = {p.chapter_id: p for p in prog_result.scalars().all()}

    # Merge
    out = []
    for ch in chapters:
        prog = progress_map.get(ch.chapter_id)
        accuracy = 0.0
        if prog and prog.total_attempts > 0:
            accuracy = round(prog.correct_answers / prog.total_attempts * 100, 1)
        out.append(ChapterOut(
            chapter_id=ch.chapter_id,
            chapter_name=ch.chapter_name,
            order_num=ch.order_num,
            description=ch.description,
            is_locked=ch.is_locked,
            total_attempts=prog.total_attempts if prog else 0,
            correct_answers=prog.correct_answers if prog else 0,
            accuracy_pct=accuracy,
        ))
    return out
