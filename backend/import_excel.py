import sys
import os
import asyncio
import pandas as pd
from sqlalchemy import select
import json

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal, engine
from models import StudentMaster, Base

def get_val(row, possible_names):
    for name in possible_names:
        if name in row:
            val = row[name]
            if pd.isna(val) or val == "":
                return None
            return str(val).strip()
    return None

def get_float(row, possible_names):
    val = get_val(row, possible_names)
    if val:
        try:
            return float(val)
        except ValueError:
            pass
    return None

def get_int(row, possible_names, default=0):
    val = get_val(row, possible_names)
    if val:
        try:
            return int(val)
        except ValueError:
            pass
    return default

async def import_students_from_excel(file_path: str):
    print(f"Reading {file_path}...")
    
    try:
        df = pd.read_excel(file_path, sheet_name=0, engine="openpyxl", dtype=str)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    df = df.fillna("")
    df.columns = [str(col).strip() for col in df.columns]
    
    # We won't drop all tables, only students_master to rebuild registry cleanly
    async with engine.begin() as conn:
        print("Recreating database schema (creating missing tables)...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with SessionLocal() as db:
        # Clear existing students mapping safely? 
        # Actually it's best to TRUNCATE or just delete all rows for a clean registry rebuild.
        print("Clearing existing StudentMaster records...")
        await db.execute(StudentMaster.__table__.delete())
        await db.commit()
        
        count = 0
        skipped = 0
        seen_emails = set()
        seen_rolls = set()
        duplicate_emails = []
        
        btech_count = 0
        btech_inte_count = 0
        total_rows = len(df)
        
        print(f"Total rows in Excel: {total_rows}")
        
        for index, row in df.iterrows():
            row_lower = {str(k).lower(): v for k, v in row.items()}
            
            raw_email = get_val(row_lower, ["official email", "university email", "email", "univ email"])
            
            if not raw_email:
                skipped += 1
                continue
                
            # Normalize email
            official_email = raw_email.strip().lower()
            
            if official_email in seen_emails:
                skipped += 1
                duplicate_emails.append(official_email)
                print(f"SKIPPING: Duplicate email found - {official_email}")
                continue
                
            raw_roll = get_val(row_lower, ["roll no", "roll number", "roll_no"]) or "UNKNOWN_" + str(index)
            roll_no = raw_roll.strip().upper()
            
            if roll_no in seen_rolls:
                skipped += 1
                print(f"SKIPPING: Duplicate roll no found - {roll_no}")
                continue
                
            seen_emails.add(official_email)
            seen_rolls.add(roll_no)
            
            full_name = get_val(row_lower, ["full name", "name", "student name"]) or "Unknown"
            
            # Grouping
            batch = get_val(row_lower, ["batch"])
            campus = get_val(row_lower, ["campus"])
            course = get_val(row_lower, ["course"])
            branch = get_val(row_lower, ["branch", "stream"])
            division = get_val(row_lower, ["division", "div"])
            program_type = get_val(row_lower, ["program type", "program_type"])
            passing_year = get_val(row_lower, ["passing year", "year of passing"])
            
            # Contact
            official_phone = get_val(row_lower, ["official phone", "phone"])
            whatsapp_no = get_val(row_lower, ["whatsapp no", "whatsapp"])
            alternate_phone = get_val(row_lower, ["alternate phone"])
            
            # Personal
            dob = get_val(row_lower, ["dob", "date of birth"])
            nationality = get_val(row_lower, ["nationality"])
            
            # Past Academics
            tenth_percent = get_float(row_lower, ["10th %", "10th percent"])
            tenth_board = get_val(row_lower, ["10th board"])
            tenth_passing_year = get_val(row_lower, ["10th passing year"])
            
            twelfth_percent = get_float(row_lower, ["12th %", "12th percent"])
            twelfth_board = get_val(row_lower, ["12th board"])
            twelfth_passing_year = get_val(row_lower, ["12th passing year"])
            
            diploma_degree = get_val(row_lower, ["diploma degree", "diploma"])
            diploma_percent = get_float(row_lower, ["diploma %", "diploma percent"])
            diploma_institute = get_val(row_lower, ["diploma institute"])
            diploma_passing_year = get_val(row_lower, ["diploma passing year"])
            
            # Current Academics
            cgpa = get_float(row_lower, ["cgpa", "overall cgpa"])
            live_backlogs = get_int(row_lower, ["live backlogs", "backlogs"])
            closed_backlogs = get_int(row_lower, ["closed backlogs"])
            
            # Build semantic semester_data JSON by grabbing anything that looks like "sem x sgpa"
            semester_data = {}
            for col_name, val in row.items():
                if val == "": continue
                cn_lower = str(col_name).lower()
                if "sem" in cn_lower and "sgpa" in cn_lower:
                    semester_data[str(col_name)] = str(val).strip()
            
            # Policy
            placement_policy_submitted = get_val(row_lower, ["placement policy submitted", "policy"])
            remarks = get_val(row_lower, ["remarks"])
            
            # Create record
            new_student = StudentMaster(
                official_email=official_email,
                personal_email=get_val(row_lower, ["personal email"]),
                roll_no=roll_no,
                full_name=full_name,
                batch=batch,
                campus=campus,
                course=course,
                branch=branch,
                division=division,
                program_type=program_type,
                passing_year=passing_year,
                official_phone=official_phone,
                whatsapp_no=whatsapp_no,
                alternate_phone=alternate_phone,
                dob=dob,
                nationality=nationality,
                tenth_percent=tenth_percent,
                tenth_board=tenth_board,
                tenth_passing_year=tenth_passing_year,
                twelfth_percent=twelfth_percent,
                twelfth_board=twelfth_board,
                twelfth_passing_year=twelfth_passing_year,
                diploma_degree=diploma_degree,
                diploma_percent=diploma_percent,
                diploma_institute=diploma_institute,
                diploma_passing_year=diploma_passing_year,
                cgpa=cgpa,
                semester_data=semester_data,
                live_backlogs=live_backlogs,
                closed_backlogs=closed_backlogs,
                placement_policy_submitted=placement_policy_submitted,
                remarks=remarks
            )
            
            # Tracking metrics
            if program_type:
                pt_lower = program_type.lower()
                if pt_lower == "btech":
                    btech_count += 1
                elif pt_lower == "btech_integrated" or pt_lower == "btech(inte)":
                    btech_inte_count += 1
            
            db.add(new_student)
            count += 1
            
            if count % 500 == 0:
                await db.commit()
                print(f"Imported {count} records...")
                
        await db.commit()
        print("\n--- Import Report ---")
        print(f"Total Rows Processed: {total_rows}")
        print(f"Unique Emails: {len(seen_emails)}")
        print(f"Duplicate Emails Encountered: {len(duplicate_emails)}")
        if duplicate_emails:
            print("List of Duplicate Emails:")
            for e in set(duplicate_emails):
                print(f" - {e}")
                
        print("\n--- Final Counts ---")
        print(f"Total imported students: {count}")
        print(f"Skipped duplicates/invalid: {skipped}")
        print(f"BTech count: {btech_count}")
        print(f"BTech Integrated count: {btech_inte_count}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_excel.py <path_to_excel_file>")
        sys.exit(1)
        
    asyncio.run(import_students_from_excel(sys.argv[1]))
