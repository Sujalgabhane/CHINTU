"""
preprocess.py - Dataset loading, preprocessing, and augmentation pipeline (PyTorch)
Author: Emotion AI System

Run directly to verify dataset integrity:
    python preprocess.py
"""

import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm

import torch
from torch.utils.data import Dataset, DataLoader, random_split, WeightedRandomSampler
from torchvision import transforms
from sklearn.model_selection import train_test_split

# Try HEIC support
try:
    from pillow_heif import register_heif_opener
    from PIL import Image as PILImage
    register_heif_opener()
    HEIC_SUPPORT = True
except ImportError:
    HEIC_SUPPORT = False

from utils import (
    DATASET_ROOT, FOLDER_TO_LABEL, EMOTIONS, NUM_CLASSES,
    IMG_SIZE, get_logger, LOGS_DIR, ensure_dirs
)

ensure_dirs()
logger = get_logger("preprocess",
                    log_file=os.path.join(LOGS_DIR, "preprocess.log"))


# ─────────────────────────────────────────────
# IMAGENET NORMALISATION STATS
# ─────────────────────────────────────────────

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


# ─────────────────────────────────────────────
# IMAGE LOADERS
# ─────────────────────────────────────────────

def load_image(path: str) -> np.ndarray | None:
    """Load any supported image (JPG or HEIC) as RGB numpy array."""
    ext = Path(path).suffix.upper()
    if ext in (".JPG", ".JPEG", ".PNG"):
        img = cv2.imread(path)
        if img is None:
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    elif ext == ".HEIC":
        if not HEIC_SUPPORT:
            return None
        try:
            pil_img = PILImage.open(path).convert("RGB")
            return np.array(pil_img)
        except Exception:
            return None
    return None


# ─────────────────────────────────────────────
# FACE DETECTION
# ─────────────────────────────────────────────

_CASCADE = None


def _get_cascade() -> cv2.CascadeClassifier:
    global _CASCADE
    if _CASCADE is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _CASCADE = cv2.CascadeClassifier(cascade_path)
    return _CASCADE


def detect_and_crop_face(img_rgb: np.ndarray,
                          padding: float = 0.15) -> np.ndarray:
    """
    Detect the largest face and return a padded crop.
    Falls back to the full image if no face is detected.
    """
    gray    = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    cascade = _get_cascade()
    faces   = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    if len(faces) == 0:
        return img_rgb

    x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
    H, W = img_rgb.shape[:2]
    pad_x = int(w * padding)
    pad_y = int(h * padding)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(W, x + w + pad_x)
    y2 = min(H, y + h + pad_y)
    return img_rgb[y1:y2, x1:x2]


# ─────────────────────────────────────────────
# PYTORCH DATASET
# ─────────────────────────────────────────────

class EmotionDataset(Dataset):
    """
    Loads images from disk on demand with torchvision transforms.
    Applies face detection and optional augmentation.
    """

    TRAIN_TRANSFORM = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((256, 256)),
        transforms.RandomCrop(IMG_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.3, contrast=0.3,
                               saturation=0.3, hue=0.05),
        transforms.RandomRotation(degrees=15),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        transforms.RandomErasing(p=0.15, scale=(0.02, 0.1)),
    ])

    EVAL_TRANSFORM = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    def __init__(self, image_paths: list, labels: list,
                 use_face_crop: bool = True, augment: bool = False):
        self.paths         = image_paths
        self.labels        = labels
        self.use_face_crop = use_face_crop
        self.transform     = self.TRAIN_TRANSFORM if augment else self.EVAL_TRANSFORM

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, idx: int):
        img = load_image(self.paths[idx])
        if img is None:
            # Return zero image on failure
            img = np.zeros((*IMG_SIZE, 3), dtype=np.uint8)

        if self.use_face_crop:
            img = detect_and_crop_face(img)

        tensor = self.transform(img)
        label  = torch.tensor(self.labels[idx], dtype=torch.long)
        return tensor, label


# ─────────────────────────────────────────────
# DATASET DISCOVERY
# ─────────────────────────────────────────────

def discover_dataset(dataset_root: str = DATASET_ROOT) -> tuple:
    """
    Walk folder structure and collect all image paths + labels.

    Returns:
        all_paths  : list[str]
        all_labels : list[int]
        class_to_idx : dict[str, int]
    """
    logger.info(f"Discovering dataset at: {dataset_root}")
    class_to_idx = {e: i for i, e in enumerate(EMOTIONS)}
    all_paths, all_labels = [], []

    for folder_name, emotion_label in FOLDER_TO_LABEL.items():
        folder_path = os.path.join(dataset_root, folder_name)
        if not os.path.isdir(folder_path):
            logger.warning(f"Missing folder: {folder_path}")
            continue

        idx   = class_to_idx[emotion_label]
        count = 0
        for fpath in Path(folder_path).iterdir():
            ext = fpath.suffix.upper()
            if ext in (".JPG", ".JPEG", ".PNG") or (ext == ".HEIC" and HEIC_SUPPORT):
                all_paths.append(str(fpath))
                all_labels.append(idx)
                count += 1

        logger.info(f"  {emotion_label:12s}: {count} files")

    logger.info(f"  Total        : {len(all_paths)} images")
    return all_paths, all_labels, class_to_idx


# ─────────────────────────────────────────────
# TRAIN / VAL / TEST SPLIT
# ─────────────────────────────────────────────

def split_paths(all_paths: list, all_labels: list,
                val_size: float = 0.15,
                test_size: float = 0.15,
                random_state: int = 42):
    """Stratified 70 / 15 / 15 split of file paths."""
    paths_temp, paths_test, labels_temp, labels_test = train_test_split(
        all_paths, all_labels,
        test_size=test_size,
        stratify=all_labels,
        random_state=random_state
    )
    relative_val = val_size / (1.0 - test_size)
    paths_train, paths_val, labels_train, labels_val = train_test_split(
        paths_temp, labels_temp,
        test_size=relative_val,
        stratify=labels_temp,
        random_state=random_state
    )
    logger.info(
        f"Split -> Train:{len(paths_train)} | Val:{len(paths_val)} | Test:{len(paths_test)}"
    )
    return paths_train, paths_val, paths_test, labels_train, labels_val, labels_test


# ─────────────────────────────────────────────
# WEIGHTED SAMPLER (class balancing)
# ─────────────────────────────────────────────

def make_weighted_sampler(labels: list) -> WeightedRandomSampler:
    """
    Create a WeightedRandomSampler to handle class imbalance.
    Each sample's weight = 1 / (count of its class).
    """
    from collections import Counter
    counts = Counter(labels)
    weights = [1.0 / counts[lbl] for lbl in labels]
    return WeightedRandomSampler(
        weights=weights,
        num_samples=len(weights),
        replacement=True
    )


# ─────────────────────────────────────────────
# DATALOADER FACTORY
# ─────────────────────────────────────────────

def make_dataloaders(batch_size: int = 32,
                     num_workers: int = 0,
                     use_face_crop: bool = True) -> dict:
    """
    Discover dataset, split, build EmotionDataset objects, and return
    a dict of DataLoaders: {"train", "val", "test"}.
    """
    all_paths, all_labels, _ = discover_dataset()

    (paths_train, paths_val, paths_test,
     labels_train, labels_val, labels_test) = split_paths(all_paths, all_labels)

    # Save test split for evaluate_model.py
    import json
    split_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "models", "test_split.json"
    )
    os.makedirs(os.path.dirname(split_path), exist_ok=True)
    with open(split_path, "w") as f:
        json.dump({"paths": paths_test, "labels": labels_test}, f)

    train_ds = EmotionDataset(paths_train, labels_train,
                              use_face_crop=use_face_crop, augment=True)
    val_ds   = EmotionDataset(paths_val,   labels_val,
                              use_face_crop=use_face_crop, augment=False)
    test_ds  = EmotionDataset(paths_test,  labels_test,
                              use_face_crop=use_face_crop, augment=False)

    sampler  = make_weighted_sampler(labels_train)

    return {
        "train": DataLoader(train_ds, batch_size=batch_size,
                            sampler=sampler, num_workers=num_workers,
                            pin_memory=False),
        "val":   DataLoader(val_ds,   batch_size=batch_size,
                            shuffle=False, num_workers=num_workers),
        "test":  DataLoader(test_ds,  batch_size=batch_size,
                            shuffle=False, num_workers=num_workers),
    }


# ─────────────────────────────────────────────
# STANDALONE VERIFICATION
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  DATASET VERIFICATION")
    print("=" * 55)

    all_paths, all_labels, class_to_idx = discover_dataset()

    from collections import Counter
    counts = Counter(all_labels)
    idx_to_emotion = {v: k for k, v in class_to_idx.items()}

    print(f"\nTotal images : {len(all_paths)}")
    print(f"Classes      : {EMOTIONS}")
    print(f"\nClass distribution:")
    for idx in sorted(counts):
        emotion = EMOTIONS[idx]
        count   = counts[idx]
        bar     = "|" * (count // 20)
        print(f"  {emotion:12s}: {count:4d}  {bar}")

    p_tr, p_v, p_te, l_tr, l_v, l_te = split_paths(all_paths, all_labels)
    print(f"\nSplit -> Train:{len(p_tr)} | Val:{len(p_v)} | Test:{len(p_te)}")
    print("\n[OK] Dataset verification complete.")
