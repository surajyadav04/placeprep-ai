from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from pydantic import BaseModel

try:
    from database import get_db
    from models import User, UserActivity
    from auth import get_current_user
except ImportError:
    from backend.database import get_db
    from backend.models import User, UserActivity
    from backend.auth import get_current_user

router = APIRouter(prefix="/api/activity", tags=["activity"])

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(timezone.utc).astimezone(IST)

def get_ist_date_str():
    return get_ist_now().strftime("%Y-%m-%d")

class PingRequest(BaseModel):
    seconds: int

@router.post("/ping")
async def ping_activity(
    req: PingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.seconds <= 0 or req.seconds > 120:
        return {"status": "ignored"}
        
    today_str = get_ist_date_str()
    now_utc = datetime.now(timezone.utc)
    
    # Find or create today's record
    query = select(UserActivity).where(
        UserActivity.user_id == current_user.id,
        UserActivity.date == today_str
    )
    result = await db.execute(query)
    activity = result.scalar_one_or_none()
    
    if activity:
        activity.active_seconds += req.seconds
        activity.last_seen_at = now_utc
    else:
        activity = UserActivity(
            user_id=current_user.id,
            date=today_str,
            active_seconds=req.seconds,
            last_seen_at=now_utc
        )
        db.add(activity)
        
    await db.commit()
    return {"status": "success", "active_seconds": activity.active_seconds}

@router.get("/streak")
async def get_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all activity dates descending
    query = select(UserActivity).where(
        UserActivity.user_id == current_user.id,
        UserActivity.active_seconds > 0
    ).order_by(desc(UserActivity.date))
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    dates_active = set(a.date for a in activities)
    
    today = get_ist_now().date()
    yesterday = today - timedelta(days=1)
    
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = yesterday.strftime("%Y-%m-%d")
    
    current_streak = 0
    
    # Start checking from today or yesterday
    check_date = today
    if today_str not in dates_active and yesterday_str in dates_active:
        check_date = yesterday
    
    # Calculate current streak
    while check_date.strftime("%Y-%m-%d") in dates_active:
        current_streak += 1
        check_date -= timedelta(days=1)
        
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 0
    prev_date = None
    
    sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in dates_active])
    
    for d in sorted_dates:
        if prev_date is None:
            temp_streak = 1
        elif (d - prev_date).days == 1:
            temp_streak += 1
        else:
            temp_streak = 1
        
        if temp_streak > longest_streak:
            longest_streak = temp_streak
            
        prev_date = d
        
    # Get today seconds
    today_seconds = next((a.active_seconds for a in activities if a.date == today_str), 0)
    
    return {
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "todaySeconds": today_seconds
    }

@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(UserActivity).where(
        UserActivity.user_id == current_user.id,
        UserActivity.active_seconds > 0
    ).order_by(desc(UserActivity.date))
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    today = get_ist_now().date()
    today_str = today.strftime("%Y-%m-%d")
    
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    today_sec = 0
    weekly_sec = 0
    monthly_sec = 0
    total_sec = 0
    
    activity_calendar = {}
    
    for a in activities:
        a_date = datetime.strptime(a.date, "%Y-%m-%d").date()
        activity_calendar[a.date] = a.active_seconds
        
        total_sec += a.active_seconds
        
        if a.date == today_str:
            today_sec += a.active_seconds
            
        if a_date >= week_ago:
            weekly_sec += a.active_seconds
            
        if a_date >= month_ago:
            monthly_sec += a.active_seconds
            
    return {
        "todaySeconds": today_sec,
        "weeklySeconds": weekly_sec,
        "monthlySeconds": monthly_sec,
        "totalSeconds": total_sec,
        "activityCalendar": activity_calendar
    }
