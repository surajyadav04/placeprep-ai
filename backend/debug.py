import os
import sys
import asyncio
from sqlalchemy import select

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import StudentMaster

async def main():
    async with SessionLocal() as db:
        res_count = await db.execute(select(StudentMaster))
        count = len(res_count.fetchall())
        
        # Check 2023 emails
        res_emails = await db.execute(select(StudentMaster.univ_email).filter(StudentMaster.univ_email.like('230%')).limit(10))
        emails = [e[0] for e in res_emails.fetchall()]
        
        with open("debug.txt", "w") as f:
            f.write(f"COUNT: {count}\n")
            f.write(f"2023 EMAILS: {emails}\n")

if __name__ == "__main__":
    asyncio.run(main())
