from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone

try:
    from auth import get_current_user
    from models import User, UserActivity, Resume, Interview
    from config import settings
    from database import get_db
except ImportError:
    from backend.auth import get_current_user
    from backend.models import User, UserActivity, Resume, Interview
    from backend.config import settings
    from backend.database import get_db

router = APIRouter(prefix="/api/founder", tags=["founder"])

@router.get("/verify-access")
async def verify_access(current_user: User = Depends(get_current_user)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    return {
        "status": "success",
        "role": current_user.role
    }

@router.get("/stats")
async def get_founder_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    # User Counts
    total_users = await db.scalar(select(func.count(User.id)))
    students = await db.scalar(select(func.count(User.id)).where(User.role == "student"))
    mentors = await db.scalar(select(func.count(User.id)).where(User.role == "mentor"))
    founders = await db.scalar(select(func.count(User.id)).where(User.role == "founder"))
    
    # Active Today
    import datetime as dt
    IST = timezone(timedelta(hours=5, minutes=30))
    today_str = dt.datetime.now(IST).strftime("%Y-%m-%d")
    active_today = await db.scalar(select(func.count(UserActivity.id)).where(UserActivity.date == today_str))
    
    # New Users This Week
    one_week_ago = dt.datetime.now(timezone.utc) - timedelta(days=7)
    new_users_this_week = await db.scalar(select(func.count(User.id)).where(User.created_at >= one_week_ago))
    
    # Feature Usage
    resume_analyses = await db.scalar(select(func.count(Resume.id)))
    interview_evaluations = await db.scalar(select(func.count(Interview.id)))
    
    return {
        "total_users": total_users or 0,
        "students": students or 0,
        "mentors": mentors or 0,
        "founders": founders or 0,
        "active_today": active_today or 0,
        "new_users_this_week": new_users_this_week or 0,
        "resume_analyses": resume_analyses or 0,
        "interview_evaluations": interview_evaluations or 0
    }