@echo off
echo === PlacePrep AI Backend Starter ===
cd /d "c:\Project backup\placement drive"

echo.
echo [1/2] Installing requirements...
"c:\Project backup\placement drive\backend\.venv\Scripts\pip.exe" install -r backend\requirements.txt

echo.
echo [2/2] Starting backend API on http://localhost:8000 ...
"c:\Project backup\placement drive\backend\.venv\Scripts\uvicorn.exe" backend.main:app --reload --port 8000

pause
