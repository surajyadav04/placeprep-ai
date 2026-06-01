import sys
import os
import asyncio
import pandas as pd
from sqlalchemy import select
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend.models import StudentMaster, Base

def clean_email(email_str):
    """Normalize and clean email string."""
    if pd.isna(email_str) or not str(email_str).strip():
        return None
    email = str(email_str).strip().lower()
    # Basic email validation
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        return None
    return email

def get_val(row, possible_names):
    """Safely get a value from the row using possible column names."""
    for name in possible_names:
        if name in row:
            val = row[name]
            # Since dtype=str and fillna(""), missing values are empty strings
            if val == "":
                return None
            return str(val).strip()
    return None

async def import_students_from_excel(file_path: str):
    print(f"Reading {file_path}...")
    
    # Required rule: df = pd.read_excel(file_path, sheet_name=0, engine="openpyxl", dtype=str)
    try:
        df = pd.read_excel(
            file_path,
            sheet_name=0,
            engine="openpyxl",
            dtype=str
        )
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    # Required rule: df = df.fillna("")
    df = df.fillna("")
    
    total_rows = len(df)
    print(f"TOTAL ROWS: {total_rows}")

    # Required rule: df.columns = [str(col).strip() for col in df.columns]
    df.columns = [str(col).strip() for col in df.columns]
    actual_columns = df.columns.tolist()
    print(f"Found columns in Excel: {actual_columns}")
    
    # lowercase columns for internal matching, but we'll keep original row data as well
    # We will build a mapping of lowercase to original, or just use lowercase for the get_val matching
    # But since row is a Series with original keys, let's create a lowercase-mapped Series for extraction
    
    # Create tables
    async with engine.begin() as conn:
        print("Recreating database schema...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        count = 0
        first_email = None
        last_email = None
        
        for index, row in df.iterrows():
            # Create a lowercase mapping for the current row to find core fields
            row_lower = {str(k).lower(): v for k, v in row.items()}
            
            # Required rule: ONLY skip rows if Official Email is completely empty
            univ_email_raw = get_val(row_lower, ["official email", "university email", "email", "univ email", "university_email", "university email address"])
            univ_email = clean_email(univ_email_raw)
            
            if not univ_email:
                # If we cannot determine the official email, skip
                continue
                
            # Parse other core fields
            full_name = get_val(row_lower, ["student name", "name", "full name", "full_name"]) or ""
            roll_number = get_val(row_lower, ["roll number", "roll no.", "roll no", "roll_no", "rollnumber"]) or ""
            branch = get_val(row_lower, ["branch", "stream", "department"]) or ""
            batch = get_val(row_lower, ["batch", "passing year", "year of passing"]) or ""
            
            cgpa_str = get_val(row_lower, ["cgpa", "overall cgpa", "current cgpa"])
            cgpa = None
            if cgpa_str:
                try:
                    cgpa = float(cgpa_str)
                except ValueError:
                    pass

            # Prepare raw_data JSON dictionary containing EVERYTHING exactly as it exists
            # We use the original row (with original column names) to preserve exact details
            raw_data = {str(k): (v if v != "" else None) for k, v in row.items()}
            
            # Create student record
            new_student = StudentMaster(
                univ_email=univ_email,
                roll_number=roll_number,
                full_name=full_name,
                branch=branch,
                batch=batch,
                cgpa=cgpa,
                raw_data=raw_data
            )
            
            db.add(new_student)
            
            if not first_email:
                first_email = univ_email
            last_email = univ_email
            count += 1
            
            # Commit in batches to keep memory usage low and perform fast
            if count % 500 == 0:
                await db.commit()
                print(f"Imported {count} records...")
                
        # Final commit
        await db.commit()
        
        print(f"FIRST EMAIL: {first_email}")
        print(f"LAST EMAIL: {last_email}")
        print(f"IMPORTED: {count}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_students.py <path_to_excel_file>")
        sys.exit(1)
        
    asyncio.run(import_students_from_excel(sys.argv[1]))
