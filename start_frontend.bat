@echo off
echo ============================================
echo  CHINTU AI DASHBOARD - Frontend Startup
echo ============================================
echo.
cd /d "%~dp0frontend"
echo Starting React frontend on http://localhost:5173
echo.
npm run dev
pause
