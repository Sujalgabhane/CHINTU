<div align="center">

# 🤖 Chintu — AI-Powered Emotion-Aware Smart Home & Surveillance Robot

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
<img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />

<br/>
<br/>

> **Chintu** is a final-year engineering project — a futuristic, Jarvis-like AI assistant dashboard that combines real-time emotion recognition, smart home automation, voice interaction, security surveillance, and live system analytics into one sleek web interface.

<br/>

![Chintu Dashboard Preview](./frontend/public/preview.png)

</div>

---

## ✨ Features

| Module | Description |
|---|---|
| 🧠 **Emotion AI** | Real-time facial emotion detection via webcam using PyTorch (EfficientNet/MobileNetV2) |
| 🏠 **Smart Home Panel** | Control lights, fans, AC, locks, and appliances with live status tracking |
| 🔒 **Security Dashboard** | Live security event logs, camera feeds, and threat monitoring |
| 📊 **Analytics Panel** | Emotion history charts, home usage stats, and system performance graphs |
| 🎤 **Voice Assistant** | Wake-word detection + natural language command processing via Web Speech API |
| 🔔 **Notification Feed** | Real-time toast notifications for IoT events and system alerts |
| 📡 **WebSocket Streaming** | Live emotion data stream at 10 fps via FastAPI WebSocket |
| ⚡ **System Stats** | CPU, RAM, GPU, and network monitoring in real time |

---

## 🏗️ Architecture

```
Chintu Web/
├── frontend/               # React + Vite + TailwindCSS Dashboard
│   ├── src/
│   │   ├── components/     # UI Components (EmotionPanel, SmartHome, Security, etc.)
│   │   ├── hooks/          # Custom React hooks (useEmotionStream, useDemoData, useVoiceEngine)
│   │   ├── App.jsx         # Main application shell
│   │   └── index.css       # Global styles & design system
│   └── vite.config.js      # Vite configuration with proxy setup
│
├── backend/                # FastAPI Python backend
│   ├── main.py             # API server (REST + WebSocket)
│   ├── emotion_engine.py   # Real-time emotion detection engine
│   ├── assistant_engine.py # AI assistant brain (NLP + commands)
│   ├── demo_data.py        # Simulated data generators
│   ├── train_model.py      # Model training script
│   ├── utils.py            # Shared utilities
│   └── requirements.txt    # Python dependencies
│
├── emotion_ai model/       # Trained PyTorch models & datasets
├── start_backend.bat       # One-click backend launcher (Windows)
└── start_frontend.bat      # One-click frontend launcher (Windows)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and **npm**
- **Python** 3.10+
- **Webcam** (for real emotion detection)
- **Windows** recommended (bat launchers provided)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/chintu-web.git
cd chintu-web
```

---

### 2️⃣ Setup the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

> The backend will start at **http://localhost:8000**

---

### 3️⃣ Setup the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

> The dashboard will open at **http://localhost:5173**

---

### ⚡ One-Click Launch (Windows)

Simply double-click the batch files in the root directory:

- `start_backend.bat` — Starts the Python FastAPI server
- `start_frontend.bat` — Starts the Vite React dashboard

---

## 🖥️ Dashboard Pages

### 🧠 Emotion Detection (Home)
- Live webcam feed with real-time face detection
- AI-predicted emotion with confidence scores (Happy, Sad, Angry, Surprised, Neutral, etc.)
- Chintu AI response engine that reacts contextually to detected emotions
- System stats sidebar

### 🏠 Smart Home Control
- Toggle lights, fans, AC, door locks, security cameras
- Dimmer sliders for brightness/temperature
- Room-by-room device grouping
- Real-time device state sync

### 🔒 Security Panel
- Timestamped security event logs
- Threat level classification (LOW / MEDIUM / HIGH / CRITICAL)
- Motion detection alerts
- Camera status indicators

### 📊 Analytics
- 7-day emotion trend charts (Recharts)
- Home energy usage breakdown
- CPU/RAM/Network performance graphs

### 🎤 AI Voice Assistant
- Wake-word activation ("Hey Chintu")
- Natural language commands (control lights, check status, ask questions)
- Emotion-aware responses
- Conversation history

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 8 | Build tool & dev server |
| TailwindCSS 3 | Utility-first styling |
| Framer Motion | Animations & page transitions |
| Recharts | Data visualization |
| Lucide React | Icon library |
| Headless UI | Accessible UI primitives |
| Web Speech API | Voice recognition & TTS |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API + WebSocket server |
| Uvicorn | ASGI server |
| PyTorch | Emotion recognition ML model |
| OpenCV | Webcam capture & face detection |
| Pillow | Image preprocessing |
| NumPy | Numerical operations |

---

## 🧠 Emotion AI Model

The emotion detection system uses a fine-tuned **EfficientNet / MobileNetV2** model trained on an Indian facial expression dataset:

- **7 emotion classes**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- **Real-time inference** at ~10 FPS via webcam
- **Temporal smoothing** to prevent UI flickering
- **Face detection** using OpenCV Haar cascades

### Training the Model

```bash
cd backend
python train_model.py
```

---

## 🌐 Deployment

### Frontend (GitHub Pages / Vercel / Netlify)

```bash
cd frontend
npm run build
# dist/ folder is ready for static hosting
```

### Backend (Any Python host — Render, Railway, VPS)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

> ⚠️ **Note:** For cloud deployment, webcam-based emotion detection will fall back to demo/simulated data since cloud servers don't have physical cameras.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `WS` | `/ws/emotion` | Real-time emotion stream (10 fps) |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/assistant/chat` | AI assistant response |
| `POST` | `/api/assistant/command` | Execute automation command |
| `POST` | `/api/smarthome/control` | Control smart home device |
| `GET` | `/api/demo/security` | Simulated security logs |
| `GET` | `/api/demo/iot` | Simulated IoT feed |
| `GET` | `/api/demo/stats` | Simulated system stats |
| `GET` | `/api/demo/emotion-history` | Simulated emotion history |
| `GET` | `/api/demo/notification` | Random notification |

---

## 📸 Screenshots

> The dashboard features a dark-mode glassmorphism design with cyan/purple neon accents, animated transitions, and a holographic grid background.

---

## 🤝 Contributing

This is a final-year engineering project. Contributions, suggestions, and feedback are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Sujal** — Final Year Engineering Student

> Built with ❤️ as a capstone project showcasing AI, IoT, and modern web technologies.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with 🤖 by Sujal

</div>
