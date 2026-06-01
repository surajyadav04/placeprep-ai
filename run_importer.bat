@echo off
cd /d "c:\Project backup\placement drive"
"backend\.venv\Scripts\python.exe" backend\import_students.py backend\Student.xlsx
