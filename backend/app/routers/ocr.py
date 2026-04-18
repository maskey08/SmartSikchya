"""
ocr.py — PDF question bank upload.

Supported formats:
  A) Numbered       "1. Question text" / A) option / Answer: C
  B) SAT / College Board  "RW question 1" / "Math question 1" / "Key C"

FIX NOTE — "Field required" error:
  FastAPI's Form() parser receives all multipart fields as strings.
  Declaring `subject_id: int = Form(...)` makes FastAPI try to coerce "1" → 1,
  which works in most cases BUT fails when Axios sends the value without explicit
  casting and the Pydantic v2 strict mode rejects it.
  Solution: accept as str, convert manually. This is always safe.
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

# ── Regex patterns ─────────────────────────────────────────────
NUM_Q    = re.compile(r'^(\d{1,3})[.)]\s+(.+)', re.IGNORECASE)
SAT_Q    = re.compile(r'^(?:RW|Math|Reading|Writing|Science|History)\s+question\s+(\d+)', re.IGNORECASE)
OPT_ABCD = re.compile(r'^([A-Da-d])[.)]\s+(.+)')
ANS_KEY  = re.compile(r'^Key\s+([A-Da-d])\s*$', re.IGNORECASE)
ANS_INLINE   = re.compile(r'(?i)^ans(?:wer)?[:\s]+(.+)')
ANS_COMPACT  = re.compile(r'(\d+)[.)]\s*([A-Da-d])')
SKIP_LINE    = re.compile(
    r'^(?:Key Explanation|Distractor Explanation|Domain|Skill|'
    r'THE DIGITAL SAT|Page \d+|Copyright|\d+ THE DIGITAL)',
    re.IGNORECASE
)
ANSKEY_BLOCK = re.compile(r'(?i)answer\s*key|answers?\s*:')
QUESTION_START = re.compile(
    r'^(?:Which|What|How|Select|The|Based|According|In |If |A |An |Complete)',
    re.IGNORECASE
)


def _extract_text(pdf_bytes: bytes) -> str:
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
        return text
    except ImportError:
        raise HTTPException(
            503,
            "pdfplumber is not installed on this server. "
            "Run: pip install pdfplumber"
        )
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")


def _detect_format(lines: list[str]) -> str:
    sat_hits = sum(1 for l in lines if SAT_Q.match(l.strip()))
    num_hits = sum(1 for l in lines if NUM_Q.match(l.strip()))
    return "sat" if sat_hits >= num_hits else "numbered"


def _parse_sat(lines: list[str]) -> list[dict]:
    questions = []
    q_num = 0
    in_question = False
    passage_buf: list[str] = []
    question_text = ""
    opts: list[str] = []
    correct_key: str | None = None
    found_question_line = False

    def flush():
        nonlocal question_text, opts, correct_key, found_question_line, passage_buf
        if not question_text.strip():
            passage_buf=[]; question_text=""; opts=[]; correct_key=None; found_question_line=False
            return
        ans = None
        if correct_key and opts:
            idx = {"A":0,"B":1,"C":2,"D":3}.get(correct_key.upper(), -1)
            if 0 <= idx < len(opts):
                ans = opts[idx]
        elif correct_key:
            ans = correct_key
        full_text = question_text.strip()
        if passage_buf:
            passage = " ".join(passage_buf).strip()
            if len(passage) > 20:
                full_text = passage + "\n\n" + full_text
        questions.append({
            "q_num": q_num,
            "question_text": full_text,
            "options": opts[:] if len(opts) >= 2 else None,
            "correct_answer": ans,
            "question_type": 1 if len(opts) >= 2 else 2,
            "answer_found": ans is not None,
        })
        passage_buf=[]; question_text=""; opts=[]; correct_key=None; found_question_line=False

    for raw_line in lines:
        line = raw_line.strip()
        if not line or SKIP_LINE.match(line):
            continue
        sat_match = SAT_Q.match(line)
        if sat_match:
            flush()
            q_num = int(sat_match.group(1))
            in_question = True
            continue
        if not in_question:
            continue
        if found_question_line:
            opt_m = OPT_ABCD.match(line)
            if opt_m:
                opts.append(opt_m.group(2).strip())
                continue
            key_m = ANS_KEY.match(line)
            if key_m:
                correct_key = key_m.group(1).upper()
                continue
            if correct_key:
                continue   # skip explanation lines after key
        else:
            opt_m = OPT_ABCD.match(line)
            if opt_m:
                opts.append(opt_m.group(2).strip())
                continue
            if QUESTION_START.match(line) or "?" in line:
                question_text = line
                found_question_line = True
                continue
            passage_buf.append(line)

    flush()
    return questions


def _parse_numbered(lines: list[str]) -> list[dict]:
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
    cur_ans:  str | None = None

    def flush():
        nonlocal cur_num, cur_text, cur_opts, cur_ans
        if cur_num is None or not cur_text.strip():
            cur_num=None; cur_text=""; cur_opts=[]; cur_ans=None; return
        is_mcq = len(cur_opts) >= 2
        ans = cur_ans
        if ans is None and cur_num in answer_key:
            key = answer_key[cur_num]
            idx = {"A":0,"B":1,"C":2,"D":3}.get(key, -1)
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
        cur_num=None; cur_text=""; cur_opts=[]; cur_ans=None

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
            if not cur_opts:
                cur_text += " " + line

    flush()
    return questions


def _parse_questions(raw: str) -> list[dict]:
    lines = [l.rstrip() for l in raw.split("\n")]
    fmt   = _detect_format(lines)
    if fmt == "sat":
        return _parse_sat(lines)
    return _parse_numbered(lines)


# ── Pydantic ───────────────────────────────────────────────────
class SubmitOCRIn(BaseModel):
    subject_id: int
    chapter_id: int | None
    questions:  list[dict]


# ── Upload endpoint ────────────────────────────────────────────
@router.post("/upload")
async def upload_pdf(
    file:       UploadFile = File(...),
    # Accept as str — FormData always sends strings; convert below
    subject_id: str        = Form(...),
    chapter_id: str | None = Form(None),
    _: User = Depends(get_current_admin),
):
    # ── Convert + validate ──────────────────────────────────────
    try:
        subj_id_int = int(subject_id)
    except (ValueError, TypeError):
        raise HTTPException(422, "subject_id must be an integer")

    chap_id_int: int | None = None
    if chapter_id and chapter_id.strip():
        try:
            chap_id_int = int(chapter_id)
        except (ValueError, TypeError):
            raise HTTPException(422, "chapter_id must be an integer")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum 20 MB.")
    if len(pdf_bytes) < 100:
        raise HTTPException(400, "File appears to be empty or corrupt.")

    # ── Extract + parse ─────────────────────────────────────────
    raw_text = _extract_text(pdf_bytes)
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            400,
            "No text could be extracted from this PDF. "
            "Ensure it is a digital PDF, not a scanned image. "
            "Install pdfplumber: pip install pdfplumber"
        )

    parsed = _parse_questions(raw_text)
    fmt    = _detect_format(raw_text.splitlines())

    if not parsed:
        raise HTTPException(
            400,
            f"No questions detected (format detected: {fmt}). "
            "Supported formats: numbered '1. Question…' or SAT 'RW question 1 / Math question 1'."
        )

    # ── Classify difficulty ──────────────────────────────────────
    texts = [q["question_text"][:512] for q in parsed]
    if is_model_available():
        difficulties = classify_batch(texts)
    else:
        difficulties = ["medium"] * len(parsed)

    result = []
    for i, (q, diff) in enumerate(zip(parsed, difficulties)):
        result.append({
            "temp_id":        i + 1,
            "question_text":  q["question_text"],
            "options":        q["options"],
            "correct_answer": q["correct_answer"],
            "question_type":  q["question_type"],
            "difficulty":     diff,
            "answer_found":   q["answer_found"],
        })

    missing = sum(1 for r in result if not r["answer_found"])
    return {
        "total_extracted": len(result),
        "answers_missing": missing,
        "format_detected": fmt,
        "subject_id":      subj_id_int,
        "chapter_id":      chap_id_int,
        "questions":       result,
    }


# ── Submit endpoint ────────────────────────────────────────────
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
        text = (q.get("question_text") or "").strip()
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
        "message":      f"Inserted {len(inserted_ids)} questions",
        "inserted":     len(inserted_ids),
        "skipped":      skipped,
        "question_ids": inserted_ids,
    }
