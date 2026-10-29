@echo off
title Cardr Backend - FastAPI and Free OCR Engine
echo ========================================================
echo   Starting Cardr Business Contact Backend API (Port 8000)
echo   OCR Engine: Tesseract 5.5 + NLP Entity Classifier
echo ========================================================
cd /d "%~dp0backend"
call .\venv\Scripts\activate.bat
call uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
