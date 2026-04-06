"""
Admin router — stats, users, subjects, chapters, questions.
All routes require admin role (checked via get_current_admin).
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserXP
from app.models.subject import Subject, Chapter
from app.models.question import Question, QuestionMetadata
from app.models.session import PracticeSession, UserProgress
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard stats ───────────────────────────────────────────────
@router.get("/stats")
async def dashboard_stats(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Correct way to count with async SQLAlchemy
    total_users     = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    total_questions = (await db.execute(select(func.count()).select_from(Question))).scalar() or 0
    total_sessions  = (await db.execute(select(func.count()).select_from(PracticeSession))).scalar() or 0
    total_subjects  = (await db.execute(select(func.count()).select_from(Subject))).scalar() or 0
    completed_sessions = (await db.execute(
        select(func.count()).select_from(PracticeSession).where(PracticeSession.is_completed == True)
    )).scalar() or 0

    # Recent sessions with user email
    recent_result = await db.execute(
        select(PracticeSession)
        .order_by(PracticeSession.start_time.desc())
        .limit(10)
    )
    recent_sessions = []
    for s in recent_result.scalars().all():
        user_r = await db.execute(select(User).where(User.user_id == s.user_id))
        u = user_r.scalar_one_or_none()
        ch_r = await db.execute(select(Chapter).where(Chapter.chapter_id == s.chapter_id))
        ch = ch_r.scalar_one_or_none()
        recent_sessions.append({
            "session_id":    s.session_id,
            "user_email":    u.email if u else "?",
            "user_name":     u.full_name if u else "?",
            "chapter_name":  ch.chapter_name if ch else "?",
            "is_completed":  s.is_completed,
            "correct_count": s.correct_count,
            "total_q":       s.total_q,
            "xp_earned":     s.xp_earned,
            "start_time":    s.start_time.isoformat() if s.start_time else None,
        })

    return {
        "total_users":         total_users,
        "total_questions":     total_questions,
        "total_sessions":      total_sessions,
        "completed_sessions":  completed_sessions,
        "total_subjects":      total_subjects,
        "recent_sessions":     recent_sessions,
    }


# ── Users ─────────────────────────────────────────────────────────
@router.get("/users")
async def list_users(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.user_id))
    users  = result.scalars().all()
    out = []
    for u in users:
        xp_r = await db.execute(select(UserXP).where(UserXP.user_id == u.user_id))
        xp   = xp_r.scalar_one_or_none()
        sess_count = (await db.execute(
            select(func.count()).select_from(PracticeSession).where(PracticeSession.user_id == u.user_id)
        )).scalar() or 0
        out.append({
            "user_id":      u.user_id,
            "full_name":    u.full_name,
            "email":        u.email,
            "role":         u.role,
            "avatar_url":   u.avatar_url,
            "total_xp":     xp.total_xp if xp else 0,
            "level":        xp.level if xp else 1,
            "session_count":sess_count,
            "created_at":   u.created_at.isoformat() if u.created_at else None,
        })
    return out


class UserRoleUpdate(BaseModel):
    role: str

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if body.role not in ("student", "admin"):
        raise HTTPException(400, "role must be 'student' or 'admin'")
    if user_id == current_admin.user_id:
        raise HTTPException(400, "Cannot change your own role")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.role = body.role
    await db.commit()
    return {"message": f"User {user_id} role updated to {body.role}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_admin.user_id:
        raise HTTPException(400, "Cannot delete your own account")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


# ── Subjects ──────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    subject_name: str
    slug: str
    description: str | None = None
    icon: str = "menu_book"
    color_class: str = "bg-primary/10 text-primary"

class SubjectUpdate(BaseModel):
    subject_name: str | None = None
    description:  str | None = None
    icon:         str | None = None
    color_class:  str | None = None

@router.post("/subjects")
async def create_subject(body: SubjectCreate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    s = Subject(**body.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"subject_id": s.subject_id, "message": "Created"}

@router.patch("/subjects/{subject_id}")
async def update_subject(subject_id: int, body: SubjectUpdate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).where(Subject.subject_id == subject_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Subject not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    await db.commit()
    return {"message": "Updated"}

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).where(Subject.subject_id == subject_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Subject not found")
    await db.delete(s)
    await db.commit()
    return {"message": "Deleted"}


# ── Chapters ──────────────────────────────────────────────────────
class ChapterCreate(BaseModel):
    subject_id:   int
    chapter_name: str
    order_num:    int = 1
    description:  str | None = None

class ChapterUpdate(BaseModel):
    chapter_name: str | None  = None
    order_num:    int | None  = None
    description:  str | None  = None
    is_locked:    bool | None = None

@router.post("/chapters")
async def create_chapter(body: ChapterCreate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    ch = Chapter(**body.model_dump())
    db.add(ch)
    await db.commit()
    await db.refresh(ch)
    return {"chapter_id": ch.chapter_id, "message": "Created"}

@router.patch("/chapters/{chapter_id}")
async def update_chapter(chapter_id: int, body: ChapterUpdate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chapter).where(Chapter.chapter_id == chapter_id))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Chapter not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(ch, k, v)
    await db.commit()
    return {"message": "Updated"}

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(chapter_id: int, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Chapter).where(Chapter.chapter_id == chapter_id))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Chapter not found")
    await db.delete(ch)
    await db.commit()
    return {"message": "Deleted"}


# ── Questions ─────────────────────────────────────────────────────
class QuestionCreate(BaseModel):
    subject_id:    int
    chapter_id:    int
    question_text: str
    question_type: int          # 1=mcq, 2=short, 3=fib
    options:       list[str] | None = None
    correct_answer:str
    difficulty:    str = "medium"

class QuestionUpdate(BaseModel):
    question_text: str | None = None
    question_type: int | None = None
    options:       list[str] | None = None
    correct_answer:str | None = None
    difficulty:    str | None = None

@router.get("/questions")
async def list_questions(
    chapter_id: int | None = None,
    subject_id: int | None = None,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Question)
    if chapter_id:
        stmt = stmt.where(Question.chapter_id == chapter_id)
    if subject_id:
        stmt = stmt.where(Question.subject_id == subject_id)
    result    = await db.execute(stmt.order_by(Question.question_id))
    questions = result.scalars().all()

    out = []
    for q in questions:
        meta_r = await db.execute(select(QuestionMetadata).where(QuestionMetadata.question_id == q.question_id))
        meta   = meta_r.scalar_one_or_none()
        out.append({
            "question_id":    q.question_id,
            "subject_id":     q.subject_id,
            "chapter_id":     q.chapter_id,
            "question_text":  q.question_text,
            "question_type":  q.question_type,
            "options":        q.options,
            "correct_answer": q.correct_answer,
            "difficulty":     meta.difficulty_level if meta else "medium",
        })
    return out

@router.post("/questions")
async def create_question(body: QuestionCreate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    q = Question(
        subject_id=body.subject_id,
        chapter_id=body.chapter_id,
        question_text=body.question_text,
        question_type=body.question_type,
        options=body.options,
        correct_answer=body.correct_answer,
    )
    db.add(q)
    await db.flush()
    db.add(QuestionMetadata(question_id=q.question_id, difficulty_level=body.difficulty))
    await db.commit()
    await db.refresh(q)
    return {"question_id": q.question_id, "message": "Created"}

@router.patch("/questions/{question_id}")
async def update_question(question_id: int, body: QuestionUpdate, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.question_id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Question not found")
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "difficulty":
            meta_r = await db.execute(select(QuestionMetadata).where(QuestionMetadata.question_id == question_id))
            meta   = meta_r.scalar_one_or_none()
            if meta:
                meta.difficulty_level = v
            else:
                db.add(QuestionMetadata(question_id=question_id, difficulty_level=v))
        else:
            setattr(q, k, v)
    await db.commit()
    return {"message": "Updated"}

@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, _: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.question_id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(404, "Question not found")
    await db.delete(q)
    await db.commit()
    return {"message": "Deleted"}
