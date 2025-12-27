import cv2

img = cv2.imread("./QB/NEB-Old-is-Gold-Question-Bank-Class-12-Science-Asmita-Publication-009.jpg")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]
h, w, _ = img.shape

# Split image into two vertical columns
left_col = img[:, :w//2]
right_col = img[:, w//2:]

import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Anshu\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

text_left = pytesseract.image_to_string(left_col, config="--psm 6")
text_right = pytesseract.image_to_string(right_col, config="--psm 6")

final_text = text_left + "\n" + text_right
print(final_text)