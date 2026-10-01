# ============================================================
# FrameFlow SaaS - one-time Windows setup (RUN AS ADMIN)
# Right-click this file -> "Run as administrator" (or "Run with PowerShell")
# It configures everything once, then FrameFlow starts silently at boot.
# ============================================================

# --- Self-elevate if not admin ---
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Demande des droits administrateur (Run as admin)..."
  Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
  exit
}

$ErrorActionPreference = 'Continue'
$root = (Get-Item $PSScriptRoot).FullName
$vbs  = Join-Path $root 'scripts\run-silent.vbs'

Write-Host ""
Write-Host "=== FrameFlow - configuration automatique ==="
Write-Host "Dossier projet : $root"
Write-Host ""

# ------------------------------------------------------------
# a. Scheduled task: silent start at boot (ONSTART + 1 min delay, as SYSTEM),
#    so the app is already running after a reboot even before anyone logs in.
# ------------------------------------------------------------
Write-Host "[1/6] Tache planifiee (demarrage silencieux au boot)..."
schtasks /create /tn "FrameFlowSilentStart" `
  /tr "wscript.exe `"$vbs`"" `
  /sc onstart /delay 0001:00 /ru SYSTEM /rl highest /f | Out-Null
# Les laptops ne lancent pas la tache sur batterie par defaut -> on desactive ca.
try {
  $t = Get-ScheduledTask -TaskName "FrameFlowSilentStart" -ErrorAction Stop
  $t.Settings.DisallowStartIfOnBatteries = $false
  $t.Settings.StopIfGoingOnBatteries = $false
  Set-ScheduledTask -InputObject $t | Out-Null
} catch { }
Write-Host "        -> tache 'FrameFlowSilentStart' creee (ONSTART + 1 min, SYSTEM, niveau max)."

# ------------------------------------------------------------
# b. MySQL as an auto-start Windows service (no more XAMPP clicks)
# ------------------------------------------------------------
Write-Host "[2/6] Service MySQL (demarrage automatique)..."
$svc = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $svc) {
  $mysqld = 'C:\xampp\mysql\bin\mysqld.exe'
  if (Test-Path $mysqld) {
    Write-Host "        -> installation du service MySQL depuis XAMPP..."
    & $mysqld --install MySQL --defaults-file="C:\xampp\mysql\bin\my.ini"
    $svc = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1
  } else {
    Write-Warning "mysqld.exe introuvable a $mysqld - installe XAMPP (MySQL) d'abord."
  }
}
if ($svc) {
  sc.exe config $svc.Name start= auto | Out-Null
  sc.exe start $svc.Name 2>$null | Out-Null
  Write-Host "        -> service '$($svc.Name)' en demarrage auto + demarre."
}

# ------------------------------------------------------------
# c. hosts entry: 127.0.0.1 project-management
# ------------------------------------------------------------
Write-Host "[3/6] Nom d'hote local 'project-management'..."
$hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
if (-not (Select-String -Path $hostsFile -Pattern '^\s*127\.0\.0\.1\s+project-management(\s|$)' -Quiet)) {
  Add-Content -Path $hostsFile -Value "`r`n127.0.0.1`tproject-management"
  Write-Host "        -> entree ajoutee au fichier hosts."
} else {
  Write-Host "        -> deja presente."
}

# ------------------------------------------------------------
# d. Port proxy: port 80 -> 3000 (http://project-management sans :3000)
# ------------------------------------------------------------
Write-Host "[4/6] Redirection port 80 -> 3000..."
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null | Out-Null
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=3000 connectaddress=127.0.0.1 | Out-Null
Write-Host "        -> http://project-management redirige vers le frontend."

# ------------------------------------------------------------
# e. Firewall: allow inbound TCP on 80, 3000, 5000 (idempotent)
# ------------------------------------------------------------
Write-Host "[5/6] Pare-feu Windows (ports 80, 3000, 5000)..."
foreach ($p in 80, 3000, 5000) {
  netsh advfirewall firewall delete rule name="FrameFlow-$p" 2>$null | Out-Null
  netsh advfirewall firewall add rule name="FrameFlow-$p" dir=in action=allow protocol=TCP localport=$p | Out-Null
}
Write-Host "        -> regles 'FrameFlow-80/3000/5000' actives."

# ------------------------------------------------------------
# f. Detect LAN IPv4 + generate ACCES-AUTRES-PC.bat
# ------------------------------------------------------------
Write-Host "[6/6] Fichier d'acces pour les autres PC du Wi-Fi..."
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) {
  Write-Warning "Adresse IP locale introuvable - verifie la connexion Wi-Fi."
} else {
  Write-Host "        -> IP de ce PC sur le reseau : $ip"
  $bat = @"
@echo off
REM ============================================================
REM FrameFlow - connexion depuis UN AUTRE PC (meme Wi-Fi)
REM A executer UNE SEULE FOIS sur l'autre PC, en administrateur :
REM clic-droit sur ce fichier -> "Executer en tant qu'administrateur".
REM Ca ajoute "$ip project-management" au fichier hosts de CE PC,
REM pour pouvoir ouvrir http://project-management comme sur le PC principal.
REM ============================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] Clic-droit sur ce fichier, puis "Executer en tant qu'administrateur".
  pause
  exit /b 1
)

set "SERVER_IP=$ip"
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
"@
  $batPath = Join-Path $root 'ACCES-AUTRES-PC.bat'
  $bat | Out-File -FilePath $batPath -Encoding ascii
  Write-Host "        -> '$batPath' genere."
}

# ------------------------------------------------------------
# g. Final summary
# ------------------------------------------------------------
Write-Host ""
Write-Host "================ TERMINE ================"
Write-Host "Chno tconfigura :"
Write-Host " - L'app katbda bo7dha mli ych3el l'PC (backend + frontend), bla ay fenetre CMD."
Write-Host " - MySQL kaykhdem bo7do ka service (ma b9ach khass t7ell XAMPP)."
Write-Host " - Fte7 : http://project-management  (bla :3000)"
Write-Host " - PC akhor f nafs l'Wi-Fi : copier 'ACCES-AUTRES-PC.bat' 3ando, ykhdmo"
Write-Host "   b 'Run as administrator' marra wa7da, w men ba3d y7ell http://project-management"
Write-Host "   (wla direct http://$ip )."
Write-Host ""
Write-Host "Redemarre l'PC bach tjereb - l'app ghadi tkhdem silencieusement."
Write-Host "========================================="
