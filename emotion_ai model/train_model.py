"""
train_model.py - Train CNN emotion recognition model (PyTorch + MobileNetV2)
Author: Emotion AI System

Usage:
    python train_model.py
"""

import os
import time
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torchvision import models
from tqdm import tqdm

from utils import (
    EMOTIONS, NUM_CLASSES, MODEL_PATH,
    MODELS_DIR, EVAL_DIR, LOGS_DIR,
    ensure_dirs, get_logger
)
from preprocess import make_dataloaders

# ─────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────

ensure_dirs()
logger = get_logger("train", log_file=os.path.join(LOGS_DIR, "training.log"))

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {DEVICE}")


# ─────────────────────────────────────────────
# MODEL ARCHITECTURE
# ─────────────────────────────────────────────

class EmotionNet(nn.Module):
    """
    MobileNetV2 backbone + custom classification head for N emotion classes.

    Architecture:
        MobileNetV2 (ImageNet pretrained) -> Adaptive Avg Pool
        -> Flatten -> BN -> Dropout -> FC(512) -> BN -> Dropout -> FC(256) -> FC(N) -> Softmax
    """

    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = 0.4):
        super().__init__()

        # ── Backbone ──────────────────────────────────────────
        backbone = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        self.features = backbone.features          # all conv layers

        # ── Head ──────────────────────────────────────────────
        in_features = backbone.classifier[-1].in_features   # 1280
        self.head = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.BatchNorm1d(in_features),
            nn.Dropout(dropout),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(dropout / 2),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.head(x)
        return x   # raw logits; softmax applied during inference

    def freeze_backbone(self):
        """Freeze all backbone parameters (train head only)."""
        for p in self.features.parameters():
            p.requires_grad = False

    def unfreeze_top_backbone(self, num_layers: int = 5):
        """Unfreeze the last `num_layers` blocks of MobileNetV2 features."""
        children = list(self.features.children())
        for child in children[-num_layers:]:
            for p in child.parameters():
                p.requires_grad = True
        logger.info(f"Unfroze top {num_layers} backbone feature blocks")

    def unfreeze_all(self):
        """Unfreeze entire network for full fine-tuning."""
        for p in self.parameters():
            p.requires_grad = True
        logger.info("All layers unfrozen")


# ─────────────────────────────────────────────
# TRAINING LOOP
# ─────────────────────────────────────────────

def train_one_epoch(model, loader, criterion, optimizer, device) -> tuple:
    """Run one training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    total_loss = 0.0
    correct    = 0
    total      = 0

    for images, labels in tqdm(loader, desc="  Train", leave=False):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        logits = model(images)
        loss   = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * images.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total   += images.size(0)

    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device) -> tuple:
    """Run one evaluation pass. Returns (avg_loss, accuracy)."""
    model.eval()
    total_loss = 0.0
    correct    = 0
    total      = 0

    for images, labels in tqdm(loader, desc="  Eval ", leave=False):
        images, labels = images.to(device), labels.to(device)
        logits = model(images)
        loss   = criterion(logits, labels)

        total_loss += loss.item() * images.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total   += images.size(0)

    return total_loss / total, correct / total


# ─────────────────────────────────────────────
# PLOTTING
# ─────────────────────────────────────────────

def plot_curves(history: dict):
    """Save accuracy and loss plots from history dict."""
    epochs = range(1, len(history["train_acc"]) + 1)
    warmup_end = history.get("warmup_epochs", 0)

    # Accuracy
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(epochs, history["train_acc"], label="Train Accuracy", color="#4C9BE8", lw=2)
    ax.plot(epochs, history["val_acc"],   label="Val Accuracy",   color="#E84C9B", lw=2)
    if warmup_end:
        ax.axvline(warmup_end, color="gray", linestyle="--", alpha=0.7, label="Fine-tune start")
    ax.set_title("Training vs Validation Accuracy", fontsize=14)
    ax.set_xlabel("Epoch"); ax.set_ylabel("Accuracy")
    ax.legend(); ax.grid(alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "accuracy_plot.png"), dpi=150)
    plt.close(fig)

    # Loss
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(epochs, history["train_loss"], label="Train Loss", color="#4CE8A0", lw=2)
    ax.plot(epochs, history["val_loss"],   label="Val Loss",   color="#E8A04C", lw=2)
    if warmup_end:
        ax.axvline(warmup_end, color="gray", linestyle="--", alpha=0.7, label="Fine-tune start")
    ax.set_title("Training vs Validation Loss", fontsize=14)
    ax.set_xlabel("Epoch"); ax.set_ylabel("Loss")
    ax.legend(); ax.grid(alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "loss_plot.png"), dpi=150)
    plt.close(fig)

    logger.info("Saved accuracy_plot.png and loss_plot.png")


# ─────────────────────────────────────────────
# MAIN TRAINING PIPELINE
# ─────────────────────────────────────────────

# Hyper-parameters
BATCH_SIZE     = 32
WARMUP_EPOCHS  = 15
FINETUNE_EPOCHS = 25
PATIENCE       = 8      # early stopping patience
LR_WARMUP      = 1e-3
LR_FINETUNE    = 3e-5


def train():
    logger.info("=" * 60)
    logger.info("  EMOTION AI — TRAINING PIPELINE  (PyTorch)")
    logger.info("=" * 60)

    # ── 1. Data ───────────────────────────────────────────────
    logger.info("\n[1/5] Loading dataset and building dataloaders ...")
    loaders = make_dataloaders(batch_size=BATCH_SIZE, num_workers=0,
                               use_face_crop=True)
    train_loader = loaders["train"]
    val_loader   = loaders["val"]
    test_loader  = loaders["test"]

    # ── 2. Model ──────────────────────────────────────────────
    logger.info("\n[2/5] Building EmotionNet (MobileNetV2 backbone) ...")
    model = EmotionNet(num_classes=NUM_CLASSES).to(DEVICE)
    model.freeze_backbone()

    total_params     = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"  Total params: {total_params:,}  |  Trainable: {trainable_params:,}")

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # ── 3. Phase 1 — Warm-up ──────────────────────────────────
    logger.info(f"\n[3/5] Phase 1: Warm-up ({WARMUP_EPOCHS} epochs, head only) ...")
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR_WARMUP
    )
    scheduler = ReduceLROnPlateau(optimizer, mode="min", factor=0.5,
                                  patience=4, min_lr=1e-7)

    history = {"train_loss": [], "train_acc": [],
               "val_loss": [],   "val_acc": [],
               "warmup_epochs": WARMUP_EPOCHS}

    best_val_acc  = 0.0
    patience_cnt  = 0
    best_ckpt     = os.path.join(MODELS_DIR, "best_warmup.pth")

    t0 = time.time()

    for epoch in range(1, WARMUP_EPOCHS + 1):
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        vl_loss, vl_acc = evaluate(model, val_loader, criterion, DEVICE)
        scheduler.step(vl_loss)

        history["train_loss"].append(tr_loss)
        history["train_acc"].append(tr_acc)
        history["val_loss"].append(vl_loss)
        history["val_acc"].append(vl_acc)

        logger.info(
            f"  Epoch [{epoch:3d}/{WARMUP_EPOCHS}] "
            f"Train: {tr_acc*100:.2f}% ({tr_loss:.4f})  "
            f"Val: {vl_acc*100:.2f}% ({vl_loss:.4f})"
        )

        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save(model.state_dict(), best_ckpt)
            patience_cnt = 0
        else:
            patience_cnt += 1
            if patience_cnt >= PATIENCE:
                logger.info("  Early stopping triggered (warm-up).")
                break

    # Load best warm-up weights before fine-tuning
    model.load_state_dict(torch.load(best_ckpt, map_location=DEVICE))
    logger.info(f"  Best warm-up val accuracy: {best_val_acc*100:.2f}%")

    # ── 4. Phase 2 — Fine-tuning ──────────────────────────────
    logger.info(f"\n[4/5] Phase 2: Fine-tuning ({FINETUNE_EPOCHS} epochs) ...")
    model.unfreeze_top_backbone(num_layers=5)

    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR_FINETUNE
    )
    scheduler = ReduceLROnPlateau(optimizer, mode="min", factor=0.5,
                                  patience=4, min_lr=1e-8)

    best_val_acc  = 0.0
    patience_cnt  = 0
    best_ckpt_ft  = os.path.join(MODELS_DIR, "best_finetune.pth")

    for epoch in range(1, FINETUNE_EPOCHS + 1):
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        vl_loss, vl_acc = evaluate(model, val_loader, criterion, DEVICE)
        scheduler.step(vl_loss)

        history["train_loss"].append(tr_loss)
        history["train_acc"].append(tr_acc)
        history["val_loss"].append(vl_loss)
        history["val_acc"].append(vl_acc)

        logger.info(
            f"  Epoch [{epoch:3d}/{FINETUNE_EPOCHS}] "
            f"Train: {tr_acc*100:.2f}% ({tr_loss:.4f})  "
            f"Val: {vl_acc*100:.2f}% ({vl_loss:.4f})"
        )

        if vl_acc > best_val_acc:
            best_val_acc = vl_acc
            torch.save(model.state_dict(), best_ckpt_ft)
            patience_cnt = 0
        else:
            patience_cnt += 1
            if patience_cnt >= PATIENCE:
                logger.info("  Early stopping triggered (fine-tune).")
                break

    elapsed = time.time() - t0
    logger.info(f"\nTotal training time: {elapsed/60:.1f} minutes")
    logger.info(f"Best fine-tune val accuracy: {best_val_acc*100:.2f}%")

    # ── 5. Save final model ───────────────────────────────────
    logger.info(f"\n[5/5] Saving final model -> {MODEL_PATH}")
    # Load best fine-tune weights
    model.load_state_dict(torch.load(best_ckpt_ft, map_location=DEVICE))
    torch.save(model.state_dict(), MODEL_PATH)

    # Save training history
    history_path = os.path.join(LOGS_DIR, "training_history.json")
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)

    # ── 6. Test evaluation ────────────────────────────────────
    logger.info("\nEvaluating on test set ...")
    _, test_acc = evaluate(model, test_loader, criterion, DEVICE)
    logger.info(f"Test Accuracy: {test_acc*100:.2f}%")

    # ── 7. Plot curves ────────────────────────────────────────
    plot_curves(history)

    logger.info("\n[DONE] Run evaluate_model.py for the full evaluation report.")


if __name__ == "__main__":
    train()
