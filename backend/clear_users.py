import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import delete
from backend.database import SessionLocal, engine
from backend.models import User

async def clear_users():
    async with SessionLocal() as db:
        await db.execute(delete(User))
        await db.commit()
        print("All users have been cleared!")

if __name__ == "__main__":
    asyncio.run(clear_users())
