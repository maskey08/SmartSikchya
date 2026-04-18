"""
irt_service.py — Item Response Theory (IRT) adaptive engine.

THEORY: 2-Parameter Logistic (2PL) IRT Model
─────────────────────────────────────────────
P(correct | θ, a, b) = 1 / (1 + exp(-a * (θ - b)))

Where:
  θ (theta) = student's latent ability estimate  [-3, +3] scale
  b         = question difficulty parameter       [-3, +3]
  a         = question discrimination parameter   [0.5, 2.5] (how well a
              question distinguishes ability levels)

WHY 2PL and not 3PL?
3PL adds a guessing parameter (c). For a practice platform where students
are not under exam pressure, guessing is less of a concern than in a
standardised test setting. 2PL is simpler to estimate and still vastly
superior to the original rule-based approach.

ABILITY ESTIMATION: MAP (Maximum A Posteriori)
Instead of running the full EM algorithm (expensive), we use a Newton-
Raphson step after every answer to update θ. This gives us:
  - O(1) per-answer update (very fast)
  - Reasonable convergence within 5–10 answers per session
  - A Gaussian prior N(0,1) that prevents runaway estimates

DIFFICULTY MAPPING:
  DistilBERT labels → IRT b parameters (seeded values, updated by EM later)
  'easy'   → b = -1.0   (θ=0 student has ~73% chance)
  'medium' → b =  0.0   (θ=0 student has 50% chance)
  'hard'   → b =  1.0   (θ=0 student has ~27% chance)
  Default a = 1.0 (moderate discrimination)

SESSION WORKFLOW:
  1. get_initial_theta(user_id, chapter_id) → θ₀
     Loads prior ability from user_irt_params or uses population mean (0.0)
  2. select_question_irt(questions, θ) → question_id
     Picks question maximising Fisher Information at current θ:
     I(θ) = a² * P(1-P)   (most information at b closest to θ)
  3. update_theta(θ, a, b, correct) → θ_new
     One Newton-Raphson MAP update step
  4. save_theta(user_id, chapter_id, θ_new)
     Persists updated ability for next session

DB TABLE NEEDED:
  user_irt_params (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    chapter_id  INTEGER REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    theta       FLOAT DEFAULT 0.0,
    responses   INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
  )

  question_irt_params (
    question_id  INTEGER PRIMARY KEY REFERENCES questions(question_id),
    b_param      FLOAT DEFAULT 0.0,   -- difficulty
    a_param      FLOAT DEFAULT 1.0,   -- discrimination
    n_responses  INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
  )
"""
import math
from datetime import datetime
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession


# ── Probability ───────────────────────────────────────────────
def irt_probability(theta: float, a: float, b: float) -> float:
    """
    2PL IRT probability of a correct response.
    Clipped to [0.001, 0.999] to avoid log(0) in update steps.
    """
    return max(0.001, min(0.999, 1.0 / (1.0 + math.exp(-a * (theta - b)))))


# ── Fisher Information ────────────────────────────────────────
def fisher_information(theta: float, a: float, b: float) -> float:
    """
    Information a question provides about ability θ.
    Maximum when b == θ (question is perfectly matched to student).
    I(θ) = a² * P(θ) * (1 - P(θ))
    """
    p = irt_probability(theta, a, b)
    return (a ** 2) * p * (1.0 - p)


# ── Theta update (MAP Newton-Raphson) ────────────────────────
def update_theta(
    theta:   float,
    a:       float,
    b:       float,
    correct: bool,
    prior_mean: float = 0.0,
    prior_var:  float = 1.0,
) -> float:
    """
    One Newton-Raphson step for MAP estimation of θ.

    The MAP objective (log-posterior):
      L(θ) = log P(correct|θ) - (θ - μ)² / (2σ²)

    First derivative (score function):
      L'(θ) = a*(y - P) - (θ - μ)/σ²
      where y=1 if correct, y=0 if incorrect

    Second derivative (observed information):
      L''(θ) = -a²*P*(1-P) - 1/σ²

    Newton step:
      θ_new = θ - L'(θ) / L''(θ)

    θ is clamped to [-4, +4] to prevent divergence.
    """
    p = irt_probability(theta, a, b)
    y = 1.0 if correct else 0.0
    numerator   = a * (y - p) - (theta - prior_mean) / prior_var
    denominator = -(a ** 2) * p * (1.0 - p) - 1.0 / prior_var
    if abs(denominator) < 1e-10:
        return theta   # safeguard against divide-by-zero
    new_theta = theta - numerator / denominator
    return max(-4.0, min(4.0, new_theta))


# ── Difficulty label → IRT parameters ────────────────────────
DIFFICULTY_TO_B = {"easy": -1.0, "medium": 0.0, "hard": 1.0}
DEFAULT_A = 1.0

def difficulty_label_to_b(label: str) -> float:
    return DIFFICULTY_TO_B.get(label.lower(), 0.0)

def theta_to_difficulty_label(theta: float) -> str:
    """Convert ability estimate to a question-selection target label."""
    if theta < -0.5:
        return "easy"
    elif theta > 0.5:
        return "hard"
    return "medium"


# ── Question selection ────────────────────────────────────────
def select_question_by_information(
    question_params: list[dict],  # [{"question_id": int, "a": float, "b": float}]
    theta: float,
    already_used: set[int],
) -> int | None:
    """
    Maximum Information selection: pick the question with highest
    Fisher Information at the student's current θ, excluding already-used questions.

    Returns question_id or None if no questions available.
    """
    best_id   = None
    best_info = -1.0
    for qp in question_params:
        if qp["question_id"] in already_used:
            continue
        info = fisher_information(theta, qp["a"], qp["b"])
        if info > best_info:
            best_info = info
            best_id   = qp["question_id"]
    return best_id


# ── DB helpers ────────────────────────────────────────────────
async def get_user_theta(
    db: AsyncSession,
    user_id: int,
    chapter_id: int,
) -> float:
    """Load user's current θ estimate for a chapter. Returns 0.0 (population mean) if first visit."""
    try:
        result = await db.execute(
            text("SELECT theta FROM user_irt_params WHERE user_id=:u AND chapter_id=:c"),
            {"u": user_id, "c": chapter_id}
        )
        row = result.fetchone()
        return float(row[0]) if row else 0.0
    except Exception:
        return 0.0


async def save_user_theta(
    db: AsyncSession,
    user_id: int,
    chapter_id: int,
    theta: float,
) -> None:
    """Upsert user θ into user_irt_params table."""
    try:
        await db.execute(
            text("""
                INSERT INTO user_irt_params (user_id, chapter_id, theta, responses, last_updated)
                VALUES (:u, :c, :t, 1, NOW())
                ON CONFLICT (user_id, chapter_id)
                DO UPDATE SET
                    theta       = :t,
                    responses   = user_irt_params.responses + 1,
                    last_updated = NOW()
            """),
            {"u": user_id, "c": chapter_id, "t": round(theta, 4)}
        )
        await db.commit()
    except Exception:
        pass   # non-fatal: next session just starts from 0


async def get_question_irt_params(
    db: AsyncSession,
    chapter_id: int,
) -> list[dict]:
    """
    Load IRT parameters for all questions in a chapter.
    Falls back to difficulty-label-derived b values if question_irt_params
    table doesn't have a row for a question yet.
    """
    try:
        result = await db.execute(
            text("""
                SELECT q.question_id, q.question_type,
                       COALESCE(ip.b_param, CASE qm.difficulty_level
                           WHEN 'easy'   THEN -1.0
                           WHEN 'hard'   THEN  1.0
                           ELSE 0.0 END) AS b_param,
                       COALESCE(ip.a_param, 1.0) AS a_param
                FROM   questions q
                LEFT JOIN question_metadata qm ON qm.question_id = q.question_id
                LEFT JOIN question_irt_params ip ON ip.question_id = q.question_id
                WHERE  q.chapter_id = :c
                  AND  q.correct_answer IS NOT NULL
            """),
            {"c": chapter_id}
        )
        return [
            {"question_id": r[0], "question_type": r[1], "b": float(r[2]), "a": float(r[3])}
            for r in result.fetchall()
        ]
    except Exception:
        return []


async def update_question_b_param(
    db: AsyncSession,
    question_id: int,
    correct: bool,
    theta: float,
) -> None:
    """
    Simple online update of a question's b parameter using the
    running mean of ability estimates of students who answered it.

    This is a lightweight proxy for full EM-based IRT calibration:
    the true IRT difficulty of a question should converge toward the
    average ability of students who find it equally easy and hard.

    After N responses, b ≈ mean θ of all respondents (approximation).
    """
    try:
        await db.execute(
            text("""
                INSERT INTO question_irt_params (question_id, b_param, a_param, n_responses)
                VALUES (:qid, :b, 1.0, 1)
                ON CONFLICT (question_id) DO UPDATE SET
                    b_param     = (question_irt_params.b_param * question_irt_params.n_responses + :b)
                                  / (question_irt_params.n_responses + 1),
                    n_responses = question_irt_params.n_responses + 1
            """),
            {"qid": question_id, "b": round(theta, 4)}
        )
        # Don't commit here — caller (session router) commits after XP update
    except Exception:
        pass
