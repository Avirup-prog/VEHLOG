@echo off
title VEHLOG Platform Launcher
echo ==============================================================
echo        VEHLOG - AI Fleet & Logistics Platform
echo ==============================================================
echo.

echo Checking MongoDB status on port 27017...
netstat -ano | findstr :27017 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo MongoDB is already active on port 27017.
) else (
    echo Starting MongoDB database...
    net start MongoDB >nul 2>&1
    netstat -ano | findstr :27017 >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        start "VEHLOG - MongoDB Daemon (:27017)" cmd /c ""C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "D:\Aryan Project\data\db" --bind_ip 127.0.0.1 --port 27017"
    )
    echo MongoDB started successfully.
)
echo.

echo [1/3] Launching Node.js Backend API on http://localhost:5000 ...
start "VEHLOG - Backend API (:5000)" cmd /k "cd /d D:\Aryan Project\backend && node server.js"

echo [2/3] Launching FastAPI AI Engine on http://localhost:8001 ...
start "VEHLOG - AI Engine (:8001)" cmd /k "cd /d D:\Aryan Project\ai_engine && .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8001"

echo [3/3] Launching React Vite Frontend on http://localhost:5174 ...
start "VEHLOG - Frontend UI (:5174)" cmd /k "cd /d D:\Aryan Project\frontend && npm run dev"

echo.
echo ==============================================================
echo All services are running.
echo Open your browser at: http://localhost:5174
echo ==============================================================
echo.
pause
