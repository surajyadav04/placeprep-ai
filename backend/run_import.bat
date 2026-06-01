@echo off
"C:\Project backup\placement drive\backend\.venv\Scripts\python.exe" import_students.py Student.xlsx > import_log.txt 2>&1
echo Done >> import_log.txt
