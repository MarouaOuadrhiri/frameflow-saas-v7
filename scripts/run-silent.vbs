' ============================================================
' FrameFlow SaaS - silent launcher
' Runs at Windows boot via the "FrameFlowSilentStart" scheduled task.
' Everything runs with window style 0 (hidden): no console, no popups.
' ============================================================
Option Explicit

Dim fso, shell, root, nodeDir, logFile
Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' Project root = parent folder of scripts\
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

' --- Locate the Node.js folder (node.exe + npm.cmd).
' --- The SYSTEM account at boot may NOT have Node on its PATH
' --- (per-user Node install), so we set PATH explicitly. ---
nodeDir = ""
Dim cands, c
cands = Array( _
  shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs", _
  shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\nodejs", _
  "C:\Program Files\nodejs", _
  "C:\Program Files (x86)\nodejs" _
)
For Each c In cands
  If fso.FileExists(c & "\node.exe") Then nodeDir = c: Exit For
Next

' --- tiny log (helps diagnose boot issues) ---
logFile = root & "\scripts\silent-start.log"
On Error Resume Next
Dim log
Set log = fso.OpenTextFile(logFile, 8, True)
If nodeDir = "" Then
  log.WriteLine Now & " - silent start: node.exe NOT FOUND in Program Files"
Else
  log.WriteLine Now & " - silent start: using nodeDir=" & nodeDir
End If
log.Close
On Error Goto 0

' --- MySQL first (defensive: no-op if the service is already running) ---
shell.Run "cmd /c net start MySQL 2>nul & net start MySQL80 2>nul", 0, True

' --- PATH prefix so node/npm resolve even as SYSTEM ---
Dim pathPrefix
pathPrefix = ""
If nodeDir <> "" Then pathPrefix = "set ""PATH=" & nodeDir & ";%PATH%"" && "

' --- Backend (port 5000) - hidden ---
shell.Run "cmd /c " & pathPrefix & "cd /d """ & root & "\backend"" && npm run dev", 0, False

' --- Frontend (port 3000) - hidden ---
shell.Run "cmd /c " & pathPrefix & "cd /d """ & root & "\frontend"" && npm run dev", 0, False
