@echo off
echo ============================================
echo  CHINTU AI DASHBOARD - Backend Startup
echo ============================================
echo.
cd /d "%~dp0backend"
echo Starting FastAPI backend on http://localhost:8000
echo WebSocket emotion stream: ws://localhost:8000/ws/emotion
echo.
echo Make sure you have installed backend requirements:
echo   pip install -r requirements.txt
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
