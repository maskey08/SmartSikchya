from pydantic import BaseModel


class QuestionOut(BaseModel):
    question_id:   int
    question_text: str
    question_type: str
    options:       dict | None
    difficulty:    str
    model_config = {"from_attributes": True}


class StartSessionIn(BaseModel):
    chapter_id: int   # user_id comes from JWT now


class StartSessionOut(BaseModel):
    session_id:        int
    questions:         list[QuestionOut]
    target_difficulty: str


class AnswerIn(BaseModel):
    question_id:        int
    given_answer:       str
    time_taken_seconds: int = 0


class AnswerOut(BaseModel):
    is_correct:     bool
    correct_answer: str
    explanation:    str | None
    xp_awarded:     int


class CompleteSessionOut(BaseModel):
    session_id:    int
    total_q:       int
    correct_count: int
    accuracy_pct:  float
    xp_earned:     int
    total_xp:      int
    level:         int
    levelled_up:   bool


class ReviewItem(BaseModel):
    question_id:    int
    question_text:  str
    question_type:  str
    options:        dict | None
    given_answer:   str | None
    correct_answer: str | None
    is_correct:     bool
    difficulty:     str
    xp_awarded:     int


class ReviewOut(BaseModel):
    session_id:     int
    items:          list[ReviewItem]
    total_xp:       int
    level:          int
    recommendation: str | None
