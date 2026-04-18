"""
evaluate.py — Interactive evaluation of the trained DistilBERT model.

USAGE:
  python evaluate.py
  Type a question → see predicted difficulty + confidence scores.
  Type 'quit' to exit.

Also runs a quick batch evaluation on 20 sample questions
with known expected difficulties.
"""
import os
import json
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_model")

def load_model():
    if not os.path.exists(SAVE_DIR):
        print(f"ERROR: No saved model found at {SAVE_DIR}")
        print("Run 'python train.py' first.")
        return None, None, None
    tokenizer = DistilBertTokenizerFast.from_pretrained(SAVE_DIR)
    model     = DistilBertForSequenceClassification.from_pretrained(SAVE_DIR)
    model.eval()
    label_map_path = os.path.join(SAVE_DIR, "label_map.json")
    if os.path.exists(label_map_path):
        with open(label_map_path) as f:
            data = json.load(f)
        id2label = {int(k): v for k, v in data["id2label"].items()}
    else:
        id2label = {0: "easy", 1: "medium", 2: "hard"}
    return tokenizer, model, id2label


def predict(text: str, tokenizer, model, id2label: dict) -> dict:
    inputs = tokenizer(
        text, max_length=128, padding="max_length",
        truncation=True, return_tensors="pt"
    )
    with torch.no_grad():
        logits = model(**inputs).logits
        probs  = torch.softmax(logits, dim=-1)[0]
    pred_id = probs.argmax().item()
    return {
        "difficulty": id2label[pred_id],
        "confidence": round(probs[pred_id].item() * 100, 1),
        "scores":     {id2label[i]: round(probs[i].item() * 100, 1) for i in range(len(id2label))},
    }


def run_batch_eval(tokenizer, model, id2label):
    """Quick sanity check on 20 known questions."""
    test_cases = [
        ("What is 2 + 2?", "easy"),
        ("Name the capital city of France.", "easy"),
        ("What color is the sky on a clear day?", "easy"),
        ("How many legs does a spider have?", "easy"),
        ("What does photosynthesis produce?", "easy"),
        ("Which planet is closest to the Sun?", "easy"),
        ("What is the chemical symbol for water?", "medium"),
        ("According to the passage, what is the main argument the author makes?", "medium"),
        ("Which of the following best explains why the experiment results varied?", "medium"),
        ("What inference can be drawn from the data in the table?", "medium"),
        ("How does the structure of the poem contribute to its meaning?", "medium"),
        ("Based on the context, which choice most logically completes the text?", "medium"),
        ("A researcher hypothesizes that the drug affects ion channel permeability. Which experimental design best tests this?", "hard"),
        ("Which mathematical expression correctly models the relationship between the variables?", "hard"),
        ("Given the thermodynamic principles described, what would be the entropy change?", "hard"),
        ("Which of the following findings, if true, would most directly challenge the evolutionary hypothesis?", "hard"),
        ("How does the rhetorical strategy in paragraph 3 differ from the strategy in paragraph 1?", "hard"),
        ("If f(x) = 3x² + 2x - 1, what is the value of f(-2)?", "hard"),
        ("A particle moves in a circle with radius r. What is the centripetal acceleration?", "hard"),
        ("Which of the following is an example of confirmation bias in the described study?", "hard"),
    ]
    print("\n" + "="*60)
    print("BATCH EVALUATION (20 sample questions)")
    print("="*60)
    correct = 0
    for text, expected in test_cases:
        result = predict(text, tokenizer, model, id2label)
        match  = "✓" if result["difficulty"] == expected else "✗"
        if result["difficulty"] == expected:
            correct += 1
        print(f"{match} [{expected:6s} → {result['difficulty']:6s}] ({result['confidence']:5.1f}%) {text[:60]}…" if len(text) > 60 else f"{match} [{expected:6s} → {result['difficulty']:6s}] ({result['confidence']:5.1f}%) {text}")
    print(f"\nBatch accuracy: {correct}/20 = {correct/20*100:.0f}%")
    print("="*60)


def main():
    tokenizer, model, id2label = load_model()
    if not model:
        return

    run_batch_eval(tokenizer, model, id2label)

    print("\nInteractive mode — type a question to classify (or 'quit' to exit):")
    while True:
        try:
            text = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if text.lower() in ("quit", "exit", "q"):
            break
        if not text:
            continue
        result = predict(text, tokenizer, model, id2label)
        print(f"  Difficulty : {result['difficulty'].upper()}")
        print(f"  Confidence : {result['confidence']}%")
        print(f"  All scores : easy={result['scores']['easy']}%  medium={result['scores']['medium']}%  hard={result['scores']['hard']}%")


if __name__ == "__main__":
    main()
