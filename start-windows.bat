@echo off
REM ============================================================
REM  FrameFlow SaaS - tch3il backend + frontend b clicka wa7da
REM  Double-click 3la had fichier (wla f PowerShell: .\start-windows.bat)
REM  Backend  -> http://localhost:5000
REM  Frontend -> http://localhost:3000 (kat7el bo7dha)
REM
REM  Bach ykhdmo brashom mli ych3el l'PC:
REM  Win+R -> shell:startup -> 7et shortcut dyal had fichier tema
REM ============================================================

cd /d "%~dp0"

echo Starting FrameFlow backend (port 5000)...
start "FrameFlow Backend" /min cmd /c "cd backend && npm run start"

echo Starting FrameFlow frontend (port 3000)...
start "FrameFlow Frontend" /min cmd /c "cd frontend && npm run start"


echo Waiting for servers to be ready...
timeout /t 25 /nobreak >nul

echo Opening FrameFlow in browser...
start http://localhost:3000

echo Done. Mat9elle9ch had les fenetres (Backend/Frontend) - huma li mkhdmin l'app.
pause
