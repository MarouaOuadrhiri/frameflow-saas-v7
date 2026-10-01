# ============================================================
# FrameFlow SaaS - DESINSTALLATION COMPLETE
# Supprime TOUT ce que l'installer a configure :
#   - process Node (backend + frontend)
#   - tache planifiee FrameFlowSilentStart
#   - base de donnees 'frameflow'
#   - service Windows MySQL (cree par l'installer)
#   - redirection portproxy 80 -> 3000
#   - regles pare-feu FrameFlow-80/3000/5000
#   - entree hosts 'project-management'
#   - fichiers generes (.env, .env.local, ACCES-AUTRES-PC.bat)
#   - node_modules + uploads (pour retester a zero)
# XAMPP et Node.js NE sont PAS desinstalles.
# ============================================================

# --- Self-elevate if not admin ---
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Demande des droits administrateur (Run as admin)..."
  Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
  exit
}

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=== FrameFlow - DESINSTALLATION COMPLETE ===" -ForegroundColor Red
Write-Host "Cela va supprimer : l'app, la base 'frameflow', le service MySQL,"
Write-Host "la tache planifiee, hosts/portproxy/pare-feu, .env, node_modules, uploads."
Write-Host "XAMPP et Node.js sont conserves."
Write-Host ""
$rep = Read-Host "Tapez oui pour TOUT desinstaller"
if ($rep -ne 'oui') { Write-Host "Annule."; exit }

Write-Host "[1/10] Arret de l'app (processus Node)..."
taskkill /F /IM node.exe 2>$null | Out-Null
Write-Host "        -> processus Node arretes."

Write-Host "[2/10] Suppression de la tache planifiee..."
schtasks /Delete /TN "FrameFlowSilentStart" /F 2>$null | Out-Null
Write-Host "        -> tache 'FrameFlowSilentStart' supprimee (si elle existait)."

Write-Host "[3/10] Suppression de la base 'frameflow'..."
$mysqlExe = 'C:\xampp\mysql\bin\mysql.exe'
if (Test-Path $mysqlExe) {
  & $mysqlExe -u root -e "DROP DATABASE IF EXISTS `frameflow`;" 2>$null
  Write-Host "        -> base 'frameflow' supprimee."
} else {
  Write-Warning "mysql.exe introuvable - base non supprimee."
}

Write-Host "[4/10] Arret + suppression du service MySQL..."
$svc = Get-Service -Name 'MySQL' -ErrorAction SilentlyContinue
if (-not $svc) { $svc = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1 }
if ($svc) {
  net stop $svc.Name 2>$null | Out-Null
  $mysqld = 'C:\xampp\mysql\bin\mysqld.exe'
  if (Test-Path $mysqld) {
    & $mysqld --remove $svc.Name 2>$null | Out-Null
  } else {
    sc.exe delete $svc.Name 2>$null | Out-Null
  }
  Write-Host "        -> service MySQL supprime."
} else {
  Write-Host "        -> aucun service MySQL (rien a faire)."
}

Write-Host "[5/10] Suppression de la redirection portproxy (80 -> 3000)..."
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 2>$null | Out-Null
Write-Host "        -> redirection supprimee."

Write-Host "[6/10] Suppression des regles pare-feu..."
foreach ($p in 80, 3000, 5000) {
  netsh advfirewall firewall delete rule name="FrameFlow-$p" 2>$null | Out-Null
}
Write-Host "        -> regles 'FrameFlow-80/3000/5000' supprimees."

Write-Host "[7/10] Nettoyage du fichier hosts..."
$hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$kept = Get-Content -Path $hostsFile | Where-Object { $_ -notmatch 'project-management' }
Set-Content -Path $hostsFile -Value $kept -Encoding ASCII
Write-Host "        -> entree 'project-management' supprimee du hosts."

Write-Host "[8/10] Suppression des fichiers generes..."
Remove-Item -Path (Join-Path $root 'backend\.env') -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $root 'frontend\.env.local') -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $root 'ACCES-AUTRES-PC.bat') -Force -ErrorAction SilentlyContinue
Write-Host "        -> .env / .env.local / ACCES-AUTRES-PC.bat supprimes."

Write-Host "[9/10] Suppression des node_modules..."
Remove-Item -Recurse -Force -Path (Join-Path $root 'backend\node_modules') -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force -Path (Join-Path $root 'frontend\node_modules') -ErrorAction SilentlyContinue
Write-Host "        -> node_modules supprimes."

Write-Host "[10/10] Nettoyage des uploads..."
$up = Join-Path $root 'backend\uploads'
if (Test-Path $up) {
  Get-ChildItem -Path $up -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "        -> uploads nettoyes."

Write-Host ""
Write-Host "=== DESINSTALLATION TERMINEE ===" -ForegroundColor Green
Write-Host "Tu peux maintenant relancer INSTALLER.bat pour un test a zero."
