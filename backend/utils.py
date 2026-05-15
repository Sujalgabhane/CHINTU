"""
utils.py - Shared utilities for the Emotion AI project (PyTorch version)
Author: Emotion AI System
"""

import os
import cv2
import numpy as np
import logging
from collections import deque

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────

# Dataset source folder (one level up from emotion_ai/)
DATASET_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Dataset of Indian face images with various expressions"
)

# Map raw folder names → canonical emotion labels
FOLDER_TO_LABEL = {
    "Anger":      "Angry",
    "Confused":   "Confused",
    "Excited":    "Excited",
    "Fear":       "Fear",
    "Happy":      "Happiness",
    "Sadness":    "Sadness",
    "Surprised":  "Surprised",
    "Thaughtful": "Thoughtful",
}

# Canonical emotion list — sorted for consistent class indices
EMOTIONS = sorted(FOLDER_TO_LABEL.values())
NUM_CLASSES = len(EMOTIONS)

# Input image size
IMG_SIZE = (224, 224)

# Paths
PROJECT_DIR     = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR      = os.path.join(PROJECT_DIR, "models")
EVAL_DIR        = os.path.join(PROJECT_DIR, "evaluation")
LOGS_DIR        = os.path.join(PROJECT_DIR, "logs")
SCREENSHOTS_DIR = os.path.join(PROJECT_DIR, "screenshots")
RECORDINGS_DIR  = os.path.join(PROJECT_DIR, "recordings")
MODEL_PATH      = os.path.join(MODELS_DIR, "emotion_model.pth")

# Emotion colours for the live detector UI (BGR for OpenCV)
EMOTION_COLORS = {
    "Angry":      (0,   0,   220),
    "Confused":   (0,  165,  255),
    "Excited":    (0,  215,  255),
    "Fear":       (180,  0,  180),
    "Happiness":  (0,  200,   80),
    "Sadness":    (220,  80,   0),
    "Surprised":  (0,  200,  200),
    "Thoughtful": (100, 100, 255),
}


# ─────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────

def ensure_dirs():
    """Create all required project directories if they don't exist."""
    for d in [MODELS_DIR, EVAL_DIR, LOGS_DIR, SCREENSHOTS_DIR, RECORDINGS_DIR]:
        os.makedirs(d, exist_ok=True)


def get_logger(name: str, log_file: str = None) -> logging.Logger:
    """Return a configured logger that writes to console and optionally to file.

    Uses UTF-8 encoding on the stream handler to avoid UnicodeEncodeError
    on Windows terminals that default to cp1252.
    """
    import sys
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # avoid duplicate handlers
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s",
                            datefmt="%Y-%m-%d %H:%M:%S")

    # Force UTF-8 on stdout to handle any Unicode characters safely
    try:
        stream = open(sys.stdout.fileno(), mode="w", encoding="utf-8", buffering=1)
    except Exception:
        stream = sys.stdout
    ch = logging.StreamHandler(stream)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt)
        logger.addHandler(fh)

    return logger


def preprocess_face(face_bgr: np.ndarray) -> "torch.Tensor":
    """
    Preprocess a cropped face (BGR) for model inference.

    Returns a float32 torch.Tensor of shape (1, 3, 224, 224),
    normalised with ImageNet mean/std.
    """
    import torch
    from torchvision import transforms

    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    tensor   = transform(face_rgb)            # (3, H, W)
    return tensor.unsqueeze(0)                # (1, 3, H, W)


def enhance_low_light(frame: np.ndarray) -> np.ndarray:
    """Apply CLAHE-based low-light enhancement to a BGR frame."""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge((l, a, b))
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)


class MovingAverage:
    """Smooth predictions with a simple sliding-window average."""

    def __init__(self, window: int = 10, n_classes: int = NUM_CLASSES):
        self.buffer = deque(maxlen=window)

    def update(self, probs: np.ndarray) -> np.ndarray:
        self.buffer.append(probs)
        return np.mean(self.buffer, axis=0)

    def reset(self):
        self.buffer.clear()


def draw_probability_bars(frame: np.ndarray,
                          probs: np.ndarray,
                          emotions: list,
                          x_offset: int = 10,
                          y_start: int = 60,
                          bar_width: int = 180,
                          bar_height: int = 16,
                          gap: int = 6) -> np.ndarray:
    """Draw labelled probability bars on the left side of the frame."""
    overlay = frame.copy()
    panel_h = (bar_height + gap) * len(emotions) + 10
    cv2.rectangle(overlay,
                  (x_offset - 5, y_start - 5),
                  (x_offset + bar_width + 115, y_start + panel_h),
                  (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    for i, (emotion, prob) in enumerate(zip(emotions, probs)):
        y     = y_start + i * (bar_height + gap)
        color = EMOTION_COLORS.get(emotion, (200, 200, 200))
        filled = int(prob * bar_width)

        cv2.rectangle(frame, (x_offset, y),
                      (x_offset + bar_width, y + bar_height),
                      (60, 60, 60), -1)
        cv2.rectangle(frame, (x_offset, y),
                      (x_offset + filled, y + bar_height),
                      color, -1)
        label = f"{emotion[:7]:7s} {prob * 100:5.1f}%"
        cv2.putText(frame, label,
                    (x_offset + bar_width + 5, y + bar_height - 2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42,
                    (230, 230, 230), 1, cv2.LINE_AA)

    return frame


def draw_fps(frame: np.ndarray, fps: float) -> np.ndarray:
    """Draw FPS counter on top-right corner."""
    h, w = frame.shape[:2]
    cv2.putText(frame, f"FPS: {fps:.1f}",
                (w - 120, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7,
                (0, 255, 180), 2, cv2.LINE_AA)
    return frame
