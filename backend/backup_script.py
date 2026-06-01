import os
import shutil

backend_dir = r"C:\Project backup\placement drive\backend"
backup_dir = os.path.join(backend_dir, "backend_backup")

os.makedirs(backup_dir, exist_ok=True)

files_to_backup = [
    "auth.py", "models.py", "database.py", "import_students.py", 
    "update_oauth_db.py", "check_email.py", "clear_users.py", 
    "debug.py", "test_api.py", "test_opportunities.py", "test_req.py", 
    "delete_obsolete.py", "dump.py", "placeprep.db", "registry.db", "clean.db"
]

for file in files_to_backup:
    src = os.path.join(backend_dir, file)
    dst = os.path.join(backup_dir, f"old_{file}")
    if os.path.exists(src):
        try:
            shutil.move(src, dst)
            print(f"Backed up: {file} -> {dst}")
        except Exception as e:
            print(f"Failed to move {file}: {e}")
    else:
        print(f"File not found, skipping: {file}")

print("Backup complete!")
