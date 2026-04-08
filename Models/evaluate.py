"""
evaluate.py — Tests the saved model on sample questions.
Run: python evaluate.py
"""
import json
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

MODEL_PATH = "saved_model"


def load_model():
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_PATH)
    model     = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
    with open(f"{MODEL_PATH}/label_map.json") as f:
        id2label = {int(k): v for k, v in json.load(f).items()}
    return tokenizer, model, id2label


def predict(text: str, tokenizer, model, id2label: dict) -> tuple[str, dict]:
    """Returns (predicted_label, confidence_scores)"""
    inputs = tokenizer(
        text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )
    with torch.no_grad():
        logits = model(**inputs).logits
        probs  = torch.softmax(logits, dim=-1).squeeze().tolist()

    pred_id = logits.argmax(dim=-1).item()
    pred_label = id2label[pred_id]
    confidence = {id2label[i]: round(p, 3) for i, p in enumerate(probs)}
    return pred_label, confidence


def main():
    print("Loading model...")
    tokenizer, model, id2label = load_model()

    test_questions = [
        # Expected: easy
        ("What is 2 + 2?", "easy"),
        ("How many sides does a square have?", "easy"),
        ("What is the chemical formula of water?", "easy"),

        # Expected: medium
        ("Solve for x: 3x + 5 = 20", "medium"),
        ("Calculate the area of a circle with radius 7 cm.", "medium"),
        ("Explain the difference between RAM and ROM.", "medium"),

        # Expected: hard
        ("Prove by mathematical induction that n² > n for all n > 1.", "hard"),
        ("Explain the time complexity of Dijkstra's algorithm and justify it.", "hard"),
        ("Derive the equation of a parabola from its focus-directrix definition.", "hard"),
    ]

    print("\n{'Question':<60} {'Expected':<10} {'Predicted':<10} {'Correct?'}")
    print("-" * 100)

    correct = 0
    for question, expected in test_questions:
        predicted, scores = predict(question, tokenizer, model, id2label)
        is_correct = predicted == expected
        if is_correct:
            correct += 1
        status = "✓" if is_correct else "✗"
        print(f"{question[:58]:<60} {expected:<10} {predicted:<10} {status}")
        print(f"  Scores: {scores}")

    print(f"\nAccuracy on test set: {correct}/{len(test_questions)} = {correct/len(test_questions):.0%}")

    # Interactive testing
    print("\n--- Interactive Test (type 'quit' to exit) ---")
    while True:
        q = input("\nEnter question: ").strip()
        if q.lower() in ("quit", "exit", "q"):
            break
        if q:
            label, scores = predict(q, tokenizer, model, id2label)
            print(f"  → Prediction: {label.upper()}")
            print(f"  → Confidence: {scores}")


if __name__ == "__main__":
    main()