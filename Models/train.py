"""
train.py — Fine-tunes DistilBERT for 3-class difficulty classification.

WHY fine-tuning and not training from scratch?
DistilBERT already understands English grammar, vocabulary, and sentence
structure from pre-training on Wikipedia + BookCorpus. Fine-tuning adds
a classification head on top and adjusts weights slightly to map
"question complexity" → easy/medium/hard.
Training from scratch would need millions of examples. Fine-tuning needs ~100.

Run:
  python train.py

Output:
  saved_model/  ← the trained model files
  saved_model/label_map.json  ← maps int → label string
"""
import json
import os
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report

import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)

# ── Config ────────────────────────────────────────────────────────
MODEL_NAME   = "distilbert-base-uncased"
OUTPUT_DIR   = "saved_model"
TRAIN_CSV    = "data/train.csv"
VAL_CSV      = "data/val.csv"
MAX_LEN      = 128       # Max token length — 128 is enough for short questions
BATCH_SIZE   = 8
EPOCHS       = 5
LEARNING_RATE= 2e-5      # Standard fine-tuning LR for BERT-family models
SEED         = 42

# Label mapping
LABEL2ID = {"easy": 0, "medium": 1, "hard": 2}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}

torch.manual_seed(SEED)


# ── Dataset class ─────────────────────────────────────────────────
class QuestionDataset(Dataset):
    """
    WHY a custom Dataset?
    PyTorch's DataLoader expects a Dataset object that returns
    (input_ids, attention_mask, label) tensors. We wrap our CSV
    in this class to make it compatible.
    """
    def __init__(self, csv_path: str, tokenizer):
        df = pd.read_csv(csv_path)
        df = df.dropna()
        df = df[df["label"].isin(LABEL2ID.keys())]

        self.texts  = df["question_text"].tolist()
        self.labels = [LABEL2ID[l] for l in df["label"].tolist()]
        self.tokenizer = tokenizer

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=MAX_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids":      encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels":         torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ── Training ──────────────────────────────────────────────────────
def train():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Loading tokenizer and model...")
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model     = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=3,
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    # Load datasets
    train_ds = QuestionDataset(TRAIN_CSV, tokenizer)
    val_ds   = QuestionDataset(VAL_CSV,   tokenizer)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE)

    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    # Optimizer + scheduler
    # WHY linear schedule with warmup?
    # Learning rate starts low, ramps up during warmup steps, then
    # decays linearly. This prevents large weight updates early in
    # training that could destroy pre-trained representations.
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,
        num_training_steps=total_steps,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    model.to(device)

    best_val_acc = 0.0

    for epoch in range(EPOCHS):
        # ── Training phase ────────────────────────────────────────
        model.train()
        total_loss = 0

        for batch in train_loader:
            input_ids      = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels         = batch["labels"].to(device)

            optimizer.zero_grad()

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss    = outputs.loss
            loss.backward()

            # Gradient clipping — prevents exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)

            optimizer.step()
            scheduler.step()

            total_loss += loss.item()

        avg_loss = total_loss / len(train_loader)

        # ── Validation phase ──────────────────────────────────────
        model.eval()
        preds_all  = []
        labels_all = []

        with torch.no_grad():
            for batch in val_loader:
                input_ids      = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels         = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds   = outputs.logits.argmax(dim=-1)

                preds_all.extend(preds.cpu().numpy())
                labels_all.extend(labels.cpu().numpy())

        val_acc = np.mean(np.array(preds_all) == np.array(labels_all))
        print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {avg_loss:.4f} | Val Acc: {val_acc:.4f}")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model.save_pretrained(OUTPUT_DIR)
            tokenizer.save_pretrained(OUTPUT_DIR)
            print(f"  ✓ Saved best model (val_acc={val_acc:.4f})")

    # Save label map
    with open(f"{OUTPUT_DIR}/label_map.json", "w") as f:
        json.dump(ID2LABEL, f)

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")
    print(f"Model saved to: {OUTPUT_DIR}/")

    # Final classification report
    print("\nClassification Report on validation set:")
    target_names = ["easy", "medium", "hard"]
    print(classification_report(labels_all, preds_all, target_names=target_names))


if __name__ == "__main__":
    train()