import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    if not settings.smtp_user or not settings.smtp_password:
        print(f"--- DEV EMAIL TO {to_email}: {subject} ---")
        return False
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    
    # Format the sender nicely for a professional look in the inbox
    sender_email = settings.smtp_from or settings.smtp_user
    msg["From"] = f"PlacePrep AI <{sender_email}>"
    msg["To"] = to_email
    
    part = MIMEText(html_content, "html")
    msg.attach(part)
    
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False