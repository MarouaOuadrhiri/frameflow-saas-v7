@echo off
REM ============================================================
REM FrameFlow - connexion depuis UN AUTRE PC (meme Wi-Fi)
REM A executer UNE SEULE FOIS sur l'autre PC, en administrateur :
REM clic-droit sur ce fichier -> "Executer en tant qu'administrateur".
REM Ca ajoute "192.168.3.100 project-management" au fichier hosts de CE PC,
REM pour pouvoir ouvrir http://project-management comme sur le PC principal.
REM ============================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] Clic-droit sur ce fichier, puis "Executer en tant qu'administrateur".
  pause
  exit /b 1
)

set "SERVER_IP=192.168.3.100"
set "HOSTS=%SystemRoot%\System32\drivers\etc\hosts"

findstr /r /c:"^ *%SERVER_IP% *project-management" "%HOSTS%" >nul
if %errorlevel% neq 0 (
  echo %SERVER_IP%  project-management>> "%HOSTS%"
  echo OK : entree ajoutee.
) else (
  echo Deja present.
)

echo.
echo Ouvre maintenant : http://project-management
echo (ou directement : http://%SERVER_IP% )
pause
