import sqlite3

db = sqlite3.connect("placeprep.db")
c = db.cursor()
c.execute("SELECT count(*) FROM students_master")
print(f"Backend DB students_master count: {c.fetchone()[0]}")

c.execute("SELECT count(*) FROM users")
print(f"Backend DB users count: {c.fetchone()[0]}")
