from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

try:
    from auth import get_current_user
    from models import User
    from config import settings
except ImportError:
    from backend.auth import get_current_user
    from backend.models import User
    from backend.config import settings

router = APIRouter(prefix="/api/founder", tags=["founder"])

@router.get("/verify-access")
async def verify_access(current_user: User = Depends(get_current_user)):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founder access required")
        
    return {
        "status": "success",
        "email": current_user.email,
        "role": current_user.role
    }