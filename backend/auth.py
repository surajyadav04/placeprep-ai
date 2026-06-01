from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

try:
    from .database import get_db
    from .models import User, StudentMaster
    from .config import settings
except ImportError:
    from database import get_db
    from models import User, StudentMaster
    from config import settings

# --- Config Setup ---
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 14 # 14 days

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password.strip())

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password.strip(), hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Schemas ---
from pydantic import BaseModel
from typing import Optional

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "student"
    mentor_code: Optional[str] = None
    dob: Optional[str] = None

class VerifyStudentRequest(BaseModel):
    email: str

class VerifyStudentDobRequest(BaseModel):
    email: str
    dob: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    skills: Optional[list[str]] = None
    name: Optional[str] = None

# --- Routes ---

def normalize_dob(dob: str) -> str:
    if not dob: return ""
    s = str(dob).strip()
    # Excel dates often come in as "YYYY-MM-DD HH:MM:SS"
    s = s.split(" ")[0]
    
    # Try parsing common formats
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    # Fallback if no format matched
    return s.replace("/", "-")

@router.post("/verify-student")
async def verify_student(req: VerifyStudentRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
    
    if not student_record:
        return {"found": False, "message": "Email not found in university records."}
        
    return {
        "found": True,
        "full_name": student_record.full_name,
        "roll_no": student_record.roll_no,
        "branch": student_record.branch,
        "batch": student_record.batch,
        "requires_dob_verification": True
    }

@router.post("/verify-student-dob")
async def verify_student_dob(req: VerifyStudentDobRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
    
    if not student_record:
        return {"verified": False, "message": "Student record not found."}
        
    db_dob = normalize_dob(student_record.dob)
    req_dob = normalize_dob(req.dob)
    
    if db_dob and req_dob and db_dob == req_dob:
        return {"verified": True}
        
    return {"verified": False, "message": "Date of Birth does not match university records."}

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    role = req.role.strip().lower()
    if role not in ["student", "mentor"]:
        role = "student"
        
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        if role == "student":
            raise HTTPException(status_code=400, detail="This student account has already been registered.")
        else:
            raise HTTPException(status_code=400, detail="Account already exists. Please login.")
    
    student_master_id = None
    name = "New User"
    
    if role == "student":
        # Strict Institutional Verification
        student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
        if not student_record:
            raise HTTPException(status_code=404, detail="Email not found in university records.")
            
        # Strict DOB Verification on Backend
        if not req.dob:
            raise HTTPException(status_code=400, detail="Date of Birth is required for student registration.")
            
        db_dob = normalize_dob(student_record.dob)
        req_dob = normalize_dob(req.dob)
        
        if db_dob != req_dob:
            raise HTTPException(status_code=403, detail="Date of Birth does not match university records.")
            
        student_master_id = student_record.id
        name = student_record.full_name
        
    elif role == "mentor":
        # Mentor Access Code Verification
        if req.mentor_code != settings.mentor_access_code:
            raise HTTPException(status_code=403, detail="Invalid mentor access code.")
            
    user = User(
        email=email,
        name=name,
        password_hash=get_password_hash(req.password),
        role=role,
        student_master_id=student_master_id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "user": {"name": user.name, "email": user.email, "role": user.role}}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "user": {"name": user.name, "email": user.email, "role": user.role}}

# --- Dependency for Protected Routes ---
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")
        
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me")
async def get_my_details(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    institutional_data = {}
    
    if current_user.role == "student" and current_user.student_master_id:
        # Fetch directly from linked institutional registry
        sm = await db.scalar(select(StudentMaster).where(StudentMaster.id == current_user.student_master_id))
        if sm:
            institutional_data = {
                "full_name": sm.full_name,
                "roll_number": sm.roll_no,
                "univ_email": sm.official_email,
                "branch": sm.branch,
                "batch": sm.batch,
                "cgpa": sm.cgpa,
                "program_type": sm.program_type
            }
    
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
        "role": current_user.role,
        "institutional": institutional_data,
        "profile": profile_data
    }

@router.put("/profile/settings")
async def update_profile_settings(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req.bio is not None: current_user.bio = req.bio
    if req.linkedin_url is not None: current_user.linkedin_url = req.linkedin_url
    if req.github_url is not None: current_user.github_url = req.github_url
    if req.portfolio_url is not None: current_user.portfolio_url = req.portfolio_url
    if req.profile_image_url is not None: current_user.profile_image_url = req.profile_image_url
    if req.skills is not None: current_user.skills = req.skills
    if req.name is not None: current_user.name = req.name
    
    await db.commit()
    return {"message": "Profile updated successfully"}
