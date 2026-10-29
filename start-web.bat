@echo off
title Cardr Studio - Web Admin and Card Designer
echo ========================================================
echo   Starting Cardr Studio Web Admin (Port 5173)
echo   Apple HIG UI: Cards Vault, Card Designer, Scanner
echo ========================================================
cd /d "%~dp0web-admin"
call npm run dev
pause
