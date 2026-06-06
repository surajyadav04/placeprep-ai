import sys
import os
import asyncio
import pandas as pd
from sqlalchemy import select
import argparse
import re

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal
from models import StudentMaster

def clean_email(email_str):
    if pd.isna(email_str) or not str(email_str).strip():
        return None
    email = str(email_str).strip().lower()
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        return None
    return email

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

async def upsert_students_from_excel(file_path: str, dry_run: bool = True):
    print(f"Reading {file_path}...")
    print(f"MODE: {'DRY RUN (No database changes will be made)' if dry_run else 'EXECUTE (Writing to database)'}")
    
    try:
        df = pd.read_excel(file_path, sheet_name=0, engine="openpyxl", dtype=str)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    df = df.fillna("")
    df.columns = [str(col).strip() for col in df.columns]
    
    async with SessionLocal() as db:
        stats = {
            "processed": 0,
            "inserts": 0,
            "updates": 0,
            "skipped": 0,
            "duplicates_in_sheet": 0,
            "duplicate_rolls_in_sheet": 0,
            "roll_conflicts_with_db": 0
        }
        
        seen_emails_in_sheet = set()
        seen_rolls_in_sheet = set()
        duplicate_emails = []
        duplicate_rolls = []
        roll_conflicts = []
        
        total_rows = len(df)
        print(f"Total rows in Excel: {total_rows}\n")
        
        # Pre-fetch existing roll numbers from the DB to detect conflicts
        all_db_students = await db.scalars(select(StudentMaster))
        db_email_to_roll = {s.official_email: s.roll_no for s in all_db_students}
        db_roll_to_email = {s.roll_no: s.official_email for s in all_db_students}
        
        for index, row in df.iterrows():
            stats["processed"] += 1
            row_lower = {str(k).lower(): v for k, v in row.items()}
            
            raw_email = get_val(row_lower, ["official email", "university email", "email", "univ email"])
            official_email = clean_email(raw_email)
            
            if not official_email:
                stats["skipped"] += 1
                continue
                
            if official_email in seen_emails_in_sheet:
                stats["skipped"] += 1
                stats["duplicates_in_sheet"] += 1
                duplicate_emails.append(official_email)
                continue
                
            raw_roll = get_val(row_lower, ["roll no", "roll number", "roll_no"]) or "UNKNOWN_" + str(index)
            roll_no = raw_roll.strip().upper()
            
            if roll_no in seen_rolls_in_sheet:
                stats["duplicate_rolls_in_sheet"] += 1
                duplicate_rolls.append(roll_no)
                # We do not skip here just to track how many conflicts there are, 
                # but in a real commit, duplicate rolls would fail DB constraints.
            
            seen_emails_in_sheet.add(official_email)
            seen_rolls_in_sheet.add(roll_no)
            
            # Check DB roll conflict
            if roll_no in db_roll_to_email:
                owner_email = db_roll_to_email[roll_no]
                # If the roll number belongs to a DIFFERENT email in the DB, it's a conflict
                if owner_email != official_email:
                    stats["roll_conflicts_with_db"] += 1
                    roll_conflicts.append(f"{roll_no} (DB Owner: {owner_email}, Sheet: {official_email})")
            
            full_name = get_val(row_lower, ["full name", "name", "student name"]) or "Unknown"
            
            # Mapping fields
            batch = get_val(row_lower, ["batch"])
            campus = get_val(row_lower, ["campus"])
            course = get_val(row_lower, ["course"])
            branch = get_val(row_lower, ["branch", "stream"])
            division = get_val(row_lower, ["division", "div"])
            program_type = get_val(row_lower, ["program type", "program_type", "course"])
            passing_year = get_val(row_lower, ["current course passing yr", "passing year", "year of passing"])
            
            official_phone = get_val(row_lower, ["official phone", "phone"])
            whatsapp_no = get_val(row_lower, ["whatsapp no", "whatsapp"])
            alternate_phone = get_val(row_lower, ["alternate phone"])
            
            dob = get_val(row_lower, ["dob", "date of birth"])
            nationality = get_val(row_lower, ["nationality"])
            
            tenth_percent = get_float(row_lower, ["10th - aggregate marks", "10th %", "10th percent"])
            tenth_board = get_val(row_lower, ["10th - board", "10th board"])
            tenth_passing_year = get_val(row_lower, ["10th - passing yr", "10th passing year"])
            
            twelfth_percent = get_float(row_lower, ["12th - aggregate marks", "12th %", "12th percent"])
            twelfth_board = get_val(row_lower, ["12th - board", "12th board"])
            twelfth_passing_year = get_val(row_lower, ["12th - passing yr", "12th passing year"])
            
            diploma_degree = get_val(row_lower, ["diploma degree name", "diploma degree", "diploma"])
            diploma_percent = get_float(row_lower, ["diploma - aggregate marks", "diploma %", "diploma percent"])
            diploma_institute = get_val(row_lower, ["diploma institute name", "diploma institute"])
            diploma_passing_year = get_val(row_lower, ["diploma - passing yr", "diploma passing year"])
            
            cgpa = get_float(row_lower, ["current academics aggregate marks (cgpa)", "cgpa", "overall cgpa"])
            live_backlogs = get_int(row_lower, ["total live  backlog", "total live backlog", "live backlogs", "backlogs"])
            closed_backlogs = get_int(row_lower, ["total close backlog total", "closed backlogs"])
            
            semester_data = {}
            for col_name, val in row.items():
                if val == "": continue
                cn_lower = str(col_name).lower()
                if "sem" in cn_lower and "sgpa" in cn_lower:
                    semester_data[str(col_name)] = str(val).strip()
            
            placement_policy_submitted = get_val(row_lower, ["placement policy submitted", "policy"])
            remarks = get_val(row_lower, ["remarks"])

            # Check if student exists by email
            if official_email in db_email_to_roll:
                stats["updates"] += 1
                if not dry_run:
                    existing_student = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == official_email))
                    if existing_student:
                        existing_student.roll_no = roll_no
                        existing_student.full_name = full_name
                        existing_student.personal_email = get_val(row_lower, ["personal email"])
                        existing_student.batch = batch
                        existing_student.campus = campus
                        existing_student.course = course
                        existing_student.branch = branch
                        existing_student.division = division
                        existing_student.program_type = program_type
                        existing_student.passing_year = passing_year
                        existing_student.official_phone = official_phone
                        existing_student.whatsapp_no = whatsapp_no
                        existing_student.alternate_phone = alternate_phone
                        existing_student.dob = dob
                        existing_student.nationality = nationality
                        existing_student.tenth_percent = tenth_percent
                        existing_student.tenth_board = tenth_board
                        existing_student.tenth_passing_year = tenth_passing_year
                        existing_student.twelfth_percent = twelfth_percent
                        existing_student.twelfth_board = twelfth_board
                        existing_student.twelfth_passing_year = twelfth_passing_year
                        existing_student.diploma_degree = diploma_degree
                        existing_student.diploma_percent = diploma_percent
                        existing_student.diploma_institute = diploma_institute
                        existing_student.diploma_passing_year = diploma_passing_year
                        existing_student.cgpa = cgpa
                        existing_student.semester_data = semester_data
                        existing_student.live_backlogs = live_backlogs
                        existing_student.closed_backlogs = closed_backlogs
                        existing_student.placement_policy_submitted = placement_policy_submitted
                        existing_student.remarks = remarks
            else:
                stats["inserts"] += 1
                if not dry_run:
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
                    db.add(new_student)

            if not dry_run and index > 0 and index % 500 == 0:
                await db.commit()
                print(f"Processed {index} records...")
                
        if not dry_run:
            if stats["duplicate_rolls_in_sheet"] > 0 or stats["roll_conflicts_with_db"] > 0:
                print("\nWARNING: Conflicts found! DB commit may fail with IntegrityError if unique constraints are violated.")
            await db.commit()
            print("Import committed to database.")

        print("\n--- SUMMARY REPORT ---")
        print(f"Total Rows Processed: {stats['processed']}")
        print(f"Inserts (New): {stats['inserts']}")
        print(f"Updates (Existing): {stats['updates']}")
        print(f"Skipped Rows (No valid email/duplicate emails): {stats['skipped']}")
        print(f"Duplicate Emails in Sheet: {stats['duplicates_in_sheet']}")
        print(f"Duplicate Rolls in Sheet: {stats['duplicate_rolls_in_sheet']}")
        print(f"Roll Conflicts with DB: {stats['roll_conflicts_with_db']}")
        
        if duplicate_emails:
            print("\nDuplicate Emails Found in Sheet:")
            for email in set(duplicate_emails):
                print(f"  - {email}")
                
        if duplicate_rolls:
            print("\nDuplicate Rolls Found in Sheet:")
            for roll in set(duplicate_rolls):
                print(f"  - {roll}")
                
        if roll_conflicts:
            print("\nRoll Number Conflicts with existing DB (Different Emails):")
            for conflict in set(roll_conflicts):
                print(f"  - {conflict}")

        return {
            "processed": stats["processed"],
            "inserted": stats["inserts"],
            "updated": stats["updates"],
            "skipped": stats["skipped"],
            "duplicate_emails": stats["duplicates_in_sheet"],
            "roll_conflicts": stats["roll_conflicts_with_db"],
            "duplicate_email_list": list(set(duplicate_emails)),
            "roll_conflict_list": list(set(roll_conflicts))
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upsert students from Excel.")
    parser.add_argument("file", help="Path to Excel file")
    parser.add_argument("--confirm", action="store_true", help="Execute the import (writes to DB). If omitted, runs in dry-run mode.")
    
    args = parser.parse_args()
    
    # Run import
    asyncio.run(upsert_students_from_excel(args.file, dry_run=not args.confirm))