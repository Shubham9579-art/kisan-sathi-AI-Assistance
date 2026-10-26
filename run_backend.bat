@echo off
setlocal

echo ===================================================
echo     KisanSathi AI - Backend Startup
echo ===================================================
echo.

cd /d "%~dp0backend"

:: Check if Python is available
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found in your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 or newer is required.
    python --version
    pause
    exit /b 1
)

:: Create virtual environment if not present
if not exist "venv" (
    echo [SETUP] Creating Python virtual environment in backend\venv...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [SETUP] Virtual environment created successfully.
)

set "VENV_PYTHON=%CD%\venv\Scripts\python.exe"
if not exist "%VENV_PYTHON%" (
    echo [ERROR] The backend virtual environment is incomplete.
    echo Delete backend\venv and run this file again to recreate it.
    pause
    exit /b 1
)

:: Install dependencies only when the environment is new or incomplete.
"%VENV_PYTHON%" -c "import fastapi, uvicorn, pydantic, sqlalchemy, multipart, pytest" >nul 2>&1
if errorlevel 1 (
    echo [SETUP] Installing missing backend dependencies...
    "%VENV_PYTHON%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Backend dependency installation failed.
        echo Check your internet connection and backend\requirements.txt, then run this file again.
        pause
        exit /b 1
    )
)

"%VENV_PYTHON%" -c "import fastapi, uvicorn, pydantic, sqlalchemy, multipart, pytest" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend dependencies are still incomplete after installation.
    pause
    exit /b 1
)

:: Start FastAPI with uvicorn
echo.
echo ===================================================
echo  Starting KisanSathi AI FastAPI server on http://127.0.0.1:8000
echo  Swagger API Docs: http://127.0.0.1:8000/docs
echo ===================================================
echo.

"%VENV_PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

if errorlevel 1 (
    echo [ERROR] Backend server stopped with an error. Check the message above.
)

pause
