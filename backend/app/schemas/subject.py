from pydantic import BaseModel


class ChapterOut(BaseModel):
    chapter_id:   int
    chapter_name: str
    order_num:    int
    description:  str | None
    is_locked:    bool

    # progress fields injected by the endpoint (not in DB model)
    total_attempts: int   = 0
    correct_answers: int  = 0
    accuracy_pct:   float = 0.0

    model_config = {"from_attributes": True}


class SubjectOut(BaseModel):
    subject_id:   int
    subject_name: str
    slug:         str | None
    description:  str | None
    icon:         str | None
    color_class:  str | None

    model_config = {"from_attributes": True}


class SubjectDetailOut(SubjectOut):
    chapters: list[ChapterOut] = []
