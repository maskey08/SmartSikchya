"""
download_real_datasets.py
─────────────────────────
Downloads real academic datasets from HuggingFace and builds a balanced
training CSV for DistilBERT difficulty classification.

LABEL MAPPING:
  easy   → ARC-Easy questions (elementary science, 3rd-5th grade)
  hard   → ARC-Challenge questions (harder science, 6th-8th grade)
  medium → RACE-Middle questions (middle school reading comprehension)

WHY these datasets?
  ARC-Easy vs ARC-Challenge come from the SAME pool of science questions
  but are separated by whether crowd-sourced solvers answered correctly.
  This gives us a CLEAN linguistic signal for easy vs hard.
  RACE-Middle sits between them in difficulty and has a completely
  different domain (reading comprehension) which forces the model to
  generalise beyond science vocabulary.

USAGE:
  pip install datasets pandas --break-system-packages
  python download_real_datasets.py
  → writes: balanced_questions.csv
"""
import random
import csv
import os

N_PER_CLASS = 600   # Total per label. Increase if val accuracy stays below 75%.

def main():
    try:
        from datasets import load_dataset
    except ImportError:
        print("Installing datasets library...")
        os.system("pip install datasets --break-system-packages -q")
        from datasets import load_dataset

    rows = []

    # ── EASY: ARC-Easy ─────────────────────────────────────────
    print("Loading ARC-Easy...")
    arc_easy = load_dataset("ai2_arc", "ARC-Easy", trust_remote_code=True)
    easy_qs  = []
    for split in ["train", "validation", "test"]:
        for item in arc_easy[split]:
            q = item["question"].strip()
            if len(q) > 20:
                easy_qs.append(q)
    random.shuffle(easy_qs)
    for q in easy_qs[:N_PER_CLASS]:
        rows.append({"question": q, "difficulty": "easy", "label": 0})
    print(f"  → {min(len(easy_qs), N_PER_CLASS)} easy questions loaded")

    # ── HARD: ARC-Challenge ─────────────────────────────────────
    print("Loading ARC-Challenge...")
    arc_hard = load_dataset("ai2_arc", "ARC-Challenge", trust_remote_code=True)
    hard_qs  = []
    for split in ["train", "validation", "test"]:
        for item in arc_hard[split]:
            q = item["question"].strip()
            if len(q) > 20:
                hard_qs.append(q)
    random.shuffle(hard_qs)
    for q in hard_qs[:N_PER_CLASS]:
        rows.append({"question": q, "difficulty": "hard", "label": 2})
    print(f"  → {min(len(hard_qs), N_PER_CLASS)} hard questions loaded")

    # ── MEDIUM: RACE-Middle ─────────────────────────────────────
    print("Loading RACE-Middle (this is larger, may take a moment)...")
    race = load_dataset("ehovy/race", "middle", trust_remote_code=True)
    medium_qs = []
    for split in ["train", "validation", "test"]:
        for item in race[split]:
            q = item["question"].strip()
            if len(q) > 20 and "passage" not in q.lower()[:20]:
                medium_qs.append(q)
    random.shuffle(medium_qs)
    for q in medium_qs[:N_PER_CLASS]:
        rows.append({"question": q, "difficulty": "medium", "label": 1})
    print(f"  → {min(len(medium_qs), N_PER_CLASS)} medium questions loaded")

    # ── Shuffle and write ───────────────────────────────────────
    random.shuffle(rows)
    out_path = os.path.join(os.path.dirname(__file__), "balanced_questions.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["question", "difficulty", "label"])
        writer.writeheader()
        writer.writerows(rows)

    easy_n   = sum(1 for r in rows if r["difficulty"] == "easy")
    medium_n = sum(1 for r in rows if r["difficulty"] == "medium")
    hard_n   = sum(1 for r in rows if r["difficulty"] == "hard")
    print(f"\nDataset written to: {out_path}")
    print(f"  Easy:   {easy_n}")
    print(f"  Medium: {medium_n}")
    print(f"  Hard:   {hard_n}")
    print(f"  Total:  {len(rows)}")
    print("\nNext step: python train.py")


if __name__ == "__main__":
    random.seed(42)
    main()
