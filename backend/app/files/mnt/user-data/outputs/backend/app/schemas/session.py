from pydantic import BaseModel


# ── Question shape returned to frontend ────────────────────────
class QuestionOut(BaseModel):
    question_id:   int
    question_text: str
    question_type: str           # mcq | fib | short
    options:       dict | None   # only for mcq
    difficulty:    str           # easy | medium | hard

    model_config = {"from_attributes": True}


# ── Start session ───────────────────────────────────────────────
class StartSessionIn(BaseModel):
    chapter_id: int
    user_id:    int              # temp until auth middleware is wired


class StartSessionOut(BaseModel):
    session_id: int
    questions:  list[QuestionOut]
    target_difficulty: str       # what the engine chose for this session


# ── Submit an answer ────────────────────────────────────────────
class AnswerIn(BaseModel):
    question_id:        int
    given_answer:       str
    time_taken_seconds: int = 0


class AnswerOut(BaseModel):
    is_correct:    bool
    correct_answer: str
    explanation:   str | None
    xp_awarded:    int


# ── Complete session ────────────────────────────────────────────
class CompleteSessionOut(BaseModel):
    session_id:    int
    total_q:       int
    correct_count: int
    accuracy_pct:  float
    xp_earned:     int
    total_xp:      int
    level:         int
    levelled_up:   bool


# ── Review item (results screen) ────────────────────────────────
class ReviewItem(BaseModel):
    question_id:    int
    question_text:  str
    question_type:  str
    options:        dict | None
    given_answer:   str | None
    correct_answer: str | None
    explanation:    str | None
    is_correct:     bool
    difficulty:     str
    xp_awarded:     int


class ReviewOut(BaseModel):
    session_id:     int
    items:          list[ReviewItem]
    total_xp:       int
    level:          int
    recommendation: str | None   # simple text recommendation
