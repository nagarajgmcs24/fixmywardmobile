@echo off
title Fix My Ward - App Launcher
color 0A

echo ============================================
echo     FIX MY WARD - Starting Servers...
echo ============================================
echo.

echo [1/2] Starting Backend Server...
start "Fix My Ward - BACKEND" cmd /k "cd /d "%~dp0backend" && echo Backend starting... && node index.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on Port 8088...
start "Fix My Ward - FRONTEND" cmd /k "cd /d "%~dp0frontend" && echo Frontend starting on port 8088... && npx expo start --port 8088 --web"

echo.
echo ============================================
echo  Both servers are starting!
echo  Frontend: http://localhost:8088
echo  
echo  In the FRONTEND terminal, press 'w'
echo  to open the app in your browser.
echo ============================================
echo.
pause
