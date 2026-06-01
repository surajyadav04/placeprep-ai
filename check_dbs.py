import sqlite3
import os

print("--- Root DB ---")
db1 = "c:/Project backup/placement drive/placeprep.db"
if os.path.exists(db1):
    try:
        conn = sqlite3.connect(db1)
        cur = conn.cursor()
        cur.execute("SELECT email FROM users")
        print("Root users:", cur.fetchall())
        cur.execute("SELECT count(*) FROM students_master")
        print("Root students:", cur.fetchone())
    except Exception as e:
        print(e)
else:
    print("Root DB missing")

print("\n--- Backend DB ---")
db2 = "c:/Project backup/placement drive/backend/placeprep.db"
if os.path.exists(db2):
    try:
        conn = sqlite3.connect(db2)
        cur = conn.cursor()
        cur.execute("SELECT email FROM users")
        print("Backend users:", cur.fetchall())
        cur.execute("SELECT count(*) FROM students_master")
        print("Backend students:", cur.fetchone())
    except Exception as e:
        print(e)
else:
    print("Backend DB missing")
