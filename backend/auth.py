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

class VerifyStudentRequest(BaseModel):
    email: str

class VerifyStudentDobRequest(BaseModel):
    email: str
    dob: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class RegisterCompleteRequest(BaseModel):
    firebase_id_token: str
    password: str

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
    s = s.split(" ")[0]
    
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
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

@router.get("/register/status")
async def register_status(db: AsyncSession = Depends(get_db)):
    reg_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_open"))
    mode_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_mode"))
    
    is_open = True
    if reg_setting and reg_setting.description == "false":
        is_open = False
        
    mode = "firebase" # default
    if mode_setting and mode_setting.description in ["otp", "firebase"]:
        mode = mode_setting.description
        
    return {
        "open": is_open,
        "mode": mode
    }

@router.post("/register/init")
async def register_init(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
        
    # Registration Control Check
    reg_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_open"))
    if reg_setting and reg_setting.description == "false":
        raise HTTPException(status_code=403, detail="Registration is currently closed by the administration.")
        
    # Mode Check
    mode_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_mode"))
    mode = mode_setting.description if mode_setting else "firebase"
    if mode != "otp":
        raise HTTPException(status_code=400, detail="OTP registration is currently disabled.")
        
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
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

    student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
    if not student_record:
        raise HTTPException(status_code=404, detail="Email not found in university records.")

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
    # Mode Check
    mode_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_mode"))
    mode = mode_setting.description if mode_setting else "firebase"
    if mode != "otp":
        raise HTTPException(status_code=400, detail="OTP registration is currently disabled.")
        
    email = req.email.lower().strip()
    
    pending = await db.scalar(
        select(PendingRegistration)
        .where(PendingRegistration.email == email)
    )
    
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found or it has expired.")
        
    if pending.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please register again.")
        
    if pending.attempts >= 3:
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please register again.")
        
    otp_hash = hashlib.sha256(req.otp.encode()).hexdigest()
    if pending.otp_hash != otp_hash:
        pending.attempts += 1
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP.")
        
    # Safety Check: ensure email isn't suddenly taken
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="Account already exists.")
        
    student_master_id = None
    name = "New User"
    
    student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
    if student_record:
        student_master_id = student_record.id
        name = student_record.full_name
            
    user = User(
        email=email,
        name=name,
        password_hash=pending.password_hash,
        role="student",
        student_master_id=student_master_id
    )
    db.add(user)
    
    # Cleanup pending registration
    await db.delete(pending)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "user": {"name": user.name, "email": user.email, "role": user.role}}

@router.post("/register/complete")
async def register_complete(req: RegisterCompleteRequest, db: AsyncSession = Depends(get_db)):
    # Mode Check
    mode_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_mode"))
    mode = mode_setting.description if mode_setting else "firebase"
    if mode != "firebase":
        raise HTTPException(status_code=400, detail="Firebase registration is currently disabled.")
        
    # Registration Control Check
    reg_setting = await db.scalar(select(Resource).where(Resource.title == "SYSTEM_SETTING", Resource.file_path == "registration_open"))
    if reg_setting and reg_setting.description == "false":
        raise HTTPException(status_code=403, detail="Registration is currently closed by the administration.")
        
    # Verify Firebase Token
    try:
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(req.firebase_id_token)
        email = decoded_token.get("email", "").lower().strip()
        email_verified = decoded_token.get("email_verified", False)
        
        if not email or not email_verified:
            raise HTTPException(status_code=400, detail="Email is not verified via Firebase.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired Firebase token: {e}")
        
    # Check if user already exists
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(status_code=400, detail="Account already exists. Please login.")

    student_record = await db.scalar(select(StudentMaster).where(StudentMaster.official_email == email))
    if not student_record:
        raise HTTPException(status_code=404, detail="Email not found in university records.")
            
    student_master_id = student_record.id
    name = student_record.full_name

    validate_password_strength(req.password)
    
    # Create final user
    user = User(
        email=email,
        name=name,
        password_hash=get_password_hash(req.password),
        role="student",
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

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    
    if user:
        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        await db.commit()
        
        reset_url = f"https://placeprep.ai/reset-password?token={raw_token}"
        
        if settings.resend_api_key:
            try:
                import resend
                resend.api_key = settings.resend_api_key
                resend.Emails.send({
                    "from": settings.resend_from_email,
                    "to": user.email,
                    "subject": "PlacePrep AI - Password Reset Request",
                    "html": f"<p>You requested a password reset.</p><p>Click <a href='{reset_url}'>here</a> to reset your password.</p><p>This link expires in 15 minutes.</p>"
                })
            except Exception as e:
                print(f"Failed to send email via resend: {e}")
        else:
            print(f"--- DEVELOPMENT MODE: Password Reset URL for {email} ---")
            print(reset_url)
            print("---------------------------------------------------------")
            
    return {"message": "If an account exists for that email, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    validate_password_strength(req.new_password)
    
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    
    reset_record = await db.scalar(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .where(PasswordResetToken.used == False)
    )
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    if reset_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user = await db.scalar(select(User).where(User.id == reset_record.user_id))
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")
        
    user.password_hash = get_password_hash(req.new_password)
    reset_record.used = True
    
    await db.commit()
    return {"message": "Password has been successfully reset."}

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
        sm = await db.scalar(select(StudentMaster).where(StudentMaster.id == current_user.student_master_id))
        if sm:
            import datetime, decimal
            raw_data = {}
            for c in sm.__table__.columns:
                val = getattr(sm, c.name)
                if isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.isoformat()
                elif isinstance(val, decimal.Decimal):
                    val = float(val)
                raw_data[c.name] = val
                
            institutional_data = {
                "full_name": sm.full_name,
                "roll_number": sm.roll_no,
                "univ_email": sm.official_email,
                "branch": sm.branch,
                "batch": sm.batch,
                "cgpa": sm.cgpa,
                "program_type": sm.program_type,
                "raw_data": raw_data
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
    
    if req.name is not None and req.name.strip():
        current_user.name = req.name.strip()
    
    await db.commit()
    return {"message": "Profile updated successfully"}
