"""
Auth router — register, login, Google OAuth, logout, /me, refresh,
change-password, forgot-password / reset-password, seed-admin.
"""
import httpx
import secrets
import string
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, settings
from app.models.user import User, UserXP
from app.schemas.user import UserRegister, UserLogin, UserOut, UserUpdate
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP store  {email: {otp, expires_at}}
# Good enough for a single-process dev/demo server.
# For multi-process prod: replace with a Redis or DB table.
_otp_store: dict[str, dict] = {}


# ── Pydantic models (all together at the top) ────────────────────
class ChangePasswordIn(BaseModel):
    current_password: str
    new_password:     str

class ForgotPasswordIn(BaseModel):
    email: str

class VerifyOTPIn(BaseModel):
    email: str
    otp:   str

class ResetPasswordIn(BaseModel):
    email:        str
    otp:          str
    new_password: str


# ── Helpers ──────────────────────────────────────────────────────
def _user_out(user: User) -> UserOut:
    xp = user.xp
    return UserOut(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        avatar_url=user.avatar_url,
        role=user.role,
        total_xp=xp.total_xp if xp else 0,
        level=xp.level if xp else 1,
        created_at=user.created_at,
    )

def _generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


# ── Register ─────────────────────────────────────────────────────
@router.post("/register", response_model=UserOut)
async def register(body: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        full_name=body.full_name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="student",
    )
    db.add(user)
    await db.flush()
    db.add(UserXP(user_id=user.user_id, total_xp=0, level=1))

    access  = create_access_token(user.user_id, user.role)
    refresh = create_refresh_token(user.user_id)
    user.refresh_token = refresh
    await db.commit()
    await db.refresh(user)
    set_auth_cookies(response, access, refresh)
    return _user_out(user)


# ── Login ────────────────────────────────────────────────────────
@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access  = create_access_token(user.user_id, user.role)
    refresh = create_refresh_token(user.user_id)
    user.refresh_token = refresh
    await db.commit()
    await db.refresh(user)
    set_auth_cookies(response, access, refresh)
    return _user_out(user)


# ── /me ──────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return _user_out(user)


# ── Logout ───────────────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("access_token")
    if token:
        try:
            payload = decode_token(token)
            user_id = int(payload.get("sub", 0))
            result  = await db.execute(select(User).where(User.user_id == user_id))
            user    = result.scalar_one_or_none()
            if user:
                user.refresh_token = None
                await db.commit()
        except Exception:
            pass
    clear_auth_cookies(response)
    return {"message": "Logged out"}


# ── Refresh token ─────────────────────────────────────────────────
@router.post("/refresh", response_model=UserOut)
async def refresh_token_endpoint(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = int(payload["sub"])
    result  = await db.execute(select(User).where(User.user_id == user_id))
    user    = result.scalar_one_or_none()

    if not user or user.refresh_token != token:
        raise HTTPException(status_code=401, detail="Token revoked or invalid")

    access  = create_access_token(user.user_id, user.role)
    refresh = create_refresh_token(user.user_id)
    user.refresh_token = refresh
    await db.commit()
    await db.refresh(user)
    set_auth_cookies(response, access, refresh)
    return _user_out(user)


# ── Seed admin ────────────────────────────────────────────────────
@router.post("/seed-admin")
async def seed_admin(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == "admin"))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Admin already exists")

    admin = User(
        full_name="Admin",
        email="admin@smartsikshya.com",
        password_hash=hash_password("SmartAdmin123!"),
        role="admin",
    )
    db.add(admin)
    await db.flush()
    db.add(UserXP(user_id=admin.user_id, total_xp=0, level=1))
    await db.commit()
    return {
        "message":  "Admin created",
        "email":    "admin@smartsikshya.com",
        "password": "SmartAdmin123!",
        "warning":  "Change this password immediately!",
    }


# ── Google OAuth ─────────────────────────────────────────────────
@router.get("/google")
async def google_login():
    from urllib.parse import urlencode
    params = urlencode({
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  f"{settings.BACKEND_URL}/auth/google/callback",
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri":  f"{settings.BACKEND_URL}/auth/google/callback",
                "grant_type":    "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_failed")

        tokens       = token_resp.json()
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        info = userinfo_resp.json()

    google_id  = info.get("sub")
    email      = info.get("email")
    name       = info.get("name")
    avatar_url = info.get("picture")

    if not email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=no_email")

    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if user:
        user.google_id  = google_id
        user.avatar_url = avatar_url
        if not user.full_name:
            user.full_name = name
    else:
        user = User(
            full_name=name, email=email,
            google_id=google_id, avatar_url=avatar_url, role="student",
        )
        db.add(user)
        await db.flush()
        db.add(UserXP(user_id=user.user_id, total_xp=0, level=1))

    access  = create_access_token(user.user_id, user.role)
    refresh = create_refresh_token(user.user_id)
    user.refresh_token = refresh
    await db.commit()

    redirect = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    redirect.set_cookie("access_token",  access,  httponly=True, samesite="lax", max_age=86400)
    redirect.set_cookie("refresh_token", refresh, httponly=True, samesite="lax", max_age=604800)
    return redirect


# ── Update profile ────────────────────────────────────────────────
@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession   = Depends(get_db),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    await db.commit()
    await db.refresh(current_user)
    return _user_out(current_user)


# ── Change password (logged-in user) ─────────────────────────────
@router.post("/change-password")
async def change_password(
    body: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession   = Depends(get_db),
):
    if current_user.password_hash:
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}


# ── Delete account ────────────────────────────────────────────────
@router.delete("/me")
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession   = Depends(get_db),
):
    await db.delete(current_user)
    await db.commit()
    clear_auth_cookies(response)
    return {"message": "Account deleted"}


# ── Forgot password — Step 1: request OTP ────────────────────────
@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordIn,
    db: AsyncSession = Depends(get_db),
):
    """
    Always returns 200 regardless of whether the email exists —
    avoids leaking which emails are registered.
    OTP is printed to the backend console if SMTP is not configured.
    """
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user   = result.scalar_one_or_none()

    if user:
        otp = _generate_otp()
        _otp_store[body.email.lower().strip()] = {
            "otp":        otp,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
        }
        print(f"\n[PASSWORD RESET] OTP for {body.email}: {otp}  (valid 15 min)\n")

        # Send email if SMTP is configured in .env
        try:
            import smtplib
            from email.mime.text import MIMEText
            smtp_host = getattr(settings, "SMTP_HOST", None)
            smtp_user = getattr(settings, "SMTP_USER", None)
            smtp_pass = getattr(settings, "SMTP_PASS", None)
            if smtp_host and smtp_user and smtp_pass:
                msg = MIMEText(
                    f"Your SmartSikshya password reset code is: {otp}\n\n"
                    f"This code expires in 15 minutes.\n\n"
                    f"If you did not request this, ignore this email."
                )
                msg["Subject"] = "SmartSikshya — Password Reset Code"
                msg["From"]    = smtp_user
                msg["To"]      = body.email
                with smtplib.SMTP_SSL(smtp_host, 465) as s:
                    s.login(smtp_user, smtp_pass)
                    s.send_message(msg)
        except Exception as e:
            print(f"[EMAIL] Send failed: {e}. OTP is in console above.")

    return {"message": "If that email is registered, a reset code has been sent."}


# ── Forgot password — Step 2: verify OTP ─────────────────────────
@router.post("/verify-otp")
async def verify_otp(body: VerifyOTPIn):
    email  = body.email.lower().strip()
    record = _otp_store.get(email)
    if not record:
        raise HTTPException(400, "No reset code found. Request a new one.")
    if datetime.now(timezone.utc) > record["expires_at"]:
        _otp_store.pop(email, None)
        raise HTTPException(400, "Code has expired. Request a new one.")
    if record["otp"] != body.otp.strip():
        raise HTTPException(400, "Invalid code.")
    return {"message": "Code verified. Proceed to set new password."}


# ── Forgot password — Step 3: set new password ───────────────────
@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordIn,
    db: AsyncSession = Depends(get_db),
):
    email  = body.email.lower().strip()
    record = _otp_store.get(email)

    if not record:
        raise HTTPException(400, "No reset code found. Request a new one.")
    if datetime.now(timezone.utc) > record["expires_at"]:
        _otp_store.pop(email, None)
        raise HTTPException(400, "Code has expired. Request a new one.")
    if record["otp"] != body.otp.strip():
        raise HTTPException(400, "Invalid code.")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    user.password_hash = hash_password(body.new_password)
    await db.commit()
    _otp_store.pop(email, None)   # consumed — single use
    return {"message": "Password reset successfully. You can now log in."}