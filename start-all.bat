@echo off
echo ========================================================
echo   Launching Cardr Platform Services...
echo ========================================================
start "Cardr Backend API" cmd /k "%~dp0start-backend.bat"
start "Cardr Studio Web Admin" cmd /k "%~dp0start-web.bat"
echo.
echo Both services are starting in their own windows!
echo - Backend API: http://localhost:8000/docs
echo - Web Admin:   http://localhost:5173
echo.
echo To start the mobile client, run: start-mobile.bat
pause
