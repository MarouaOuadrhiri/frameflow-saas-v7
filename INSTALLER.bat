@echo off
REM ============================================================
REM FrameFlow SaaS - INSTALLATION COMPLETE EN UN CLIC
REM Double-cliquer sur ce fichier : il installe TOUT
REM (Node.js, MySQL, base de donnees, comptes admin,
REM  demarrage silencieux au boot, acces Wi-Fi).
REM ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-tout.ps1"
pause
