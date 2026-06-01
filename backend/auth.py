import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from .database import get_db
from .models import User
from .config import settings

# --- Config Setup ---
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Helper Functions ---
def get_password_hash(password: str) -> str:
    password = password.strip()
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_password = plain_password.strip()
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Schemas ---
from pydantic import BaseModel
from typing import Optional, Dict, Any

class StudentVerifyRequest(BaseModel):
    univ_email: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Routes ---

@router.post("/verify-student")
async def verify_student(req: StudentVerifyRequest, db: Session = Depends(get_db)):
    # TEMPORARILY DISABLED institutional lookup per user request.
    # Return success for any email to allow registration bypass.
    return {
        "message": "Institutional verification temporarily bypassed", 
        "student_info": {
            "name": "Bypassed User",
            "branch": "N/A",
            "batch": "N/A",
            "roll_number": "N/A"
        }
    }

@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        email = req.email.lower().strip()
            
        existing_user = await db.scalar(select(User).where(User.email == email))
        if existing_user:
            raise HTTPException(status_code=400, detail="Account already exists. Please login.")
            
        user = User(
            email=req.email,
            name="New User", # We don't have the institutional name right now
            password_hash=get_password_hash(req.password)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email}}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print("CRITICAL CRASH IN REGISTER:", err_msg)
        raise HTTPException(status_code=500, detail=f"CRASH: {str(e)}")

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
        
    user = await db.scalar(select(User).where(User.email == email))
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email}}

# --- Dependency for Protected Routes ---
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")
        
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    skills: Optional[list[str]] = None
    name: Optional[str] = None

@router.get("/me")
async def get_my_details(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Temporarily returning stubbed institutional data
    institutional_data = {
        "full_name": current_user.name,
        "roll_number": "N/A",
        "univ_email": current_user.email,
        "branch": "N/A",
        "batch": "N/A",
        "cgpa": 0.0,
        "raw_data": {}
    }
    
    # Editable User Profile Data
    profile_data = {
        "bio": current_user.bio,
        "linkedin_url": current_user.linkedin_url,
        "github_url": current_user.github_url,
        "portfolio_url": current_user.portfolio_url,
        "profile_image_url": current_user.profile_image_url,
        "skills": current_user.skills or []
    }
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "institutional": institutional_data,
        "profile": profile_data
    }

@router.put("/profile/settings")
async def update_profile_settings(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Update strictly editable fields only
    if req.bio is not None: current_user.bio = req.bio
    if req.linkedin_url is not None: current_user.linkedin_url = req.linkedin_url
    if req.github_url is not None: current_user.github_url = req.github_url
    if req.portfolio_url is not None: current_user.portfolio_url = req.portfolio_url
    if req.profile_image_url is not None: current_user.profile_image_url = req.profile_image_url
    if req.skills is not None: current_user.skills = req.skills
    if req.name is not None: current_user.name = req.name
    
    await db.commit()
    return {"message": "Profile updated successfully"}
