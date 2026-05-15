# 🧠 Emotion AI — Real-Time Emotion Detection System

A professional AI-powered real-time emotion recognition system built with **Python 3.14 + PyTorch 2.11 + OpenCV**.  
Detects **8 emotions** from a live webcam feed using a **MobileNetV2** deep learning backbone trained on your custom Indian face dataset.

> **Note:** TensorFlow does not yet support Python 3.14. This project uses PyTorch which fully supports Python 3.14+.

---

## 📌 Detected Emotions

| Index | Emotion | Dataset Folder |
|-------|---------|----------------|
| 0 | Angry | `Anger/` |
| 1 | Confused | `Confused/` |
| 2 | Excited | `Excited/` |
| 3 | Fear | `Fear/` |
| 4 | Happiness | `Happy/` |
| 5 | Sadness | `Sadness/` |
| 6 | Surprised | `Surprised/` |
| 7 | Thoughtful | `Thaughtful/` |

---

## 📁 Project Structure

```
EmotionModel/
├── Dataset of Indian face images with various expressions/
│   ├── Anger/          (755 JPG images)
│   ├── Confused/       (592 JPG images)
│   ├── Excited/        (224 JPG images)
│   ├── Fear/           (235 JPG images)
│   ├── Happy/          (231 JPG images)
│   ├── Sadness/        (220 JPG images)
│   ├── Surprised/      (744 JPG images)
│   └── Thaughtful/     (708 JPG images)
│
└── emotion_ai/
    ├── models/               ← Trained weights, test split JSON
    ├── evaluation/           ← All graphs and CSV reports
    ├── logs/                 ← Training, evaluation, live logs
    ├── screenshots/          ← Webcam screenshots (S key)
    ├── recordings/           ← Video sessions (R key)
    ├── train_model.py        ← Train the emotion model
    ├── evaluate_model.py     ← Full evaluation report
    ├── live_emotion_detector.py  ← Real-time webcam detector
    ├── preprocess.py         ← Dataset loading & augmentation
    ├── utils.py              ← Shared constants & helpers
    ├── requirements.txt      ← Python dependencies
    └── README.md             ← This file
```

---

## ⚡ Quick Start

### Step 1 — Navigate to project directory

```powershell
cd "c:\Users\Sujal\Desktop\EmotionModel\emotion_ai"
```

### Step 2 — Create Virtual Environment (Recommended)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
```

### Step 3 — Install Dependencies

```powershell
pip install torch torchvision opencv-python Pillow numpy pandas scikit-learn matplotlib seaborn tqdm
```

> The following packages are already installed on your system:
> `torch 2.11.0`, `torchvision 0.26.0`, `opencv-python 4.13.0`, `numpy 2.4.4`, `pandas 2.3.3`, `scikit-learn 1.8.0`, `matplotlib 3.10.8`, `seaborn 0.13.2`, `tqdm 4.67.3`

---

## ✅ Verify Dataset

```powershell
python preprocess.py
```

Expected output:
```
  DATASET VERIFICATION
  Total images : 3709
  Classes      : ['Angry', 'Confused', 'Excited', 'Fear', 'Happiness', 'Sadness', 'Surprised', 'Thoughtful']
  Split -> Train:2596 | Val:557 | Test:556
  [OK] Dataset verification complete.
```

---

## 🏋️ Training

```powershell
python train_model.py
```

**Two-phase training:**
| Phase | Epochs | Learning Rate | What's trained |
|-------|--------|---------------|----------------|
| Warm-up | 15 | 1e-3 | Classification head only |
| Fine-tune | 25 | 3e-5 | Head + top 5 backbone blocks |

**Outputs saved automatically:**
| File | Location |
|------|----------|
| Final model weights | `models/emotion_model.pth` |
| Best warm-up weights | `models/best_warmup.pth` |
| Best fine-tune weights | `models/best_finetune.pth` |
| Test split (JSON) | `models/test_split.json` |
| Training history | `logs/training_history.json` |
| Accuracy plot | `evaluation/accuracy_plot.png` |
| Loss plot | `evaluation/loss_plot.png` |
| Full training log | `logs/training.log` |

> **Estimated time:** ~60-90 min on CPU, ~15-20 min with GPU

---

## 📊 Evaluation

```powershell
python evaluate_model.py
```

**Example terminal output:**
```
============================================================
  MODEL EVALUATION REPORT
============================================================
  Test Accuracy       : 87.23%
  Precision (weighted): 86.91%
  Recall    (weighted): 87.23%
  F1 Score  (weighted): 86.84%
  AUC Score (macro)   : 0.9745
============================================================

Classification Report:
              precision    recall  f1-score   support
       Angry     0.9012    0.8876    0.8943       113
    Confused     0.8654    0.8821    0.8737        89
     Excited     0.7812    0.7941    0.7876        34
        Fear     0.8123    0.8000    0.8061        35
   Happiness     0.8234    0.8286    0.8260        35
     Sadness     0.8098    0.7879    0.7987        33
   Surprised     0.9134    0.9067    0.9100       111
   Thoughtful    0.8987    0.9007    0.8997       106
```

**Graphs generated in `evaluation/`:**

| Graph | Filename |
|-------|----------|
| Training Accuracy vs Val Accuracy | `accuracy_plot.png` |
| Training Loss vs Val Loss | `loss_plot.png` |
| Confusion Matrix Heatmap | `confusion_matrix.png` |
| ROC Curves (all 8 emotions) | `roc_curve.png` |
| Precision-Recall Curves | `precision_recall_curve.png` |
| Per-class Accuracy Bar Chart | `class_accuracy.png` |
| Emotion Distribution (Test Set) | `emotion_distribution.png` |
| Prediction Confidence Histogram | `confidence_histogram.png` |
| Full Classification Report | `classification_report.csv` |

---

## 🎥 Real-Time Webcam Detector

```powershell
python live_emotion_detector.py
```

**Features:**
- Multi-face detection with individual bounding boxes
- Emotion label + confidence % per face
- 8-bar probability panel for all emotions
- Scrolling confidence history graph
- FPS counter (top-right)
- Low-light CLAHE enhancement
- Emotion history CSV logging

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `Q` | Quit |
| `S` | Save screenshot to `screenshots/` |
| `R` | Start / Stop AVI recording to `recordings/` |
| `E` | Toggle CLAHE low-light enhancement |
| `H` | Toggle help overlay |

---

## 🔧 Troubleshooting

### Webcam not opening
```powershell
python -c "import cv2; cap=cv2.VideoCapture(0); print('Webcam OK' if cap.isOpened() else 'FAILED'); cap.release()"
```
If it fails, try index `1` or `2` by editing `cv2.VideoCapture(0)` in `live_emotion_detector.py`.

### Model not found
Make sure you run `train_model.py` first. The model is saved to `models/emotion_model.pth`.

### Out of memory during training
Reduce `BATCH_SIZE` in `train_model.py` from `32` to `16` or `8`.

### HEIC images not loading
Most images are JPG (3,661 out of 3,709), so HEIC support is optional. Install with:
```powershell
pip install pillow-heif
```

---

## 🏗️ Model Architecture

```
Input (224×224×3)
    ↓
MobileNetV2 (ImageNet pretrained backbone)
    ↓
AdaptiveAvgPool2D → Flatten
    ↓
BatchNorm → Dropout(0.4)
    ↓
Linear(1280→512) → ReLU → BatchNorm → Dropout(0.2)
    ↓
Linear(512→256) → ReLU
    ↓
Linear(256→8) → Softmax
```

**Training details:**
- Loss: `CrossEntropyLoss` with label smoothing (0.1)
- Optimizer: `Adam`
- Scheduler: `ReduceLROnPlateau`
- Class balancing: `WeightedRandomSampler`
- Augmentation: Random flip, ColorJitter, Rotation, Crop, RandomErasing
- Early stopping: patience = 8 epochs

---

## 📈 Dataset Statistics

| Emotion | Folder | Images |
|---------|--------|--------|
| Angry | `Anger/` | 755 |
| Confused | `Confused/` | 592 |
| Excited | `Excited/` | 224 |
| Fear | `Fear/` | 235 |
| Happiness | `Happy/` | 231 |
| Sadness | `Sadness/` | 220 |
| Surprised | `Surprised/` | 744 |
| Thoughtful | `Thaughtful/` | 708 |
| **Total** | | **3,709** |

---

## 🛠️ All Commands Reference

```powershell
# 1. Verify dataset
python preprocess.py

# 2. Train model
python train_model.py

# 3. Evaluate model
python evaluate_model.py

# 4. Run live webcam detector
python live_emotion_detector.py
```

---

*Built with PyTorch 2.11, OpenCV 4.13, Python 3.14 — Production-ready emotion recognition system*
