import os
import sys
import asyncio
import sqlite3
import pandas as pd
from sqlalchemy import text

# Add backend dir to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import engine, Base, SessionLocal
from models import StudentMaster
from import_excel import import_students_from_excel

DB_FILES = ["placeprep.db", "clean.db", "registry.db"]

async def main():
    print("--- 1. Removing Stale Databases ---")
    for db_file in DB_FILES:
        path = os.path.join(os.path.dirname(__file__), db_file)
        if os.path.exists(path):
            try:
                os.remove(path)
                print(f"DELETED: {db_file}")
            except Exception as e:
                print(f"FAILED to delete {db_file}: {e}")
        else:
            print(f"NOT FOUND: {db_file}")

    print("\n--- 2. Recreating Schema ---")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Schema recreated successfully.")

    print("\n--- 3. Verifying students_master Schema ---")
    # We use sync sqlite3 just for pragmas
    db_path = os.path.join(os.path.dirname(__file__), "placeprep.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(students_master);")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()
    
    print("Columns in students_master:")
    for col in columns:
        print(f" - {col}")
        
    expected = ["official_email", "personal_email", "roll_no", "full_name", "batch", "campus", "course", "branch", "division", "cgpa", "passing_year", "program_type", "semester_data"]
    missing = [e for e in expected if e not in columns]
    if missing:
        print(f"CRITICAL ERROR: Missing columns: {missing}")
        return
    else:
        print("VERIFIED: All expected columns are present.")

    print("\n--- 4. Running Excel Import ---")
    excel_path = os.path.join(os.path.dirname(__file__), "Student.xlsx")
    await import_students_from_excel(excel_path)
    
    print("\n--- 5. Generating Report ---")
    async with SessionLocal() as db:
        total = await db.scalar(text("SELECT count(*) FROM students_master"))
        btech = await db.scalar(text("SELECT count(*) FROM students_master WHERE lower(program_type) = 'btech'"))
        btech_inte = await db.scalar(text("SELECT count(*) FROM students_master WHERE lower(program_type) = 'btech_integrated'"))
        
        # Check duplicates
        dupes_query = text("SELECT official_email, COUNT(*) as c FROM students_master GROUP BY official_email HAVING c > 1")
        dupes = await db.execute(dupes_query)
        dupe_count = len(dupes.fetchall())
        
        print(f"Active database path: {db_path}")
        print(f"Total students imported: {total}")
        print(f"Total BTech students: {btech}")
        print(f"Total BTech Integrated students: {btech_inte}")
        print(f"Duplicate email count: {dupe_count}")

if __name__ == "__main__":
    asyncio.run(main())
