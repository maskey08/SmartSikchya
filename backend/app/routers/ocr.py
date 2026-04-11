"""
ocr.py — PDF question bank upload, OCR extraction, and review workflow.

PIPELINE (matches your SRS FR22 and SD QuestionBank Management diagram):
1. Admin uploads a PDF (POST /ocr/upload)
2. Tesseract OCR extracts text
3. A parser tries to detect:
   - Question text
   - Answer (immediately after, or at end of file in answer key)
   - Options (A/B/C/D for MCQ)
4. DistilBERT classifies difficulty for each question
5. Returns a list of extracted questions for REVIEW
6. Admin edits on the review page, then submits (POST /ocr/submit)
7. All confirmed questions are inserted into DB

WHY two-step (extract then submit)?
OCR makes mistakes. A review step lets admin correct errors before they
pollute the question bank. This matches your flowchart FC QN Bank Management.

Install: pip install pytesseract pillow pdf2image
Also need: Tesseract-OCR installed on Windows (https://github.com/UB-Mannheim/tesseract/wiki)
"""
import re
import io
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.question import Question, QuestionMetadata
from app.models.user import User
from app.services.auth_service import get_current_admin
from app.services.classifier import classify_batch, is_model_available

router = APIRouter(prefix="/ocr", tags=["ocr"])


class ExtractedQuestion(BaseModel):
    """One question extracted from the PDF — sent to frontend for review."""
    temp_id:        int               # frontend tracking only, not DB id
    question_text:  str
    options:        list[str] | None  # null for non-MCQ
    correct_answer: str | None        # null if not found (highlighted in UI)
    question_type:  int               # 1=mcq, 2=short, 3=fib
    difficulty:     str               # from DistilBERT or "medium" fallback
    answer_found:   bool              # False = needs manual entry (highlighted)


class SubmitOCRIn(BaseModel):
    """Admin-reviewed questions ready to insert into DB."""
    subject_id: int
    chapter_id: int | None
    questions:  list[dict]   # same shape as ExtractedQuestion but all confirmed


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF using pdfplumber first (cleaner for digital PDFs),
    falling back to pytesseract OCR for scanned/image PDFs.
    """
    text = ""

    # Try pdfplumber first (no Tesseract needed, handles digital PDFs)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n\n"
        if text.strip():
            return text
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback: Tesseract OCR for scanned PDFs
    try:
        from pdf2image import convert_from_bytes
        import pytesseract

        images = convert_from_bytes(pdf_bytes, dpi=300)
        for img in images:
            text += pytesseract.image_to_string(img) + "\n\n"
    except ImportError:
        raise HTTPException(
            503,
            "PDF text extraction failed. Install: pip install pdfplumber pytesseract pdf2image\n"
            "Also install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki"
        )
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")

    return text


def _parse_questions(text: str) -> list[dict]:
    """
    Parse extracted text to detect questions, options, and answers.

    Handles common question bank formats:
    1. Q1. Question text      → numbered questions
       A) Option 1
       B) Option 2
       Answer: A

    2. 1. Question text       → simple numbered
       Answer: text

    3. Questions first, answers at end (answer key format):
       1. A  2. C  3. B      → answer key section

    Returns list of question dicts.
    """
    questions = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Detect answer key section (e.g., "Answers:", "Answer Key:")
    answer_key_start = -1
    answer_key: dict[int, str] = {}

    for i, line in enumerate(lines):
        if re.match(r'(?i)(answer\s*key|answers?:)', line):
            answer_key_start = i
            break

    # Parse answer key if found
    if answer_key_start >= 0:
        for line in lines[answer_key_start:]:
            # Match patterns like "1. A" or "1) A" or "1 - A"
            matches = re.findall(r'(\d+)[.)]\s*([A-Da-d])', line)
            for num, ans in matches:
                answer_key[int(num)] = ans.upper()
        text_lines = lines[:answer_key_start]
    else:
        text_lines = lines

    # Parse question blocks
    q_pattern = re.compile(r'^(\d+)[.)\s]+(.+)')
    opt_pattern = re.compile(r'^[Aa\(]?[A-Da-d][.)]\s+(.+)')
    ans_pattern = re.compile(r'(?i)^ans(wer)?[.:\s]+(.+)')

    current_q = None
    current_options = []
    q_num = 0

    def flush_question():
        nonlocal current_q, current_options, q_num
        if current_q:
            # Detect MCQ by presence of options
            is_mcq = len(current_options) >= 2

            # Get answer from inline or key
            answer = None
            if current_q.get("answer"):
                answer = current_q["answer"]
            elif q_num in answer_key:
                if is_mcq and len(current_options) >= answer_key[q_num].index('A') if 'A' in ['A','B','C','D'] else True:
                    key = answer_key[q_num]
                    key_map = {"A": 0, "B": 1, "C": 2, "D": 3}
                    idx = key_map.get(key, -1)
                    if 0 <= idx < len(current_options):
                        answer = current_options[idx]

            questions.append({
                "q_num":          q_num,
                "question_text":  current_q["text"],
                "options":        current_options if is_mcq else None,
                "correct_answer": answer,
                "question_type":  1 if is_mcq else 2,
                "answer_found":   answer is not None,
            })
            current_q = None
            current_options = []

    for line in text_lines:
        q_match   = q_pattern.match(line)
        opt_match = opt_pattern.match(line)
        ans_match = ans_pattern.match(line)

        if q_match:
            flush_question()
            q_num = int(q_match.group(1))
            current_q = {"text": q_match.group(2).strip(), "answer": None}

        elif opt_match and current_q:
            current_options.append(opt_match.group(1).strip())

        elif ans_match and current_q:
            current_q["answer"] = ans_match.group(2).strip()

    flush_question()
    return questions


@router.post("/upload")
async def upload_pdf(
    file:             UploadFile = File(...),
    subject_id:       int        = Form(...),
    chapter_id:       int | None = Form(None),
    auto_chapter:     bool       = Form(False),  # future: cluster by chapter
    _: User = Depends(get_current_admin),
):
    """
    Upload a PDF question bank. Returns extracted questions for review.
    No DB writes yet — that happens on /ocr/submit after admin reviews.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 10MB.")

    # Extract text
    raw_text = _extract_text_from_pdf(pdf_bytes)
    if not raw_text.strip():
        raise HTTPException(400, "Could not extract any text from this PDF. Is it a scanned image? Try a higher quality scan.")

    # Parse questions
    parsed = _parse_questions(raw_text)
    if not parsed:
        raise HTTPException(400, "No questions detected. Make sure questions are numbered (1. 2. 3. etc.)")

    # Classify difficulty
    texts = [q["question_text"] for q in parsed]
    if is_model_available():
        difficulties = classify_batch(texts)
    else:
        difficulties = ["medium"] * len(parsed)

    # Build response
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

    return {
        "total_extracted":   len(result),
        "answers_missing":   sum(1 for r in result if not r.answer_found),
        "subject_id":        subject_id,
        "chapter_id":        chapter_id,
        "questions":         [r.dict() for r in result],
        "raw_text_preview":  raw_text[:500],  # for debugging
    }


@router.post("/submit")
async def submit_ocr_questions(
    body: SubmitOCRIn,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Insert reviewed questions into the database.
    Called after admin reviews and edits the OCR output.
    """
    if not body.questions:
        raise HTTPException(400, "No questions to submit.")

    inserted_ids = []
    skipped = 0

    for q in body.questions:
        q_text = q.get("question_text", "").strip()
        if not q_text:
            skipped += 1
            continue

        new_q = Question(
            subject_id=body.subject_id,
            chapter_id=q.get("chapter_id") or body.chapter_id,
            question_text=q_text,
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
        "message":  f"Inserted {len(inserted_ids)} questions",
        "inserted": len(inserted_ids),
        "skipped":  skipped,
        "question_ids": inserted_ids,
    }
