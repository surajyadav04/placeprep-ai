import os
import uuid
import shutil
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

try:
    from database import get_db
    from models import User, Resource, Opportunity
    from auth import get_current_user
except ImportError:
    from .database import get_db
    from .models import User, Resource, Opportunity
    from .auth import get_current_user

router = APIRouter(prefix="/api/resources", tags=["resources"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resources")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Dependency to check if user is mentor
async def get_mentor_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Access denied. Mentor role required.")
    return current_user

@router.post("/upload")
async def upload_resource(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_mentor_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Must be application/pdf.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Enforce size limit
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 20MB limit.")
    file.file.seek(0)
    
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    resource = Resource(
        title=title,
        description=description,
        file_path=unique_filename,
        uploaded_by=current_user.id
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    
    return {"message": "Resource uploaded successfully", "id": resource.id}

@router.get("")
async def get_resources(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resource, User.name.label("uploader_name"))
        .join(User, Resource.uploaded_by == User.id)
        .order_by(Resource.created_at.desc())
    )
    
    resources = []
    for res, uploader_name in result.all():
        resources.append({
            "id": res.id,
            "title": res.title,
            "description": res.description,
            "uploaded_by_name": uploader_name,
            "downloads": res.downloads,
            "created_at": res.created_at
        })
        
    return resources

@router.delete("/{resource_id}")
async def delete_resource(resource_id: int, current_user: User = Depends(get_mentor_user), db: AsyncSession = Depends(get_db)):
    resource = await db.scalar(select(Resource).where(Resource.id == resource_id))
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    if resource.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own resources.")
        
    file_path = os.path.join(UPLOAD_DIR, resource.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted successfully"}

@router.get("/download/{resource_id}")
async def download_resource(resource_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    resource = await db.scalar(select(Resource).where(Resource.id == resource_id))
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    file_path = os.path.join(UPLOAD_DIR, resource.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    # Increment download count
    resource.downloads += 1
    await db.commit()
    
    return FileResponse(path=file_path, filename=f"{resource.title}.pdf", media_type="application/pdf")

@router.get("/mentor/analytics")
async def get_mentor_analytics(current_user: User = Depends(get_mentor_user), db: AsyncSession = Depends(get_db)):
    # Total opportunities posted by this mentor
    opps_count = await db.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.created_by == current_user.id)
    )
    
    # Active opportunities (let's say deadline >= today, or just all since there's no strict "status" field)
    # The database has deadline as string, but let's just return opps_count as active for now
    
    # Total resources uploaded by this mentor
    resources_count = await db.scalar(
        select(func.count(Resource.id)).where(Resource.uploaded_by == current_user.id)
    )
    
    # Total resource downloads for this mentor
    downloads_count = await db.scalar(
        select(func.sum(Resource.downloads)).where(Resource.uploaded_by == current_user.id)
    ) or 0
    
    return {
        "total_opportunities_posted": opps_count or 0,
        "active_opportunities": opps_count or 0,
        "total_resources_uploaded": resources_count or 0,
        "total_resource_downloads": downloads_count or 0
    }
