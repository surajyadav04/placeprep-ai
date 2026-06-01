import os

files_to_delete = [
    "placeprep.db",
    "registry.db",
    "import_students.py",
    "run_import.bat",
    "test_req.py",
    "check_email.py",
    "debug.py",
    "start_test.bat",
    "tmp_uvicorn.log",
    "verify.ps1"
]

base_dir = os.path.dirname(os.path.abspath(__file__))

for file in files_to_delete:
    path = os.path.join(base_dir, file)
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted {file}")
    except Exception as e:
        print(f"Could not delete {file}: {e}")
