@echo off
cd /d %~dp0

echo VibeCoding Project Gallery Starting...
echo.

echo Building frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit
)

echo Build successful!
echo Starting server...
set NODE_ENV=production
start "Browser" "http://localhost:5000"
node backend/server.js

if %ERRORLEVEL% neq 0 (
    echo Server failed to start!
    pause
    exit
)

echo Server stopped.
pause