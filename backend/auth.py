import secrets
import hashlib
import re
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

try:
    from .database import get_db
    from .models import User, StudentMaster, PasswordResetToken, PendingRegistration, Resource
    from .config import settings
except ImportError:
    from database import get_db
    from models import User, StudentMaster, PasswordResetToken, PendingRegistration, Resource
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

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    skills: Optional[list[str]] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    organization: Optional[str] = None

def validate_password_strength(password: str) -> None:
    if len(password) < 10:
        raise HTTPException(status_code=400, detail="Password must be at least 10 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_\+=/\[\]~]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")

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

@router.post("/register/init")
async def register_init(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    role = req.role.strip().lower()
    if role not in ["student", "mentor"]:
        role = "student"
        
    # Registration Control Check
    reg_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_open"))
    if reg_setting and reg_setting.description == "false":
        raise HTTPException(status_code=403, detail="Registration is currently closed by the administration.")
        
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        if role == "student":
            raise HTTPException(status_code=400, detail="This student account has already been registered.")
        else:
            raise HTTPException(status_code=400, detail="Account already exists. Please login.")
            
    # Cooldown Check
    recent_pending = await db.scalar(
        select(PendingRegistration)
        .where(PendingRegistration.email == email)
        .order_by(PendingRegistration.created_at.desc())
    )
    if recent_pending:
        delta = datetime.now(timezone.utc) - recent_pending.created_at.replace(tzinfo=timezone.utc)
        if delta.total_seconds() < 60:
            raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting another OTP.")

    if role == "student":
        student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
        if not student_record:
            raise HTTPException(status_code=404, detail="Email not found in university records.")
            
        if not req.dob:
            raise HTTPException(status_code=400, detail="Date of Birth is required for student registration.")
            
        db_dob = normalize_dob(student_record.dob)
        req_dob = normalize_dob(req.dob)
        
        if db_dob != req_dob:
            raise HTTPException(status_code=403, detail="Date of Birth does not match university records.")
            
    elif role == "mentor":
        if req.mentor_code != settings.mentor_access_code:
            raise HTTPException(status_code=403, detail="Invalid mentor access code.")

    validate_password_strength(req.password)
    
    # Generate OTP
    import secrets
    raw_otp = f"{secrets.randbelow(1000000):06d}"
    otp_hash = hashlib.sha256(raw_otp.encode()).hexdigest()
    
    # Clean up old pending registrations for this email
    await db.execute(delete(PendingRegistration).where(PendingRegistration.email == email))
    
    pending = PendingRegistration(
        email=email,
        password_hash=get_password_hash(req.password),
        role=role,
        dob=req.dob if role == "student" else None,
        mentor_code=req.mentor_code if role == "mentor" else None,
        otp_hash=otp_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    db.add(pending)
    await db.commit()
    
    # Send Email
    if settings.resend_api_key:
        try:
            import resend
            resend.api_key = settings.resend_api_key
            resend.Emails.send({
                "from": settings.resend_from_email,
                "to": email,
                "subject": "PlacePrep AI - Verify Your Email",
                "html": f"<p>Your verification code is: <strong>{raw_otp}</strong></p><p>It expires in 10 minutes.</p>"
            })
        except Exception as e:
            print(f"Failed to send email via resend: {e}")
    else:
        print(f"--- DEVELOPMENT MODE: OTP for {email} is {raw_otp} ---")
        print("---------------------------------------------------------")
        
    return {"message": "OTP sent to email."}

@router.post("/register/verify")
async def register_verify(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    
    pending = await db.scalar(
        select(PendingRegistration)
        .where(PendingRegistration.email == email)
    )
    
    if not pending:
        raise HTTPException(status_code=404, detail="No pending registration found or it has expired.")
        
    if datetime.now(timezone.utc) > pending.expires_at.replace(tzinfo=timezone.utc):
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    if pending.attempts >= 3:
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")
        
    req_hash = hashlib.sha256(req.otp.encode()).hexdigest()
    if req_hash != pending.otp_hash:
        pending.attempts += 1
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP.")
        
    # Create final user
    new_user = User(
        email=pending.email,
        password_hash=pending.password_hash,
        role=pending.role,
        name=pending.email.split("@")[0] # Temporary name
    )
    
    if pending.role == "student":
        student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
        if student_record:
            new_user.student_master_id = student_record.id
            new_user.name = student_record.full_name
            
    db.add(new_user)
    await db.delete(pending)
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "Registration successful. You can now log in."}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email.lower().strip()))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

async def get_current_user(token: str = Depends(jwt.get_unverified_header), db: AsyncSession = Depends(get_db)):
    # Using a simple custom scheme where frontend sends standard Bearer token
    # FastAPI's OAuth2PasswordBearer forces x-www-form-urlencoded which we are avoiding.
    from fastapi import Request
    async def extract_token(request: Request):
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        return auth.split(" ")[1]
        
    return extract_token

# Let's write the actual dependency that verifies token
async def get_current_user(request: __import__("fastapi").Request, db: AsyncSession = Depends(get_db)):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
        
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "bio": current_user.bio,
        "linkedin_url": current_user.linkedin_url,
        "github_url": current_user.github_url,
        "portfolio_url": current_user.portfolio_url,
        "profile_image_url": current_user.profile_image_url,
        "skills": current_user.skills,
        "designation": current_user.designation,
        "organization": current_user.organization,
        "name_change_used": current_user.name_change_used
    }

@router.put("/profile")
async def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req.bio is not None: current_user.bio = req.bio
    if req.linkedin_url is not None: current_user.linkedin_url = req.linkedin_url
    if req.github_url is not None: current_user.github_url = req.github_url
    if req.portfolio_url is not None: current_user.portfolio_url = req.portfolio_url
    if req.profile_image_url is not None: current_user.profile_image_url = req.profile_image_url
    if req.skills is not None: current_user.skills = req.skills
    
    # Name updates (restricted for mentors after first time)
    if req.name is not None and req.name != current_user.name:
        if current_user.role == 'mentor':
            if current_user.name_change_used:
                raise HTTPException(status_code=400, detail="Mentors can only change their name once.")
            current_user.name = req.name
            current_user.name_change_used = True
        elif current_user.role != 'student':
            current_user.name = req.name
            
    if current_user.role == 'mentor':
        if req.designation is not None: current_user.designation = req.designation
        if req.organization is not None: current_user.organization = req.organization
        
    await db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    
    if not user:
        # Prevent email enumeration by always returning success
        return {"message": "If an account exists, a reset link has been sent."}
        
    # Generate token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    # Expire old tokens
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    db.add(reset_token)
    await db.commit()
    
    # Send Email
    reset_link = f"{settings.frontend_url}/reset-password?token={raw_token}"
    
    try:
        from email_service import send_email
    except ImportError:
        from backend.email_service import send_email
        
    if not send_email(
        to_email=email,
        subject="PlacePrep AI - Password Reset Request",
        html_content=f"<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href='{reset_link}'>{reset_link}</a></p>"
    ):
        print(f"--- DEVELOPMENT MODE: Password Reset link for {email} is {reset_link} ---")
        
    return {"message": "If an account exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    
    reset_record = await db.scalar(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .where(PasswordResetToken.used == False)
    )
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    if datetime.now(timezone.utc) > reset_record.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")
        
    validate_password_strength(req.new_password)
    
    user = await db.scalar(select(User).where(User.id == reset_record.user_id))
    user.password_hash = get_password_hash(req.new_password)
    
    reset_record.used = True
    await db.commit()
    
    return {"message": "Password has been successfully reset. You can now log in."}
