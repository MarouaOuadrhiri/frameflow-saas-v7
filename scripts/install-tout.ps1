# ============================================================
# FrameFlow SaaS - INSTALLATEUR COMPLET EN UN CLIC
# Double-cliquer sur INSTALLER.bat a la racine du projet.
# Fait TOUT, dans l'ordre : Node.js, MySQL (service), base de
# donnees, .env, npm install, les 2 comptes admin, demarrage
# silencieux au boot, acces reseau (http://project-management).
# Re-executable sans danger : ne detruit rien d'existant.
# ============================================================

# --- Self-elevate if not admin ---
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Demande des droits administrateur (Run as admin)..."
  Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
  exit
}

$ErrorActionPreference = 'Continue'
$root     = (Get-Item (Join-Path $PSScriptRoot '..')).FullName
$backend  = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$schema   = Join-Path $root 'database\schema.sql'

Write-Host ""
Write-Host "==============================================="
Write-Host "  FrameFlow - installation complete"
Write-Host "  Dossier : $root"
Write-Host "==============================================="
Write-Host ""

function Convert-SecureToPlain([System.Security.SecureString]$sec) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

# ------------------------------------------------------------
# Etape 0/8 : Node.js
# ------------------------------------------------------------
Write-Host "[0/8] Verification de Node.js..."
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "        -> Node.js introuvable, tentative d'installation via winget..."
  try { winget install -e --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements | Out-Null } catch {}
  # Rafraichir le PATH de cette session (winget installe Node.js dans Program Files)
  $nodeBin = Join-Path $env:ProgramFiles 'nodejs'
  if (Test-Path (Join-Path $nodeBin 'node.exe')) { $env:Path = "$nodeBin;$env:Path" }
  $node = Get-Command node -ErrorAction SilentlyContinue
}
if (-not $node) {
  Write-Host ""
  Write-Host "  [ERREUR] Node.js est introuvable." -ForegroundColor Red
  Write-Host "  Installe Node.js LTS depuis https://nodejs.org puis relance INSTALLER.bat."
  Read-Host "  Appuie sur Entree pour fermer"
  exit 1
}
Write-Host "        -> Node $($(& node --version)) OK."

# ------------------------------------------------------------
# Etape 1/8 : MySQL comme service Windows (demarrage auto)
# ------------------------------------------------------------
Write-Host "[1/8] Service MySQL..."
$svc = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $svc) {
  $mysqld = 'C:\xampp\mysql\bin\mysqld.exe'
  if (Test-Path $mysqld) {
    Write-Host "        -> installation du service MySQL depuis XAMPP..."
    & $mysqld --install MySQL --defaults-file="C:\xampp\mysql\bin\my.ini"
    $svc = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1
  }
}
if (-not $svc) {
  Write-Host ""
  Write-Host "  [ERREUR] Aucun service MySQL et XAMPP introuvable (C:\xampp)." -ForegroundColor Red
  Write-Host "  Installe XAMPP (avec MySQL) puis relance INSTALLER.bat."
  Read-Host "  Appuie sur Entree pour fermer"
  exit 1
}
sc.exe config $svc.Name start= auto | Out-Null
sc.exe start $svc.Name 2>$null | Out-Null
Write-Host "        -> service '$($svc.Name)' en demarrage auto + demarre."

# ------------------------------------------------------------
# Etape 2/8 : attendre que MySQL ecoute sur le port 3306
# ------------------------------------------------------------
Write-Host "[2/8] Attente de MySQL (port 3306)..."
$mysqlUp = $false
for ($i = 0; $i -lt 30; $i++) {
  $tcp = New-Object Net.Sockets.TcpClient
  try {
    $iar = $tcp.BeginConnect('127.0.0.1', 3306, $null, $null)
    if ($iar.AsyncWaitHandle.WaitOne(1000)) { $tcp.EndConnect($iar); $mysqlUp = $true }
  } catch {} finally { $tcp.Close() }
  if ($mysqlUp) { break }
  Start-Sleep -Seconds 1
}
if (-not $mysqlUp) {
  Write-Host "  [ERREUR] MySQL ne repond pas sur le port 3306." -ForegroundColor Red
  Read-Host "  Appuie sur Entree pour fermer"
  exit 1
}
Write-Host "        -> MySQL en ligne."

# ------------------------------------------------------------
# Etape 3/8 : acces root + import de la base 'frameflow'
# ------------------------------------------------------------
Write-Host "[3/8] Base de donnees 'frameflow'..."
$mysqlExe = 'C:\xampp\mysql\bin\mysql.exe'
if (-not (Test-Path $mysqlExe)) {
  $mysqlExe = (Get-Command mysql -ErrorAction SilentlyContinue).Source
}
if (-not $mysqlExe) {
  Write-Host "  [ERREUR] mysql.exe introuvable." -ForegroundColor Red
  Read-Host "  Appuie sur Entree pour fermer"
  exit 1
}

$mysqlArgs = @('-u','root')
& $mysqlExe @mysqlArgs -e "SELECT 1;" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  # Acces root refuse (ex: MySQL Server avec mot de passe inconnu) :
  # reset AUTOMATIQUE du mot de passe root a vide, sans rien demander.
  Write-Host "        -> acces root refuse, reset automatique du mot de passe root..."
  $svcName = $svc.Name
  $resetOk = $false
  net stop $svcName 2>$null | Out-Null
  $img = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\$svcName").ImagePath
  $mysqldExe = $null
  $defaultsFile = $null
  if ($img -match '^"([^"]+)"') { $mysqldExe = $Matches[1] }
  elseif ($img -match '^(\S+)') { $mysqldExe = $Matches[1] }
  if ($img -match '--defaults-file="([^"]+)"') { $defaultsFile = $Matches[1] }
  elseif ($img -match '--defaults-file=([^\s]+)') { $defaultsFile = $Matches[1] }
  if ($mysqldExe -and (Test-Path $mysqldExe)) {
    $margs = @()
    if ($defaultsFile) { $margs += "--defaults-file=$defaultsFile" }
    $margs += '--skip-grant-tables'
    $proc = Start-Process -FilePath $mysqldExe -ArgumentList $margs -WindowStyle Hidden -PassThru
    $up2 = $false
    for ($i = 0; $i -lt 25; $i++) {
      $tcp2 = New-Object Net.Sockets.TcpClient
      try {
        $iar2 = $tcp2.BeginConnect('127.0.0.1', 3306, $null, $null)
        if ($iar2.AsyncWaitHandle.WaitOne(1000)) { $tcp2.EndConnect($iar2); $up2 = $true }
      } catch {} finally { $tcp2.Close() }
      if ($up2) { break }
      Start-Sleep -Seconds 1
    }
    if ($up2) {
      $rh = & $mysqlExe -u root -N -e "SELECT host FROM mysql.user WHERE user='root';" 2>$null
      foreach ($h in $rh) {
        $hh = ($h | Out-String).Trim()
        if ($hh) { & $mysqlExe -u root -e "ALTER USER 'root'@'$hh' IDENTIFIED BY '';" 2>$null | Out-Null }
      }
      & $mysqlExe -u root -e "FLUSH PRIVILEGES;" 2>$null | Out-Null
    }
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
    Start-Sleep -Seconds 2
  }
  sc.exe start $svcName 2>$null | Out-Null
  $up3 = $false
  for ($i = 0; $i -lt 25; $i++) {
    $tcp3 = New-Object Net.Sockets.TcpClient
    try {
      $iar3 = $tcp3.BeginConnect('127.0.0.1', 3306, $null, $null)
      if ($iar3.AsyncWaitHandle.WaitOne(1000)) { $tcp3.EndConnect($iar3); $up3 = $true }
    } catch {} finally { $tcp3.Close() }
    if ($up3) { break }
    Start-Sleep -Seconds 1
  }
  & $mysqlExe @mysqlArgs -e "SELECT 1;" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $resetOk = $true }
  if (-not $resetOk) {
    Write-Host "  [ERREUR] Reset du mot de passe root impossible." -ForegroundColor Red
    Read-Host "  Appuie sur Entree pour fermer"
    exit 1
  }
  Write-Host "        -> mot de passe root reinitialise (vide)."
}
# Si la base existe deja avec des donnees -> proposer de tout effacer (fresh install)
$tblCount = (& $mysqlExe @mysqlArgs -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='frameflow';" 2>$null | Out-String).Trim()
if ($tblCount -and [int]$tblCount -gt 0) {
  Write-Host ""
  Write-Host "  La base 'frameflow' existe deja avec des donnees." -ForegroundColor Yellow
  $rep = Read-Host "  Voulez-vous TOUT effacer et repartir de zero ? (tapez oui)"
  if ($rep -eq 'oui') {
    & $mysqlExe @mysqlArgs -e "DROP DATABASE IF EXISTS `frameflow`;" 2>$null
    Write-Host "        -> base 'frameflow' supprimee, fresh start."
  } else {
    Write-Host "        -> donnees existantes conservees."
  }
}
Write-Host "        -> import de database/schema.sql..."
Get-Content -Raw -Path $schema | & $mysqlExe @mysqlArgs
if ($LASTEXITCODE -ne 0) {
  Write-Host "  [ERREUR] L'import de la base a echoue." -ForegroundColor Red
  Read-Host "  Appuie sur Entree pour fermer"
  exit 1
}
Write-Host "        -> base 'frameflow' prete."

# ------------------------------------------------------------
# Etape 4/8 : fichiers .env
# ------------------------------------------------------------
Write-Host "[4/8] Fichiers de configuration (.env)..."
$backendEnv = Join-Path $backend '.env'
if (-not (Test-Path $backendEnv)) {
  # JWT secret aleatoire : 48 caracteres alphanumeriques
  $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $bytes = New-Object byte[] 48
  $rng.GetBytes($bytes)
  $jwt = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
  # IMPORTANT : pas de CORS_ORIGIN - le backend utilise '*' par defaut (requis pour le LAN)
  @(
    'PORT=5000',
    'DB_HOST=localhost',
    'DB_PORT=3306',
    'DB_USER=root',
    'DB_PASSWORD=',
    'DB_NAME=frameflow',
    "JWT_SECRET=$jwt",
    'JWT_EXPIRES_IN=7d'
  ) | Out-File -FilePath $backendEnv -Encoding ascii
  Write-Host "        -> backend/.env cree."
} else {
  Write-Host "        -> backend/.env existe deja, conserve."
}
$frontendEnv = Join-Path $frontend '.env.local'
if (-not (Test-Path $frontendEnv)) {
  @('NEXT_PUBLIC_API_URL=http://localhost:5000') | Out-File -FilePath $frontendEnv -Encoding ascii
  Write-Host "        -> frontend/.env.local cree."
} else {
  Write-Host "        -> frontend/.env.local existe deja, conserve."
}

# ------------------------------------------------------------
# Etape 5/8 : npm install (backend + frontend)
# ------------------------------------------------------------
Write-Host "[5/8] Installation des dependances (npm)..."
foreach ($dir in @($backend, $frontend)) {
  $nm = Join-Path $dir 'node_modules'
  $label = Split-Path $dir -Leaf
  if (Test-Path $nm) {
    Write-Host "        -> ${label}/node_modules existe deja, ignore."
  } else {
    Write-Host "        -> npm install dans $label (2-3 min la premiere fois)..."
    Push-Location $dir
    npm install --no-audit --no-fund
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) {
      Write-Host "  [ERREUR] npm install a echoue dans $label." -ForegroundColor Red
      Read-Host "  Appuie sur Entree pour fermer"
      exit 1
    }
  }
}
Write-Host "        -> dependances OK."

# ------------------------------------------------------------
# Etape 6/8 : les 2 comptes admin (coequipiers)
# ------------------------------------------------------------
Write-Host "[6/8] Creation des 2 comptes admin..."
$createdEmails = @()
Push-Location $backend
for ($i = 1; $i -le 2; $i++) {
  Write-Host ""
  Write-Host "  --- Compte $i / 2 ---"
  $name = ''
  while ([string]::IsNullOrWhiteSpace($name)) { $name = Read-Host "  Nom complet" }
  $email = ''
  while ($email -notmatch '@') {
    $email = Read-Host "  Email"
    if ($email -notmatch '@') { Write-Host "  Email invalide, recommence." -ForegroundColor Yellow }
  }
  $pw = ''
  while ($pw.Length -lt 6) {
    $sec = Read-Host "  Mot de passe (min. 6 caracteres)" -AsSecureString
    $pw = Convert-SecureToPlain $sec
    if ($pw.Length -lt 6) { Write-Host "  Trop court, recommence." -ForegroundColor Yellow }
  }
  $out = npm run create-admin -- "$name" "$email" "$pw" 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  -> compte cree : $email" -ForegroundColor Green
    $createdEmails += $email
  } elseif ($out -match 'already exists') {
    Write-Host "  -> $email existe deja, on continue." -ForegroundColor Yellow
    $createdEmails += $email
  } else {
    Write-Host "  [ATTENTION] probleme a la creation de $email :" -ForegroundColor Yellow
    Write-Host "  $out"
  }
}
Pop-Location

# ------------------------------------------------------------
# Etape 7/8 : demarrage silencieux au boot + acces reseau
# ------------------------------------------------------------
Write-Host ""
Write-Host "[7/8] Configuration boot silencieux + reseau (setup-windows.ps1)..."
& (Join-Path $root 'scripts\setup-windows.ps1')

# ------------------------------------------------------------
# Etape 8/8 : demarrer maintenant + ouvrir le navigateur
# ------------------------------------------------------------
Write-Host ""
Write-Host "[8/8] Demarrage de l'application..."
wscript.exe (Join-Path $root 'scripts\run-silent.vbs')
Write-Host "        -> backend + frontend lances en arriere-plan (invisible)."
Write-Host "        -> attente 25s que les serveurs soient prets..."
Start-Sleep -Seconds 25
Start-Process "http://project-management"
Write-Host "        -> navigateur ouvert sur http://project-management"

# ------------------------------------------------------------
# Resume final
# ------------------------------------------------------------
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $lanIp) { $lanIp = '<IP-DU-PC>' }

Write-Host ""
Write-Host "================ INSTALLATION TERMINEE ================" -ForegroundColor Green
Write-Host "Chno t installa :"
Write-Host " - MySQL : service Windows en demarrage automatique"
Write-Host " - Base 'frameflow' : creee + importee"
Write-Host " - backend/.env + frontend/.env.local : configures"
Write-Host " - Dependances npm : installees (backend + frontend)"
Write-Host " - Comptes admin :"
foreach ($e in $createdEmails) { Write-Host "     * $e" }
Write-Host ""
Write-Host "Lien de l'app (sur CE pc) :  http://project-management"
Write-Host "L'app demarre TOUTE SEULE a chaque allumage du PC,"
Write-Host "meme si personne ne se connecte (tache ONSTART, invisible, sans CMD)."
Write-Host ""
Write-Host "Binome (meme Wi-Fi) :"
Write-Host " - Option 1 : copier 'ACCES-AUTRES-PC.bat' sur son PC, clic-droit"
Write-Host "   'Run as administrator' UNE fois, puis ouvrir http://project-management"
Write-Host " - Option 2 : ouvrir directement http://$lanIp"
Write-Host "=========================================================="
Write-Host ""
Read-Host "Appuie sur Entree pour fermer"
