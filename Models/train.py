"""
train.py — Fine-tune DistilBERT for 3-class difficulty classification.
─────────────────────────────────────────────────────────────────────
Classes:  0=easy  1=medium  2=hard
Input:    balanced_questions.csv  (from download_real_datasets.py)
Output:   saved_model/            (copy this folder to backend/app/ai/difficulty_model/)

ARCHITECTURE DECISIONS:
  - DistilBERT (not BERT) because it's 40% smaller and 60% faster,
    which matters when the backend runs on CPU.
  - Class-weighted loss: computed from actual class distribution in
    the training split so the model doesn't default-predict "medium".
  - AdamW from torch.optim (NOT transformers.AdamW which is deprecated).
  - Gradient clipping at 1.0 to prevent exploding gradients on
    longer questions that exceed 128 tokens.
  - Best-model checkpoint: saves the epoch with the highest validation
    accuracy, not just the final epoch (avoids overfitting on later epochs).

USAGE:
  cd Models
  venv\Scripts\activate           (Windows) or source venv/bin/activate (Mac/Linux)
  pip install transformers torch datasets scikit-learn pandas
  python train.py

  Expected training time: ~5 min on CPU, ~45 sec on GPU.
  Expected final val accuracy: 78–85% (real datasets).
"""
import os
import pandas as pd
import numpy as np
import torch
from torch import nn
from torch.optim import AdamW
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)

# ── Config ─────────────────────────────────────────────────────
MODEL_NAME    = "distilbert-base-uncased"
MAX_LEN       = 128
BATCH_SIZE    = 16
EPOCHS        = 10
LR            = 3e-5
SEED          = 42
CSV_PATH      = os.path.join(os.path.dirname(__file__), "balanced_questions.csv")
SAVE_DIR      = os.path.join(os.path.dirname(__file__), "saved_model")
LABEL_MAP     = {0: "easy", 1: "medium", 2: "hard"}

torch.manual_seed(SEED)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")


# ── Dataset ─────────────────────────────────────────────────────
class QuestionDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.encodings = tokenizer(
            texts,
            max_length=MAX_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids":      self.encodings["input_ids"][idx],
            "attention_mask": self.encodings["attention_mask"][idx],
            "labels":         self.labels[idx],
        }


# ── Training loop ────────────────────────────────────────────────
def train():
    # Load data
    df = pd.read_csv(CSV_PATH)
    df = df.dropna(subset=["question", "label"])
    df["label"] = df["label"].astype(int)
    print(f"Loaded {len(df)} rows: {df['difficulty'].value_counts().to_dict()}")

    texts  = df["question"].astype(str).tolist()
    labels = df["label"].tolist()

    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.15, random_state=SEED, stratify=labels
    )
    print(f"Train: {len(train_texts)}  Val: {len(val_texts)}")

    # Tokeniser + model
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model     = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=3
    )
    model.to(device)

    train_ds = QuestionDataset(train_texts, train_labels, tokenizer)
    val_ds   = QuestionDataset(val_texts,   val_labels,   tokenizer)
    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_dl   = DataLoader(val_ds,   batch_size=BATCH_SIZE)

    # Class weights — corrects for imbalance in the training split
    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.array([0, 1, 2]),
        y=train_labels,
    )
    weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
    loss_fn        = nn.CrossEntropyLoss(weight=weights_tensor)
    print(f"Class weights: easy={class_weights[0]:.3f} medium={class_weights[1]:.3f} hard={class_weights[2]:.3f}")

    optimizer = AdamW(model.parameters(), lr=LR, weight_decay=0.01)
    total_steps = len(train_dl) * EPOCHS
    scheduler   = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,   # 10% warmup
        num_training_steps=total_steps,
    )

    best_val_acc = 0.0
    best_epoch   = 0

    for epoch in range(1, EPOCHS + 1):
        # ── Train ──────────────────────────────────────────────
        model.train()
        train_loss = 0.0
        for batch in train_dl:
            input_ids  = batch["input_ids"].to(device)
            attn_mask  = batch["attention_mask"].to(device)
            labels_b   = batch["labels"].to(device)

            optimizer.zero_grad()
            outputs  = model(input_ids=input_ids, attention_mask=attn_mask)
            loss     = loss_fn(outputs.logits, labels_b)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # gradient clipping
            optimizer.step()
            scheduler.step()
            train_loss += loss.item()

        avg_train_loss = train_loss / len(train_dl)

        # ── Validate ────────────────────────────────────────────
        model.eval()
        correct = 0
        total   = 0
        val_loss = 0.0
        per_class = {0: [0, 0], 1: [0, 0], 2: [0, 0]}   # [correct, total]
        with torch.no_grad():
            for batch in val_dl:
                input_ids  = batch["input_ids"].to(device)
                attn_mask  = batch["attention_mask"].to(device)
                labels_b   = batch["labels"].to(device)
                outputs    = model(input_ids=input_ids, attention_mask=attn_mask)
                loss       = loss_fn(outputs.logits, labels_b)
                val_loss  += loss.item()
                preds      = outputs.logits.argmax(dim=-1)
                for p, l in zip(preds.cpu().tolist(), labels_b.cpu().tolist()):
                    total += 1
                    per_class[l][1] += 1
                    if p == l:
                        correct += 1
                        per_class[l][0] += 1

        val_acc = correct / total
        print(
            f"Epoch {epoch:2d}/{EPOCHS}  "
            f"train_loss={avg_train_loss:.4f}  val_loss={val_loss/len(val_dl):.4f}  "
            f"val_acc={val_acc:.4f}  "
            f"easy={per_class[0][0]}/{per_class[0][1]}  "
            f"medium={per_class[1][0]}/{per_class[1][1]}  "
            f"hard={per_class[2][0]}/{per_class[2][1]}"
        )

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_epoch   = epoch
            os.makedirs(SAVE_DIR, exist_ok=True)
            model.save_pretrained(SAVE_DIR)
            tokenizer.save_pretrained(SAVE_DIR)
            # Save label mapping
            import json
            with open(os.path.join(SAVE_DIR, "label_map.json"), "w") as f:
                json.dump({"id2label": LABEL_MAP, "label2id": {v:k for k,v in LABEL_MAP.items()}}, f)
            print(f"  ✓ Best model saved (epoch {epoch}, val_acc={val_acc:.4f})")

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f} at epoch {best_epoch}")
    print(f"Model saved to: {SAVE_DIR}")
    print(f"\nNext step:")
    print(f"  Copy '{SAVE_DIR}' to 'backend/app/ai/difficulty_model/'")
    print(f"  Then restart the backend server.")

    if best_val_acc < 0.75:
        print("\n⚠ Accuracy below 75%. Try increasing N_PER_CLASS in download_real_datasets.py to 600.")


if __name__ == "__main__":
    train()
