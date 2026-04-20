from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import settings, engine, Base
from app.routers import subjects, sessions, auth, admin, exam, progress, recommendations, classify, ocr

app = FastAPI(
    title="SmartSikshya API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,      # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(recommendations.router)
app.include_router(exam.router)
app.include_router(classify.router)
app.include_router(ocr.router)
app.include_router(admin.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SmartSikshya API v2"}
