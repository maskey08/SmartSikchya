"""
ocr.py — PDF question bank upload with universal multi-format parser.

SUPPORTED QUESTION FORMATS (auto-detected, all in one document):
  A) Qn1: / Ans:          "Qn1: Question text"  /  "Ans: answer"
  B) Q1. / Q1)            "Q1. Question"  /  "Q1) Question"
  C) Question 1:          "Question 1: Question text"  /  "Answer: text"
  D) Standard numbered    "1. Question"  /  "1) Question"  /  A) B) C) D) options
  E) SAT/College Board    "RW question 1" / "Math question 1"  /  "Key C"

ANSWER FORMATS (all detected):
  "Ans: x = 5"
  "Answer: B"
  "Ans: x = 3 or x = -3"
  "Key C"
  Answer key block at end: "1. C   2. A   3. B"

FIX NOTE — "Field required":
  Accepts subject_id/chapter_id as str from Form() and converts manually.
  Never set Content-Type manually for multipart — browser/fetch does it.
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

# ── Question-start patterns (ordered: most specific first) ────────
Q_PATTERNS = [
    # "Qn1:" or "Qn 1:" or "Qn1."
    re.compile(r'^Qn\s*(\d+)\s*[:.]\s*(.+)', re.IGNORECASE),
    # "Q1." or "Q1)" or "Q 1."
    re.compile(r'^Q\s*(\d+)\s*[.)]\s*(.+)', re.IGNORECASE),
    # "Question 1:" or "Question 1."
    re.compile(r'^Question\s+(\d+)\s*[:.]\s*(.+)', re.IGNORECASE),
    # "1. text" (standard numbered with dot)
    re.compile(r'^(\d{1,3})[.]\s+(.+)'),
    # "1) text" (standard numbered with paren)
    re.compile(r'^(\d{1,3})[)]\s+(.+)'),
]

# SAT-style header (no question text on same line)
SAT_Q = re.compile(
    r'^(?:RW|Math|Reading|Writing|Science|History|Grammar)\s+question\s+(\d+)',
    re.IGNORECASE
)

# MCQ option line: "A) text" or "A. text" or "(A) text"
OPT_PAT = re.compile(r'^\(?([A-Da-d])[.)]\)?\s+(.+)')

# Answer patterns
ANS_PATTERNS = [
    re.compile(r'^Ans(?:wer)?\s*[:.]\s*(.+)', re.IGNORECASE),   # Ans: / Answer:
    re.compile(r'^Key\s+([A-Da-d])\s*$', re.IGNORECASE),         # Key C  (SAT)
    re.compile(r'^Correct\s*[:.]\s*(.+)', re.IGNORECASE),         # Correct: B
    re.compile(r'^Solution\s*[:.]\s*(.+)', re.IGNORECASE),        # Solution: x=5
]

# Compact answer key: "1. C  2. A" or "1) C  2) A"
ANS_KEY_COMPACT = re.compile(r'(\d+)[.)]\s*([A-Da-d])\b')

# Answer-key block heading
ANSKEY_BLOCK = re.compile(r'(?i)^\s*(?:answer\s*key|answers?\s*:|key\s*:)\s*$')

# Lines to skip in SAT format
SKIP_SAT = re.compile(
    r'^(?:Key Explanation|Distractor Explanation|Domain|Skill|'
    r'THE DIGITAL SAT|Page \d+|Copyright|\d+ THE DIGITAL)',
    re.IGNORECASE
)

# SAT question sentence starters
SAT_Q_START = re.compile(
    r'^(?:Which|What|How|Select|Based|According|The|If |In |A |An |Complete)',
    re.IGNORECASE
)


def _extract_text(pdf_bytes: bytes) -> str:
    """pdfplumber first, Tesseract fallback for scanned docs."""
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n\n"
        if text.strip():
            return text
    except ImportError:
        pass
    except Exception:
        pass

    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        text = ""
        for img in convert_from_bytes(pdf_bytes, dpi=300):
            text += pytesseract.image_to_string(img) + "\n\n"
        return text
    except ImportError:
        raise HTTPException(
            503,
            "pdfplumber is not installed. Run: pip install pdfplumber"
        )
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")


def _detect_format(lines: list[str]) -> str:
    sat_hits = sum(1 for l in lines if SAT_Q.match(l.strip()))
    std_hits = sum(1 for l in lines if any(p.match(l.strip()) for p in Q_PATTERNS))
    return "sat" if sat_hits > 0 and sat_hits >= std_hits else "standard"


def _match_question_start(line: str):
    """Try all Q_PATTERNS. Returns (q_num, question_text) or None."""
    for pat in Q_PATTERNS:
        m = pat.match(line)
        if m:
            return int(m.group(1)), m.group(2).strip()
    return None


def _match_answer(line: str):
    """Try all answer patterns. Returns answer text or None."""
    for pat in ANS_PATTERNS:
        m = pat.match(line)
        if m:
            return m.group(1).strip()
    return None


def _parse_standard(lines: list[str]) -> list[dict]:
    """
    Parse formats A–D. All share the same logic:
    - Question starts detected by Q_PATTERNS
    - Options detected by OPT_PAT
    - Answers detected by ANS_PATTERNS or end-of-doc answer key
    - Multi-line questions: text continues until an option, answer, or new question
    """
    # Detect and extract end-of-document answer key
    anskey_idx = -1
    for i, line in enumerate(lines):
        if ANSKEY_BLOCK.match(line.strip()):
            anskey_idx = i
            break

    answer_key: dict[int, str] = {}
    if anskey_idx >= 0:
        for line in lines[anskey_idx:]:
            for num, letter in ANS_KEY_COMPACT.findall(line):
                answer_key[int(num)] = letter.upper()
        content_lines = lines[:anskey_idx]
    else:
        content_lines = lines

    questions: list[dict] = []
    cur_num:  int | None = None
    cur_text: str        = ""
    cur_opts: list[str]  = []
    cur_ans:  str | None = None

    def flush():
        nonlocal cur_num, cur_text, cur_opts, cur_ans
        if cur_num is None or not cur_text.strip():
            cur_num = None; cur_text = ""; cur_opts = []; cur_ans = None
            return
        is_mcq = len(cur_opts) >= 2
        ans = cur_ans
        if ans is None and cur_num in answer_key:
            key = answer_key[cur_num].upper()
            idx = {"A": 0, "B": 1, "C": 2, "D": 3}.get(key, -1)
            if is_mcq and 0 <= idx < len(cur_opts):
                ans = cur_opts[idx]
            else:
                ans = key
        # If answer is a single letter and we have options, map it
        if ans and len(ans) == 1 and ans.upper() in "ABCD" and is_mcq:
            idx = {"A": 0, "B": 1, "C": 2, "D": 3}.get(ans.upper(), -1)
            if 0 <= idx < len(cur_opts):
                ans = cur_opts[idx]
        questions.append({
            "q_num":          cur_num,
            "question_text":  cur_text.strip(),
            "options":        cur_opts[:] if is_mcq else None,
            "correct_answer": ans,
            "question_type":  1 if is_mcq else 2,
            "answer_found":   ans is not None,
        })
        cur_num = None; cur_text = ""; cur_opts = []; cur_ans = None

    for raw in content_lines:
        line = raw.strip()
        if not line:
            continue

        # New question?
        qstart = _match_question_start(line)
        if qstart:
            flush()
            cur_num, cur_text = qstart
            continue

        if cur_num is None:
            continue  # haven't found first question yet

        # Option?
        opt_m = OPT_PAT.match(line)
        if opt_m:
            cur_opts.append(opt_m.group(2).strip())
            continue

        # Answer?
        ans = _match_answer(line)
        if ans is not None:
            cur_ans = ans
            continue

        # Continuation of question text (only before options appear)
        if not cur_opts and cur_ans is None:
            cur_text += " " + line

    flush()
    return questions


def _parse_sat(lines: list[str]) -> list[dict]:
    """Parse SAT / College Board format."""
    questions = []
    q_num     = 0
    in_q      = False
    passage:  list[str] = []
    q_text    = ""
    opts:     list[str] = []
    key:      str | None = None
    found_q_line = False

    def flush():
        nonlocal q_text, opts, key, found_q_line, passage
        if not q_text.strip():
            passage=[]; q_text=""; opts=[]; key=None; found_q_line=False; return
        ans = None
        if key and opts:
            idx = {"A":0,"B":1,"C":2,"D":3}.get(key.upper(), -1)
            if 0 <= idx < len(opts):
                ans = opts[idx]
        full = q_text.strip()
        if passage:
            p = " ".join(passage).strip()
            if p:
                full = p + "\n\n" + full
        questions.append({
            "q_num": q_num, "question_text": full,
            "options": opts[:] if len(opts) >= 2 else None,
            "correct_answer": ans, "question_type": 1 if len(opts) >= 2 else 2,
            "answer_found": ans is not None,
        })
        passage=[]; q_text=""; opts=[]; key=None; found_q_line=False

    for raw in lines:
        line = raw.strip()
        if not line or SKIP_SAT.match(line): continue
        sat_m = SAT_Q.match(line)
        if sat_m:
            flush(); q_num = int(sat_m.group(1)); in_q = True; continue
        if not in_q: continue
        if found_q_line:
            opt_m = OPT_PAT.match(line)
            if opt_m: opts.append(opt_m.group(2).strip()); continue
            key_m = re.match(r'^Key\s+([A-Da-d])\s*$', line, re.IGNORECASE)
            if key_m: key = key_m.group(1).upper(); continue
            if key: continue
        else:
            opt_m = OPT_PAT.match(line)
            if opt_m: opts.append(opt_m.group(2).strip()); continue
            if SAT_Q_START.match(line) or "?" in line:
                q_text = line; found_q_line = True; continue
            passage.append(line)
    flush()
    return questions


def _parse_questions(raw: str) -> list[dict]:
    """Auto-detect format and parse."""
    lines = [l.rstrip() for l in raw.split("\n")]
    fmt   = _detect_format(lines)
    if fmt == "sat":
        return _parse_sat(lines)
    return _parse_standard(lines)


# ── Pydantic ───────────────────────────────────────────────────
class SubmitOCRIn(BaseModel):
    subject_id: int
    chapter_id: int | None
    questions:  list[dict]


# ── Upload endpoint ────────────────────────────────────────────
@router.post("/upload")
async def upload_pdf(
    file:       UploadFile = File(...),
    subject_id: str        = Form(...),   # str — FormData always sends strings
    chapter_id: str | None = Form(None),
    _: User = Depends(get_current_admin),
):
    # Validate + convert ids
    try:
        subj_id_int = int(subject_id)
    except (ValueError, TypeError):
        raise HTTPException(422, "subject_id must be an integer")

    chap_id_int: int | None = None
    if chapter_id and chapter_id.strip() and chapter_id.strip() != "null":
        try:
            chap_id_int = int(chapter_id)
        except (ValueError, TypeError):
            raise HTTPException(422, "chapter_id must be an integer")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum 20 MB.")
    if len(pdf_bytes) < 50:
        raise HTTPException(400, "File appears to be empty or corrupt.")

    # Extract text
    raw_text = _extract_text(pdf_bytes)
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            400,
            "No text could be extracted. Ensure this is a digital PDF (not a scanned image). "
            "Install pdfplumber in the backend venv: pip install pdfplumber"
        )

    # Parse
    parsed = _parse_questions(raw_text)
    fmt    = _detect_format(raw_text.splitlines())

    if not parsed:
        # Return helpful debug info
        sample = raw_text.strip()[:300].replace("\n", " | ")
        raise HTTPException(
            400,
            f"No questions detected (format: {fmt}). "
            f"Extracted text sample: '{sample}'. "
            f"Supported: 'Qn1: text / Ans: x', 'Q1. text', 'Question 1: text', "
            f"'1. text', '1) text', or SAT 'RW question 1 / Key C'."
        )

    # Classify difficulty
    texts = [q["question_text"][:512] for q in parsed]
    difficulties = classify_batch(texts) if is_model_available() else ["medium"] * len(parsed)

    result = [
        {
            "temp_id":        i + 1,
            "question_text":  q["question_text"],
            "options":        q["options"],
            "correct_answer": q["correct_answer"],
            "question_type":  q["question_type"],
            "difficulty":     diff,
            "answer_found":   q["answer_found"],
        }
        for i, (q, diff) in enumerate(zip(parsed, difficulties))
    ]

    return {
        "total_extracted": len(result),
        "answers_missing": sum(1 for r in result if not r["answer_found"]),
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
        if not text or len(text) < 3:
            skipped += 1
            continue
        new_q = Question(
            subject_id=body.subject_id,
            chapter_id=q.get("chapter_id") or body.chapter_id,
            question_text=text,
            question_type=q.get("question_type", 2),  # default short answer for non-MCQ
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
