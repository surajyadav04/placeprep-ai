import subprocess
import json

def get_modified_files():
    result = subprocess.run(["git", "diff", "--name-only", "HEAD"], capture_output=True, text=True)
    files = result.stdout.strip().split("\n")
    return [f for f in files if f]

def get_untracked_files():
    result = subprocess.run(["git", "ls-files", "--others", "--exclude-standard"], capture_output=True, text=True)
    files = result.stdout.strip().split("\n")
    return [f for f in files if f]

all_files = get_modified_files() + get_untracked_files()
print(json.dumps(all_files))
