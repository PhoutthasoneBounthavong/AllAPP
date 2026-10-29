@echo off
title Cardr Mobile - Client Scanner and Digital Card
echo ========================================================
echo   Starting Cardr Mobile Client (Expo)
echo   Initializing Metro Bundler and Tunnel connection...
echo   Please wait 10-15 seconds for the QR code to appear!
echo ========================================================
set "EXPO_TOKEN="
cd /d "%~dp0mobile-app"
call npm run start -- --tunnel
pause
