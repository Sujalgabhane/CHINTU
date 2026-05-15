"""
evaluate_model.py - Complete evaluation report with all metrics & graphs (PyTorch)
Author: Emotion AI System

Usage:
    python evaluate_model.py
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm

from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_curve, auc, precision_recall_curve,
    accuracy_score, precision_score, recall_score, f1_score
)
from sklearn.preprocessing import label_binarize

from utils import (
    EMOTIONS, NUM_CLASSES, MODEL_PATH, MODELS_DIR,
    EVAL_DIR, LOGS_DIR, ensure_dirs, get_logger
)
from preprocess import EmotionDataset, split_paths, discover_dataset

# ─────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────

ensure_dirs()
logger = get_logger("evaluate", log_file=os.path.join(LOGS_DIR, "evaluation.log"))
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

sns.set_theme(style="darkgrid", palette="muted")
PALETTE = sns.color_palette("husl", NUM_CLASSES)


# ─────────────────────────────────────────────
# LOAD MODEL
# ─────────────────────────────────────────────

def load_model():
    """Load the EmotionNet model from saved weights."""
    if not os.path.exists(MODEL_PATH):
        logger.error(f"Model not found: {MODEL_PATH}")
        logger.error("Run train_model.py first!")
        sys.exit(1)

    from train_model import EmotionNet
    model = EmotionNet(num_classes=NUM_CLASSES).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    logger.info(f"Model loaded from {MODEL_PATH}")
    return model


# ─────────────────────────────────────────────
# LOAD TEST DATA
# ─────────────────────────────────────────────

def load_test_data(batch_size: int = 32):
    """Load the test split (uses saved JSON if available, else re-splits)."""
    split_path = os.path.join(MODELS_DIR, "test_split.json")

    if os.path.exists(split_path):
        logger.info(f"Loading saved test split from {split_path}")
        with open(split_path) as f:
            data = json.load(f)
        paths_test  = data["paths"]
        labels_test = data["labels"]
    else:
        logger.warning("test_split.json not found — re-splitting dataset")
        all_paths, all_labels, _ = discover_dataset()
        _, _, paths_test, _, _, labels_test = split_paths(all_paths, all_labels)

    test_ds = EmotionDataset(paths_test, labels_test,
                             use_face_crop=True, augment=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size,
                             shuffle=False, num_workers=0)
    logger.info(f"Test samples: {len(paths_test)}")
    return test_loader, labels_test


# ─────────────────────────────────────────────
# PREDICTIONS
# ─────────────────────────────────────────────

@torch.no_grad()
def get_predictions(model, loader) -> tuple:
    """Run inference and return (y_true, y_pred, y_prob)."""
    all_labels, all_probs = [], []

    for images, labels in tqdm(loader, desc="Predicting"):
        images = images.to(DEVICE)
        logits = model(images)
        probs  = F.softmax(logits, dim=1).cpu().numpy()
        all_probs.append(probs)
        all_labels.extend(labels.numpy())

    y_prob = np.vstack(all_probs)
    y_true = np.array(all_labels, dtype=int)
    y_pred = y_prob.argmax(axis=1)
    return y_true, y_pred, y_prob


# ─────────────────────────────────────────────
# METRICS
# ─────────────────────────────────────────────

def compute_metrics(y_true, y_pred, y_prob) -> dict:
    """Return dict of scalar evaluation metrics."""
    acc       = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    recall    = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1        = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    # Macro AUC
    y_bin = label_binarize(y_true, classes=list(range(NUM_CLASSES)))
    auc_scores = []
    for i in range(NUM_CLASSES):
        if y_bin[:, i].sum() > 0:
            fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
            auc_scores.append(auc(fpr, tpr))
    macro_auc = float(np.mean(auc_scores)) if auc_scores else 0.0

    return {
        "accuracy":  acc,
        "precision": precision,
        "recall":    recall,
        "f1_score":  f1,
        "macro_auc": macro_auc,
    }


# ─────────────────────────────────────────────
# CONSOLE REPORT
# ─────────────────────────────────────────────

def print_report(metrics, y_true, y_pred, y_prob):
    sep = "=" * 60
    print(f"\n{sep}")
    print("  MODEL EVALUATION REPORT")
    print(sep)
    print(f"  Test Accuracy       : {metrics['accuracy']*100:.2f}%")
    print(f"  Precision (weighted): {metrics['precision']*100:.2f}%")
    print(f"  Recall    (weighted): {metrics['recall']*100:.2f}%")
    print(f"  F1 Score  (weighted): {metrics['f1_score']*100:.2f}%")
    print(f"  AUC Score (macro)   : {metrics['macro_auc']:.4f}")
    print(sep)

    report = classification_report(y_true, y_pred,
                                   target_names=EMOTIONS, digits=4)
    print("\nClassification Report:\n")
    print(report)

    cm       = confusion_matrix(y_true, y_pred)
    per_cls  = cm.diagonal() / cm.sum(axis=1)
    print("Per-Class Accuracy:")
    for i, e in enumerate(EMOTIONS):
        support = int(cm.sum(axis=1)[i])
        print(f"  {e:12s}: {per_cls[i]*100:6.2f}%  (support: {support})")
    print(f"\n{sep}\n")


# ─────────────────────────────────────────────
# VISUALIZATION
# ─────────────────────────────────────────────

def plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d",
                xticklabels=EMOTIONS, yticklabels=EMOTIONS,
                cmap="Blues", linewidths=0.5, ax=ax)
    ax.set_title("Confusion Matrix", fontsize=16, pad=15)
    ax.set_xlabel("Predicted Label", fontsize=12)
    ax.set_ylabel("True Label", fontsize=12)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "confusion_matrix.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved confusion_matrix.png")


def plot_roc_curves(y_true, y_prob):
    y_bin = label_binarize(y_true, classes=list(range(NUM_CLASSES)))
    fig, ax = plt.subplots(figsize=(10, 7))
    for i, emotion in enumerate(EMOTIONS):
        if y_bin[:, i].sum() == 0:
            continue
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
        roc_auc     = auc(fpr, tpr)
        ax.plot(fpr, tpr, label=f"{emotion} (AUC={roc_auc:.3f})",
                linewidth=2, color=PALETTE[i])
    ax.plot([0, 1], [0, 1], "k--", linewidth=1.5, label="Random Classifier")
    ax.set_title("ROC Curves — All Emotions", fontsize=16)
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(True, alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "roc_curve.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved roc_curve.png")


def plot_precision_recall(y_true, y_prob):
    y_bin = label_binarize(y_true, classes=list(range(NUM_CLASSES)))
    fig, ax = plt.subplots(figsize=(10, 7))
    for i, emotion in enumerate(EMOTIONS):
        if y_bin[:, i].sum() == 0:
            continue
        prec, rec, _ = precision_recall_curve(y_bin[:, i], y_prob[:, i])
        pr_auc       = auc(rec, prec)
        ax.plot(rec, prec, label=f"{emotion} (AUC={pr_auc:.3f})",
                linewidth=2, color=PALETTE[i])
    ax.set_title("Precision-Recall Curves — All Emotions", fontsize=16)
    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.legend(loc="upper right", fontsize=9)
    ax.grid(True, alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "precision_recall_curve.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved precision_recall_curve.png")


def plot_class_accuracy(y_true, y_pred):
    cm      = confusion_matrix(y_true, y_pred)
    per_cls = cm.diagonal() / cm.sum(axis=1) * 100

    hex_colors = [f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
                  for r, g, b in PALETTE]
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(EMOTIONS, per_cls, color=hex_colors,
                  edgecolor="white", linewidth=0.8)
    for bar, pct in zip(bars, per_cls):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.8,
                f"{pct:.1f}%", ha="center", va="bottom", fontsize=9)
    ax.set_title("Per-Class Accuracy", fontsize=16)
    ax.set_ylabel("Accuracy (%)", fontsize=12)
    ax.set_ylim(0, 112)
    ax.set_xticklabels(EMOTIONS, rotation=30, ha="right")
    ax.grid(axis="y", alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "class_accuracy.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved class_accuracy.png")


def plot_emotion_distribution(y_true):
    counts = [int((y_true == i).sum()) for i in range(NUM_CLASSES)]
    fig, ax = plt.subplots(figsize=(9, 6))
    wedges, texts, autotexts = ax.pie(
        counts, labels=EMOTIONS, autopct="%1.1f%%",
        colors=PALETTE, startangle=140, pctdistance=0.82
    )
    for t in autotexts:
        t.set_fontsize(9)
    ax.set_title("Emotion Distribution (Test Set)", fontsize=16)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "emotion_distribution.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved emotion_distribution.png")


def plot_confidence_histogram(y_prob, y_pred):
    top_conf = y_prob[np.arange(len(y_pred)), y_pred] * 100
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.hist(top_conf, bins=40, color="#4C9BE8", edgecolor="white", linewidth=0.5)
    ax.set_title("Prediction Confidence Histogram", fontsize=16)
    ax.set_xlabel("Confidence (%)", fontsize=12)
    ax.set_ylabel("Number of Samples", fontsize=12)
    ax.axvline(float(np.mean(top_conf)), color="red", linestyle="--",
               linewidth=2, label=f"Mean: {np.mean(top_conf):.1f}%")
    ax.legend(); ax.grid(alpha=0.4)
    plt.tight_layout()
    fig.savefig(os.path.join(EVAL_DIR, "confidence_histogram.png"), dpi=150)
    plt.close(fig)
    logger.info("Saved confidence_histogram.png")


def plot_training_curves_from_history():
    """Reload training history JSON and regenerate accuracy/loss plots."""
    history_path = os.path.join(LOGS_DIR, "training_history.json")
    if not os.path.exists(history_path):
        logger.warning("training_history.json not found — skipping training curve plots.")
        return

    with open(history_path) as f:
        history = json.load(f)

    warmup_end = history.get("warmup_epochs", 0)
    epochs = range(1, len(history["train_acc"]) + 1)

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
    logger.info("Saved accuracy_plot.png and loss_plot.png from training history")


def save_classification_report(y_true, y_pred):
    """Save full classification report as CSV."""
    report_dict = classification_report(
        y_true, y_pred,
        target_names=EMOTIONS,
        output_dict=True,
        zero_division=0
    )
    df = pd.DataFrame(report_dict).T
    csv_path = os.path.join(EVAL_DIR, "classification_report.csv")
    df.to_csv(csv_path)
    logger.info(f"Saved classification_report.csv")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    ensure_dirs()

    logger.info("=" * 60)
    logger.info("  EMOTION AI — EVALUATION PIPELINE  (PyTorch)")
    logger.info("=" * 60)

    model                  = load_model()
    test_loader, _         = load_test_data()

    logger.info("\nRunning inference on test set ...")
    y_true, y_pred, y_prob = get_predictions(model, test_loader)

    metrics = compute_metrics(y_true, y_pred, y_prob)
    print_report(metrics, y_true, y_pred, y_prob)

    logger.info("\nGenerating all visualisations ...")
    plot_training_curves_from_history()
    plot_confusion_matrix(y_true, y_pred)
    plot_roc_curves(y_true, y_prob)
    plot_precision_recall(y_true, y_prob)
    plot_class_accuracy(y_true, y_pred)
    plot_emotion_distribution(y_true)
    plot_confidence_histogram(y_prob, y_pred)
    save_classification_report(y_true, y_pred)

    logger.info(f"\n[DONE] All outputs saved to: {EVAL_DIR}/")
    for f in sorted(os.listdir(EVAL_DIR)):
        logger.info(f"    {f}")


if __name__ == "__main__":
    main()
