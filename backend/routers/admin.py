from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

try:
    from ..auth import get_current_user
    from ..models import User
    from ..config import settings
    from ..email_service import send_email
except ImportError:
    from auth import get_current_user
    from models import User
    from config import settings
    from email_service import send_email

router = APIRouter(prefix="/api/admin", tags=["admin"])

class SMTPTestRequest(BaseModel):
    email: str

@router.post("/test-smtp")
async def test_smtp(req: SMTPTestRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
        
    if not settings.smtp_test_enabled:
        raise HTTPException(status_code=404, detail="SMTP test endpoint is disabled.")
        
    success = send_email(
        to_email=req.email,
        subject="PlacePrep AI - SMTP Test",
        html_content="<p>This is a test email from the Railway production environment.</p>"
    )
    if success:
        return {"status": "success", "message": "Email sent successfully via Gmail SMTP."}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check Railway logs.")