@echo off
echo ========================================
echo AI Chat Judgment System Test Suite
echo ========================================
echo.

echo Checking if Python is available...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

echo Checking if requests module is available...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo Installing requests module...
    pip install requests
    if errorlevel 1 (
        echo ERROR: Failed to install requests module
        pause
        exit /b 1
    )
)

echo.
echo Starting test suite...
echo ========================================
python test_judgment_system.py

echo.
echo ========================================
echo Test suite completed!
echo ========================================
echo.
echo Press any key to exit...
pause >nul 