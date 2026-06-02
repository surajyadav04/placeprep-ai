from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List

try:
    from database import get_db
    from models import User, Resume, Interview
    from auth import get_current_user
except ImportError:
    from backend.database import get_db
    from backend.models import User, Resume, Interview
    from backend.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/quick-stats")
async def get_quick_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Resumes
        resume_count = await db.scalar(select(func.count(Resume.id)).where(Resume.user_id == current_user.id)) or 0
        best_resume_score = await db.scalar(select(func.max(Resume.ats_score)).where(Resume.user_id == current_user.id)) or 0
        avg_resume_score = await db.scalar(select(func.avg(Resume.ats_score)).where(Resume.user_id == current_user.id)) or 0

        # Interviews
        interview_count = await db.scalar(select(func.count(Interview.id)).where(Interview.user_id == current_user.id)) or 0
        best_interview_score = await db.scalar(select(func.max(Interview.overall_score)).where(Interview.user_id == current_user.id)) or 0
        avg_interview_score = await db.scalar(select(func.avg(Interview.overall_score)).where(Interview.user_id == current_user.id)) or 0

        return {
            "resumeCount": resume_count,
            "bestResumeScore": round(best_resume_score, 1),
            "averageResumeScore": round(avg_resume_score, 1),
            "interviewCount": interview_count,
            "bestInterviewScore": round(best_interview_score, 1),
            "averageInterviewScore": round(avg_interview_score, 1)
        }
    except Exception as e:
        print(f"Error fetching quick stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch quick stats")

@router.get("/resume-history")
async def get_resume_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Order by id descending instead of created_at as requested to avoid migrations
        result = await db.execute(
            select(Resume).where(Resume.user_id == current_user.id).order_by(desc(Resume.id))
        )
        resumes = result.scalars().all()
        
        history = []
        for r in resumes:
            history.append({
                "id": r.id,
                "ats_score": r.ats_score,
                "feedback_json": r.feedback_json
            })
        return history
    except Exception as e:
        print(f"Error fetching resume history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resume history")

@router.get("/interview-history")
async def get_interview_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Order by id descending
        result = await db.execute(
            select(Interview).where(Interview.user_id == current_user.id).order_by(desc(Interview.id))
        )
        interviews = result.scalars().all()
        
        history = []
        for i in interviews:
            history.append({
                "id": i.id,
                "type": i.type,
                "overall_score": i.overall_score,
                "feedback": i.feedback,
                "created_at": i.created_at # Note: Interview model does have created_at
            })
        return history
    except Exception as e:
        print(f"Error fetching interview history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch interview history")
