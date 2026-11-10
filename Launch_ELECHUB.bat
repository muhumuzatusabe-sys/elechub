@echo off
title ELECHUB Campaign Command Center
echo ===================================================
echo   ELECHUB - Campus Campaign Command Center
echo ===================================================
echo Starting application server on http://localhost:5000 ...

cd /d "%~dp0"

:: Start Flask server in the background if port 5000 is not already running
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue)) { Start-Process 'python' -ArgumentList 'app.py' -WorkingDirectory '%~dp0' -WindowStyle Hidden }"

:: Short wait to allow the web server to be ready
timeout /t 2 /nobreak >nul

:: Launch browser directly to the local dashboard
start http://localhost:5000

echo.
echo Application running at http://localhost:5000
echo Master Admin Password is: @Tusabe001
echo You may close this window.
timeout /t 3 >nul
exit
