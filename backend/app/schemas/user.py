from pydantic import BaseModel, EmailStr
from datetime import datetime,date


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    user_id:    int
    full_name:  str | None
    email:      str
    avatar_url: str | None
    role:       str
    total_xp:   int = 0
    level:      int = 1
    # Streaks included in /me response so sidebar always has them
    current_streak:  int = 0
    longest_streak:  int = 0
    last_active_date: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


class UserUpdate(BaseModel):
    full_name: str | None = None
