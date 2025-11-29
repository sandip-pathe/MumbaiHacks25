@echo off
echo ============================================
echo Starting ReguPulse Vite Frontend
echo ============================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
