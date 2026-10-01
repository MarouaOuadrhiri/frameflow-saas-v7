@echo off
REM ============================================================
REM FrameFlow SaaS - DESINSTALLATION COMPLETE
REM Double-cliquer : supprime TOUT ce que l'installer a configure
REM (app, base 'frameflow', service MySQL, tache planifiee,
REM  hosts, portproxy, pare-feu, .env, node_modules, uploads).
REM XAMPP et Node.js ne sont PAS desinstalles.
REM A copier dans le dossier de l'app (a cote de INSTALLER.bat),
REM puis executer. Apres ca, relance INSTALLER.bat pour un test a zero.
REM ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-tout.ps1"
pause
