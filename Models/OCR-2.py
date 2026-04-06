import cv2
import pytesseract
from pdf2image import convert_from_path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
import re
import os
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\Anshu\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

PDF_PATH = "./QuestionBanks/NEB-Old-is-Gold-Question-Bank-Class-12-Science-Asmita-Publication_removed.pdf"

styles = getSampleStyleSheet()

def ocr_two_columns(img):
    h, w = img.shape[:2]
    left = img[:, :w//2]
    right = img[:, w//2:]
    return (
        pytesseract.image_to_string(left, config="--psm 4"),
        pytesseract.image_to_string(right, config="--psm 4")
    )

def preprocess(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return cv2.adaptiveThreshold(
        gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,11,2
    )

def build_pdf(filename, qas, title):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    elems = [Paragraph(title, styles["Title"]), Spacer(1,20)]
    for q,a in qas:
        elems.append(Paragraph(q.replace("\n","<br/>"), styles["Normal"]))
        elems.append(Spacer(1,6))
        elems.append(Paragraph(f"<b>Answer:</b> {a}", styles["Normal"]))
        elems.append(Spacer(1,14))
    doc.build(elems)

images = convert_from_path(PDF_PATH, dpi=300)

subjects = {"english":[], "physics":[], "maths":[]}
missing = []

answer_pat = re.compile(r"(ans|answer)\s*[:\-]?\s*([a-d0-9\.\-]+)", re.I)

current = None

for page in images:
    img = preprocess(cv2.cvtColor(np.array(page), cv2.COLOR_RGB2BGR))
    ltxt, rtxt = ocr_two_columns(img)
    text = ltxt + "\n" + rtxt

    if "english" in text.lower():
        current = "english"
    elif "physics" in text.lower():
        current = "physics"
    elif "math" in text.lower():
        current = "maths"

    blocks = re.split(r"\n(?=\d+\.)", text)

    for b in blocks:
        ans = answer_pat.search(b)
        if ans and current:
            subjects[current].append((b.strip(), ans.group(2)))
        else:
            missing.append(b.strip())

for s in subjects:
    build_pdf(f"{s}_qnbank.pdf", subjects[s], s.capitalize())

build_pdf("nonswerqns.pdf", [(q,"") for q in missing], "Questions with Missing Answers")
