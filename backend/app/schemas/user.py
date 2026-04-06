from pydantic import BaseModel, EmailStr
from datetime import datetime


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
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut


class UserUpdate(BaseModel):
    full_name: str | None = None
