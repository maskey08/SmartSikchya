"""
Auth router — register, login, Google OAuth, logout, /me, refresh, seed-admin.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload 
from app.database import get_db, settings
from app.models.user import User, UserXP
from app.schemas.user import UserRegister, UserLogin, UserOut
from app.services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    set_auth_cookies, clear_auth_cookies,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        last_active_date=user.last_active_date,
        created_at=user.created_at,
    )


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
    result = await db.execute(select(User).options(selectinload(User.xp)).where(User.email == body.email))
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
async def logout(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Try to get user to clear refresh token — but don't error if not found
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


# ── Refresh token ────────────────────────────────────────────────
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


# ── Seed admin — creates first admin account, one-time use ───────
# @router.post("/seed-admin")
# async def seed_admin(db: AsyncSession = Depends(get_db)):
#     """
#     Creates the admin account if none exists.
#     Hit this endpoint ONCE after first deploy.
#     Default: admin@smartsikchya.com / Admin@123
#     Change password immediately after first login.
#     """
#     result = await db.execute(select(User).where(User.role == "admin"))
#     if result.scalar_one_or_none():
#         raise HTTPException(status_code=409, detail="Admin already exists")

#     admin = User(
#         full_name="Admin",
#         email="admin@smartsikchya.com",
#         password_hash=hash_password("Admin@123"),
#         role="admin",
#     )
#     db.add(admin)
#     await db.flush()
#     db.add(UserXP(user_id=admin.user_id, total_xp=0, level=1))
#     await db.commit()
#     return {
#         "message": "Admin created",
#         "email": "admin@smartsikchya.com",
#         "password": "Admin@123",
#         "warning": "Change this password immediately!",
#     }


# ── Google OAuth — Step 1: redirect to Google ────────────────────
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


# ── Google OAuth — Step 2: callback ─────────────────────────────
@router.get("/google/callback")
async def google_callback(code: str, response: Response, db: AsyncSession = Depends(get_db)):
    # Exchange code for Google tokens
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

        tokens = token_resp.json()
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

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if user:
        user.google_id  = google_id
        user.avatar_url = avatar_url
        if not user.full_name:
            user.full_name = name
    else:
        user = User(
            full_name=name,
            email=email,
            google_id=google_id,
            avatar_url=avatar_url,
            role="student",
        )
        db.add(user)
        await db.flush()
        db.add(UserXP(user_id=user.user_id, total_xp=0, level=1))

    access  = create_access_token(user.user_id, user.role)
    refresh = create_refresh_token(user.user_id)
    user.refresh_token = refresh
    await db.commit()

    # Redirect to frontend with cookies set
    redirect = RedirectResponse(f"{settings.FRONTEND_URL}/dashboard")
    redirect.set_cookie("access_token",  access,  httponly=True, samesite="lax", max_age=86400)
    redirect.set_cookie("refresh_token", refresh, httponly=True, samesite="lax", max_age=604800)
    return redirect
