"""
classifier.py — Difficulty classifier service for the FastAPI backend.

WHY a singleton pattern (load once, reuse)?
Loading a neural network model takes ~2-3 seconds and uses ~200MB RAM.
Loading it on every API call would make the endpoint unusably slow.
We load it once at startup and keep it in memory.

The _classifier global is None until first use (lazy loading),
so the server starts fast even before the model is needed.
"""
import json
import os
from pathlib import Path

import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

# Path to the saved model — copy models/saved_model/ here after training
MODEL_PATH = Path(__file__).parent.parent / "ai" / "difficulty_model"

_tokenizer  = None
_model      = None
_id2label   = None
_model_loaded = False


def _load_model():
    global _tokenizer, _model, _id2label, _model_loaded

    if _model_loaded:
        return True

    if not MODEL_PATH.exists():
        return False

    try:
        label_map_path = MODEL_PATH / "label_map.json"
        with open(label_map_path) as f:
            _id2label = {int(k): v for k, v in json.load(f).items()}

        _tokenizer = DistilBertTokenizerFast.from_pretrained(str(MODEL_PATH))
        _model     = DistilBertForSequenceClassification.from_pretrained(str(MODEL_PATH))
        _model.eval()
        _model_loaded = True
        print("✓ DistilBERT difficulty classifier loaded")
        return True
    except Exception as e:
        print(f"⚠ Could not load classifier: {e}")
        return False


def is_model_available() -> bool:
    """Check if the trained model exists and can be loaded."""
    return _load_model()


def classify_difficulty(question_text: str) -> str:
    """
    Classify a question's difficulty.
    Returns: "easy" | "medium" | "hard"
    Falls back to "medium" if model not loaded.
    """
    if not _load_model():
        return "medium"  # fallback if model not trained yet

    inputs = _tokenizer(
        question_text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    with torch.no_grad():
        logits = _model(**inputs).logits
        pred_id = logits.argmax(dim=-1).item()

    return _id2label[pred_id]


def classify_batch(questions: list[str]) -> list[str]:
    """
    Classify multiple questions at once (more efficient than one-by-one).
    Returns list of difficulty labels in same order as input.
    """
    if not _load_model():
        return ["medium"] * len(questions)

    # Process in batches of 16 to avoid memory issues
    BATCH_SIZE = 16
    results = []

    for i in range(0, len(questions), BATCH_SIZE):
        batch = questions[i:i + BATCH_SIZE]
        inputs = _tokenizer(
            batch,
            max_length=128,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        with torch.no_grad():
            logits  = _model(**inputs).logits
            pred_ids = logits.argmax(dim=-1).tolist()

        results.extend([_id2label[pid] for pid in pred_ids])

    return results
