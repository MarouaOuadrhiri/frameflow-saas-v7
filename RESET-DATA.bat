@echo off
REM ============================================================
REM FrameFlow SaaS - RESET ALL DATA (wipe test data)
REM Empties every data table via database\reset.sql
REM ============================================================

echo.
echo  ============================================================
echo   ATTENTION : this will DELETE ALL DATA in the frameflow
echo   database (projects, clients, equipment, finances, users...).
echo   The structure is kept, but you will need to re-create
echo   the 2 teammate accounts afterwards.
echo  ============================================================
echo.
set /p CONFIRM=Type oui to confirm, anything else to cancel:
if /i not "%CONFIRM%"=="oui" (
  echo Cancelled. Nothing was deleted.
  pause
  exit /b 0
)

echo.
echo  Resetting database...
"C:\xampp\mysql\bin\mysql.exe" -u root frameflow < database\reset.sql
if errorlevel 1 (
  echo.
  echo  [ERROR] The reset failed. Is MySQL running?
) else (
  echo.
  echo  Done. All data wiped. Re-create the accounts with:
  echo    cd backend and run: npm run create-admin -- "Name" email password
)

pause
