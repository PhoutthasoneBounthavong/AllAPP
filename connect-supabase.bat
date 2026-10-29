@echo off
title Connect Cardr Mobile to Supabase (EAS)
echo ========================================================
echo   Connecting EAS Project (@georgewassup/cardr) to Supabase
echo.
echo   Your web browser will open to approve Supabase OAuth.
echo   Click "Authorize" in the browser window to complete!
echo ========================================================
echo.
cd /d "%~dp0mobile-app"
call npx eas-cli integrations:supabase:connect --link https://gpqbdbsehgrkkftrqjvd.supabase.co
pause
