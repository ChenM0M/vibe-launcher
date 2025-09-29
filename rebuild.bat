@echo off
echo ================================
echo Force Rebuild and Start
echo ================================
echo.

cd /d %~dp0

echo Rebuilding frontend...
call npm run build

echo Starting application...
set NODE_ENV=production
echo.
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 >nul
start "Browser" "http://localhost:5000"
node backend/server.js