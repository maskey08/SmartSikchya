"""
ocr.py — PDF question bank upload with multi-format parser.

SUPPORTED FORMATS:
A) Standard numbered   — "1. Question text" / "1) text" with A) B) C) D) options
B) SAT/College Board   — "RW question 1" / "Math question 1" with "Key X" answers
C) Mixed/custom        — auto-detects which format dominates the document

WHY multi-format?
The original parser only handled format A. SAT PDFs (college board, ACT, etc.)
use format B — questions are NOT prefixed with numbers, answers appear as "Key C",
and reading passages precede questions. Supporting both formats makes the tool
genuinely useful for real exam prep material.
"""
import re
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.question import Question, QuestionMetadata
from app.models.user import User
from app.services.auth_service import get_current_admin
from app.services.classifier import classify_batch, is_model_available

router = APIRouter(prefix="/ocr", tags=["ocr"])

# ── Regex patterns (compiled once) ────────────────────────────────
# Format A: numbered questions
NUM_Q    = re.compile(r'^(\d{1,3})[.)]\s+(.+)', re.IGNORECASE)
# Format B: SAT-style labelled questions
SAT_Q    = re.compile(r'^(?:RW|Math|Reading|Writing|Science|History)\s+question\s+(\d+)', re.IGNORECASE)
# Options
OPT_ABCD = re.compile(r'^([A-Da-d])[.)]\s+(.+)')
# Answers
ANS_KEY  = re.compile(r'^Key\s+([A-Da-d])\s*$', re.IGNORECASE)
ANS_INLINE = re.compile(r'(?i)^ans(?:wer)?[:\s]+(.+)')
ANS_COMPACT = re.compile(r'(\d+)[.)]\s*([A-Da-d])')  # "1. C  2. A" key lines
# Sections to skip
SKIP_LINE = re.compile(
    r'^(?:Key Explanation|Distractor Explanation|Domain|Skill|'
    r'THE DIGITAL SAT|Page \d+|Copyright|\d+ THE DIGITAL)',
    re.IGNORECASE
)
# Answer-key block at end of file
ANSKEY_BLOCK = re.compile(r'(?i)answer\s*key|answers?\s*:', re.IGNORECASE)


def _extract_text(pdf_bytes: bytes) -> str:
    """Extract text from PDF — pdfplumber first, pytesseract fallback."""
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                text += t + "\n\n"
        if text.strip():
            return text
    except ImportError:
        pass
    except Exception:
        pass

    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        images = convert_from_bytes(pdf_bytes, dpi=300)
        for img in images:
            text += pytesseract.image_to_string(img) + "\n\n"
    except ImportError:
        raise HTTPException(
            503,
            "PDF text extraction failed. "
            "Install: pip install pdfplumber   (for digital PDFs)\n"
            "For scanned PDFs also install: pip install pytesseract pdf2image"
        )
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")
    return text


def _detect_format(lines: list[str]) -> str:
    """Return 'sat' or 'numbered' based on which pattern dominates."""
    sat_hits = sum(1 for l in lines if SAT_Q.match(l.strip()))
    num_hits = sum(1 for l in lines if NUM_Q.match(l.strip()))
    return "sat" if sat_hits >= num_hits else "numbered"


def _parse_sat(lines: list[str]) -> list[dict]:
    """
    Parse SAT / College Board style.
    Structure per question:
      RW question N
      [optional passage lines]
      Which choice ...? / What ... ?   <- actual question (starts with Which/What/How/Select)
      A) option text
      B) option text
      C) option text
      D) option text
      Key X
      Domain / Skill / Explanation lines  <- skip these
    """
    QUESTION_START = re.compile(
        r'^(?:Which|What|How|Select|The|Based|According|In |If |A |An |Complete)',
        re.IGNORECASE
    )

    questions = []
    q_num = 0
    in_question = False
    passage_buf = []
    question_text = ""
    opts: list[str] = []
    correct_key: str | None = None
    found_question_line = False

    def flush():
        nonlocal question_text, opts, correct_key, found_question_line, passage_buf
        if not question_text.strip():
            passage_buf = []; question_text = ""; opts = []; correct_key = None; found_question_line = False
            return

        ans = None
        if correct_key and opts:
            idx = {"A": 0, "B": 1, "C": 2, "D": 3}.get(correct_key.upper(), -1)
            if 0 <= idx < len(opts):
                ans = opts[idx]
        elif correct_key:
            ans = correct_key

        # Include passage in question text if present
        full_text = question_text.strip()
        if passage_buf:
            passage = " ".join(passage_buf).strip()
            if len(passage) > 20:
                full_text = "[PASSAGE] " + passage + "\n\n" + full_text

        questions.append({
            "q_num": q_num,
            "question_text": full_text,
            "options": opts[:] if len(opts) >= 2 else None,
            "correct_answer": ans,
            "question_type": 1 if len(opts) >= 2 else 2,
            "answer_found": ans is not None,
        })
        passage_buf = []; question_text = ""; opts = []; correct_key = None; found_question_line = False

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Skip boilerplate
        if SKIP_LINE.match(line):
            continue

        # ── New question block ─────────────────────────────────
        sat_match = SAT_Q.match(line)
        if sat_match:
            flush()
            q_num = int(sat_match.group(1))
            in_question = True
            continue

        if not in_question:
            continue

        # ── Already have question, now looking for options/key ─
        if found_question_line:
            opt_m = OPT_ABCD.match(line)
            if opt_m:
                opts.append(opt_m.group(2).strip())
                continue

            key_m = ANS_KEY.match(line)
            if key_m:
                correct_key = key_m.group(1).upper()
                # After key, we're done with this question — flush on next SAT_Q
                continue

            # Another SAT-Q header was caught above; stop adding opts after key
            if correct_key:
                continue  # ignore explanation lines after key

        else:
            # Looking for the actual question sentence
            opt_m = OPT_ABCD.match(line)
            if opt_m:
                # Option before we found question line — shouldn't happen normally
                opts.append(opt_m.group(2).strip())
                continue

            if QUESTION_START.match(line) or "?" in line:
                question_text = line
                found_question_line = True
                continue

            # Otherwise it's passage text
            passage_buf.append(line)

    flush()
    return questions


def _parse_numbered(lines: list[str]) -> list[dict]:
    """Parse standard numbered format: 1. Question / A) opt / Answer: X"""
    # Detect answer key block
    anskey_start = -1
    for i, line in enumerate(lines):
        if ANSKEY_BLOCK.match(line.strip()):
            anskey_start = i
            break

    answer_key: dict[int, str] = {}
    if anskey_start >= 0:
        for line in lines[anskey_start:]:
            for num, letter in ANS_COMPACT.findall(line):
                answer_key[int(num)] = letter.upper()
        content_lines = lines[:anskey_start]
    else:
        content_lines = lines

    questions: list[dict] = []
    cur_num: int | None = None
    cur_text = ""
    cur_opts: list[str] = []
    cur_ans: str | None = None

    def flush():
        nonlocal cur_num, cur_text, cur_opts, cur_ans
        if cur_num is None or not cur_text.strip():
            cur_num = None; cur_text = ""; cur_opts = []; cur_ans = None; return
        is_mcq = len(cur_opts) >= 2
        ans = cur_ans
        if ans is None and cur_num in answer_key:
            key = answer_key[cur_num]
            idx = {"A": 0, "B": 1, "C": 2, "D": 3}.get(key, -1)
            if is_mcq and 0 <= idx < len(cur_opts):
                ans = cur_opts[idx]
            else:
                ans = key
        questions.append({
            "q_num": cur_num,
            "question_text": cur_text.strip(),
            "options": cur_opts[:] if is_mcq else None,
            "correct_answer": ans,
            "question_type": 1 if is_mcq else 2,
            "answer_found": ans is not None,
        })
        cur_num = None; cur_text = ""; cur_opts = []; cur_ans = None

    for raw in content_lines:
        line = raw.strip()
        if not line or SKIP_LINE.match(line):
            continue

        q_m = NUM_Q.match(line)
        if q_m:
            flush()
            cur_num = int(q_m.group(1))
            cur_text = q_m.group(2).strip()
            continue

        if cur_num is not None:
            opt_m = OPT_ABCD.match(line)
            if opt_m:
                cur_opts.append(opt_m.group(2).strip())
                continue
            ans_m = ANS_INLINE.match(line)
            if ans_m:
                cur_ans = ans_m.group(1).strip()
                continue
            key_m = ANS_KEY.match(line)
            if key_m:
                cur_ans = key_m.group(1).upper()
                continue
            # Continuation of question text
            if not cur_opts:
                cur_text += " " + line

    flush()
    return questions


def _parse_questions(raw: str) -> list[dict]:
    """Auto-detect format and parse."""
    lines = [l.rstrip() for l in raw.split("\n")]
    fmt = _detect_format(lines)
    if fmt == "sat":
        return _parse_sat(lines)
    return _parse_numbered(lines)


# ── Pydantic models ────────────────────────────────────────────
class ExtractedQuestion(BaseModel):
    temp_id: int
    question_text: str
    options: list[str] | None
    correct_answer: str | None
    question_type: int
    difficulty: str
    answer_found: bool

class SubmitOCRIn(BaseModel):
    subject_id: int
    chapter_id: int | None
    questions: list[dict]


@router.post("/upload")
async def upload_pdf(
    file:       UploadFile = File(...),
    subject_id: int        = Form(...),
    chapter_id: int | None = Form(None),
    _: User = Depends(get_current_admin),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 20 * 1024 * 1024:   # 20 MB
        raise HTTPException(400, "File too large. Maximum 20 MB.")
    if len(pdf_bytes) < 100:
        raise HTTPException(400, "File appears to be empty or corrupt.")

    # Extract
    raw_text = _extract_text(pdf_bytes)
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            400,
            "Could not extract any text from this PDF. "
            "If it is a scanned document, install Tesseract OCR on the server."
        )

    # Parse
    parsed = _parse_questions(raw_text)
    if not parsed:
        raise HTTPException(
            400,
            "No questions detected in this PDF. "
            "Supported formats: (1) Numbered questions '1. Question text' "
            "or (2) SAT-style 'RW question 1 / Math question 1' headers."
        )

    # Classify difficulty
    texts = [q["question_text"][:512] for q in parsed]   # truncate for classifier
    if is_model_available():
        difficulties = classify_batch(texts)
    else:
        difficulties = ["medium"] * len(parsed)

    result = []
    for i, (q, diff) in enumerate(zip(parsed, difficulties)):
        result.append(ExtractedQuestion(
            temp_id=i + 1,
            question_text=q["question_text"],
            options=q["options"],
            correct_answer=q["correct_answer"],
            question_type=q["question_type"],
            difficulty=diff,
            answer_found=q["answer_found"],
        ))

    missing = sum(1 for r in result if not r.answer_found)
    return {
        "total_extracted": len(result),
        "answers_missing": missing,
        "format_detected": _detect_format(raw_text.splitlines()),
        "subject_id": subject_id,
        "chapter_id": chapter_id,
        "questions": [r.dict() for r in result],
    }


@router.post("/submit")
async def submit_ocr_questions(
    body: SubmitOCRIn,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if not body.questions:
        raise HTTPException(400, "No questions to submit.")

    inserted_ids = []
    skipped = 0

    for q in body.questions:
        text = q.get("question_text", "").strip()
        if not text or len(text) < 5:
            skipped += 1
            continue

        new_q = Question(
            subject_id=body.subject_id,
            chapter_id=q.get("chapter_id") or body.chapter_id,
            question_text=text,
            question_type=q.get("question_type", 1),
            options=q.get("options"),
            correct_answer=q.get("correct_answer"),
        )
        db.add(new_q)
        await db.flush()
        db.add(QuestionMetadata(
            question_id=new_q.question_id,
            difficulty_level=q.get("difficulty", "medium"),
        ))
        inserted_ids.append(new_q.question_id)

    await db.commit()
    return {
        "message": f"Inserted {len(inserted_ids)} questions",
        "inserted": len(inserted_ids),
        "skipped": skipped,
        "question_ids": inserted_ids,
    }
