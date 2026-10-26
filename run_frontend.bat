@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     KisanSathi AI - Frontend Startup
echo ===================================================
echo.

cd /d "%~dp0"

:: Prefer the bundled Node.js runtime when available.
if exist "%~dp0.tools\node-v20.18.0-win-x64\node.exe" if exist "%~dp0.tools\node-v20.18.0-win-x64\npm.cmd" goto :use_portable_node

where node >nul 2>&1
if errorlevel 1 goto :node_missing
where npm.cmd >nul 2>&1
if errorlevel 1 goto :npm_missing
set "NPM_CMD=npm.cmd"
goto :node_ready

:use_portable_node
echo [INFO] Using the workspace Node.js runtime...
set "PATH=%~dp0.tools\node-v20.18.0-win-x64;%PATH%"
set "NPM_CMD=%~dp0.tools\node-v20.18.0-win-x64\npm.cmd"

:node_ready

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)" >nul 2>&1
if errorlevel 1 goto :node_version_old

cd /d "%~dp0frontend"

:: Install from the lockfile when dependencies are missing or incomplete.
if not exist "node_modules\.bin\vite.cmd" (
    echo [SETUP] Installing frontend dependencies from package-lock.json...
    call "%NPM_CMD%" ci
    if errorlevel 1 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

echo.
echo ===================================================
echo  Starting KisanSathi AI Vite Dev Server...
echo  Local UI will be at: http://localhost:5173
echo ===================================================
echo.

call "%NPM_CMD%" run dev

pause
exit /b

:node_missing
echo [ERROR] Node.js was not found in your PATH.
echo Please install Node.js version 18 or newer from https://nodejs.org/
pause
exit /b 1

:npm_missing
echo [ERROR] npm was not found in your PATH.
echo Install Node.js version 18 or newer, then run this file again.
pause
exit /b 1

:node_version_old
echo [ERROR] Node.js version 18 or newer is required.
node --version
pause
exit /b 1
