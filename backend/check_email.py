import sqlite3

db_path = "c:/Project backup/placement drive/backend/placeprep.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get total count
cur.execute("SELECT count(*) FROM students_master")
count = cur.fetchone()[0]
print(f"Total students in DB: {count}")

# Get 10 random emails
cur.execute("SELECT univ_email, full_name FROM students_master LIMIT 10")
emails = cur.fetchall()

with open("db_emails.txt", "w", encoding="utf-8") as f:
    f.write(f"Total students in DB: {count}\n")
    f.write("\nSample emails in database:\n")
    for row in emails:
        f.write(f" - {row[0]} ({row[1]})\n")
        
print("Wrote to db_emails.txt")
