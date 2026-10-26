@echo off
setlocal

cd /d "%~dp0"

echo Starting KisanSathi AI...
echo Backend and frontend will open in separate windows.
echo.

start "KisanSathi Backend" "%~dp0run_backend.bat"
start "KisanSathi Frontend" "%~dp0run_frontend.bat"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0wait_for_kisansathi.ps1"
