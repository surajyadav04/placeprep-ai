@echo off
"C:\Project backup\placement drive\backend\.venv\Scripts\python.exe" -m uvicorn main:app --port 8000 > c:\tmp_uvicorn.log 2>&1
echo Done.
