from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from typing import Optional
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
    one_week_ago = dt.datetime.utcnow() - timedelta(days=7)
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

@router.get("/users")
async def get_founder_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    query = select(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
        
    if role and role != "all":
        query = query.where(User.role == role)
        
    # Get total count for pagination
    total_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_query)
    
    # Sort by created_at desc and paginate
    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at
            }
            for u in users
        ],
        "total": total or 0,
        "page": page,
        "limit": limit,
        "total_pages": ((total or 0) + limit - 1) // limit if total else 0
    }

@router.get("/analytics/growth")
async def get_growth_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    import datetime as dt
    thirty_days_ago = dt.datetime.utcnow() - timedelta(days=30)
    users = await db.execute(select(User.created_at).where(User.created_at >= thirty_days_ago))
    
    counts = {}
    for (created_at,) in users.all():
        if created_at:
            day_str = created_at.strftime("%Y-%m-%d")
            counts[day_str] = counts.get(day_str, 0) + 1
            
    data = []
    for i in range(29, -1, -1):
        day = (dt.datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        data.append({"date": day, "signups": counts.get(day, 0)})
        
    return data

@router.get("/analytics/activity")
async def get_activity_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    import datetime as dt
    today = dt.datetime.utcnow()
    IST = timezone(timedelta(hours=5, minutes=30))
    today_str = dt.datetime.now(IST).strftime("%Y-%m-%d")
    
    dau = await db.scalar(select(func.count(UserActivity.id)).where(UserActivity.date == today_str))
    
    seven_days_ago = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    thirty_days_ago = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    
    wau_query = await db.execute(select(func.count(UserActivity.user_id.distinct())).where(UserActivity.date >= seven_days_ago))
    wau = wau_query.scalar() or 0
    
    mau_query = await db.execute(select(func.count(UserActivity.user_id.distinct())).where(UserActivity.date >= thirty_days_ago))
    mau = mau_query.scalar() or 0
    
    return {"dau": dau or 0, "wau": wau, "mau": mau}

@router.get("/analytics/resumes")
async def get_resume_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    total = await db.scalar(select(func.count(Resume.id)))
    avg_score = await db.scalar(select(func.avg(Resume.ats_score)))
    
    resumes = await db.execute(select(Resume.feedback_json).where(Resume.feedback_json.is_not(None)))
    skill_counts = {}
    for (f_json,) in resumes.all():
        if isinstance(f_json, dict) and "skills" in f_json:
            skills = f_json.get("skills", [])
            for s in skills:
                if isinstance(s, str):
                    s_lower = s.lower()
                    skill_counts[s_lower] = skill_counts.get(s_lower, 0) + 1
                    
    top_skills = [{"skill": k, "count": v} for k, v in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:10]]
    
    return {
        "total_uploads": total or 0,
        "average_score": round(avg_score or 0, 1),
        "top_skills": top_skills
    }

@router.get("/analytics/interviews")
async def get_interview_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    started = await db.scalar(select(func.count(Interview.id)))
    completed = await db.scalar(select(func.count(Interview.id)).where(Interview.overall_score.is_not(None)))
    
    rate = round((completed / started * 100) if started else 0, 1)
    
    return {
        "started": started or 0,
        "completed": completed or 0,
        "completion_rate": rate
    }

@router.get("/analytics/funnel")
async def get_funnel_analytics(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    registered = await db.scalar(select(func.count(User.id)))
    resumes_uploaded = await db.scalar(select(func.count(User.id.distinct())).join(Resume, Resume.user_id == User.id))
    interview_started = await db.scalar(select(func.count(User.id.distinct())).join(Interview, Interview.user_id == User.id))
    interview_completed = await db.scalar(select(func.count(User.id.distinct())).join(Interview, Interview.user_id == User.id).where(Interview.overall_score.is_not(None)))
    
    return {
        "registered": registered or 0,
        "resume_uploaded": resumes_uploaded or 0,
        "interview_started": interview_started or 0,
        "interview_completed": interview_completed or 0
    }