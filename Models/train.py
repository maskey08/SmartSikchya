"""
train.py v2 — Fixed AdamW import + 300 examples + class weights.
"""
import json, os
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report
from collections import Counter

import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW  # FIX: moved from transformers to torch.optim in newer versions
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)

MODEL_NAME    = "distilbert-base-uncased"
OUTPUT_DIR    = "saved_model"
TRAIN_CSV     = "data/train.csv"
VAL_CSV       = "data/val.csv"
MAX_LEN       = 128
BATCH_SIZE    = 16
EPOCHS        = 8
LEARNING_RATE = 3e-5
SEED          = 42

LABEL2ID = {"easy": 0, "medium": 1, "hard": 2}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}
torch.manual_seed(SEED)


class QuestionDataset(Dataset):
    def __init__(self, csv_path, tokenizer):
        df = pd.read_csv(csv_path).dropna()
        df = df[df["label"].isin(LABEL2ID.keys())]
        self.texts  = df["question_text"].tolist()
        self.labels = [LABEL2ID[l] for l in df["label"].tolist()]
        self.tok    = tokenizer

    def __len__(self): return len(self.texts)

    def __getitem__(self, idx):
        enc = self.tok(self.texts[idx], max_length=MAX_LEN,
                       padding="max_length", truncation=True, return_tensors="pt")
        return {
            "input_ids":      enc["input_ids"].squeeze(),
            "attention_mask": enc["attention_mask"].squeeze(),
            "labels":         torch.tensor(self.labels[idx], dtype=torch.long),
        }


def train():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Loading DistilBERT...")
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model     = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=3, id2label=ID2LABEL, label2id=LABEL2ID,
    )

    train_ds = QuestionDataset(TRAIN_CSV, tokenizer)
    val_ds   = QuestionDataset(VAL_CSV,   tokenizer)

    label_counts = Counter(train_ds.labels)
    total   = len(train_ds.labels)
    weights = torch.tensor([total / (3 * label_counts[i]) for i in range(3)], dtype=torch.float)
    print(f"Class weights: {dict(zip(['easy','medium','hard'], weights.tolist()))}")

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE)
    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    optimizer   = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler   = get_linear_schedule_with_warmup(optimizer, total_steps // 10, total_steps)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    model.to(device)
    loss_fn = torch.nn.CrossEntropyLoss(weight=weights.to(device))

    best_val_acc = 0.0

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for batch in train_loader:
            ids, mask, lbls = (batch["input_ids"].to(device),
                               batch["attention_mask"].to(device),
                               batch["labels"].to(device))
            optimizer.zero_grad()
            loss = loss_fn(model(input_ids=ids, attention_mask=mask).logits, lbls)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

        model.eval()
        preds_all, labels_all = [], []
        with torch.no_grad():
            for batch in val_loader:
                ids  = batch["input_ids"].to(device)
                mask = batch["attention_mask"].to(device)
                lbls = batch["labels"].to(device)
                preds = model(input_ids=ids, attention_mask=mask).logits.argmax(dim=-1)
                preds_all.extend(preds.cpu().numpy())
                labels_all.extend(lbls.cpu().numpy())

        val_acc = np.mean(np.array(preds_all) == np.array(labels_all))
        print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {total_loss/len(train_loader):.4f} | Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            model.save_pretrained(OUTPUT_DIR)
            tokenizer.save_pretrained(OUTPUT_DIR)
            print(f"  ✓ Saved (acc={val_acc:.4f})")

    with open(f"{OUTPUT_DIR}/label_map.json", "w") as f:
        json.dump(ID2LABEL, f)

    print(f"\nBest val accuracy: {best_val_acc:.4f}")
    print(classification_report(labels_all, preds_all, target_names=["easy","medium","hard"]))


if __name__ == "__main__":
    train()
