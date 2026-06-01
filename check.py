import pandas as pd
from backend.database import SessionLocal
from backend.models import StudentMaster

print("--- EXCEL COLUMNS ---")
try:
    df = pd.read_excel('backend/Student.xlsx')
    print(df.columns.tolist())
    if not df.empty:
        print("First row email:", df.iloc[0].to_dict())
except Exception as e:
    print("Excel Error:", e)

print("\n--- DATABASE RECORDS ---")
try:
    db = SessionLocal()
    students = db.query(StudentMaster).limit(5).all()
    print(f"Total students in DB: {db.query(StudentMaster).count()}")
    for s in students:
        print(f" - {s.univ_email} | {s.full_name}")
except Exception as e:
    print("DB Error:", e)
