import subprocess
import os

def run_cmd(cmd):
    print(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
    except subprocess.CalledProcessError as e:
        print("FAILED with exit code:", e.returncode)
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)

run_cmd("git add .")
run_cmd('git commit -m "feat: Simplify mentor dashboard and improve security"')
run_cmd("git push")
