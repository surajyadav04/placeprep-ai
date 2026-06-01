import json
import urllib.request
from typing import List, Optional
from bs4 import BeautifulSoup
import requests

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from pydantic import BaseModel

try:
    from .database import get_db
    from .models import User, Opportunity
    from .auth import get_current_user
    from .config import settings
except ImportError:
    from database import get_db
    from models import User, Opportunity
    from auth import get_current_user
    from config import settings

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

# --- Dependencies ---

async def require_mentor(current_user: User = Depends(get_current_user)):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can perform this action.")
    return current_user

# --- Schemas ---

class AnalyzeUrlRequest(BaseModel):
    source_url: str

class OpportunityBase(BaseModel):
    source_url: str
    opportunity_type: str = "Full-Time"
    title: str
    company_name: str
    ai_summary: Optional[str] = None
    eligibility: Optional[str] = None
    skills: Optional[list] = None
    location: Optional[str] = None
    deadline: Optional[str] = None

class OpportunityResponse(OpportunityBase):
    id: int
    created_at: str
    created_by_name: str

    class Config:
        from_attributes = True

# --- AI Helper ---

def call_openrouter_for_opportunity(text_content: str, api_key: str) -> dict:
    url = "https://openrouter.ai/api/v1/chat/completions"
    system_instruction = (
        "You are an expert recruitment assistant. Extract opportunity details from the text. "
        "Return a valid JSON object ONLY, no markdown. "
    )
    prompt = f"""Extract details from this job posting text:
{text_content[:8000]}

Return JSON with exactly these fields:
{{
  "title": "string (Job title)",
  "company_name": "string",
  "opportunity_type": "string (Internship, Placement Drive, Full-Time, Hackathon, Competition, Scholarship)",
  "ai_summary": "string (2-3 sentence engaging summary)",
  "eligibility": "string (e.g. B.Tech 2026 batch)",
  "skills": ["string"],
  "location": "string",
  "deadline": "string or null"
}}"""

    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user",   "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type":  "application/json",
                "HTTP-Referer":  "https://placeprep.ai",
                "X-Title":       "PlacePrep AI",
            },
        )
        response = urllib.request.urlopen(req, timeout=20)
        res_data = json.loads(response.read().decode("utf-8"))
        content_str = res_data["choices"][0]["message"]["content"]
        return json.loads(content_str)
    except Exception as e:
        print(f"OpenRouter Opportunity Extract Error: {e}")
        return {}

def call_native_gemini_for_opportunity(text_content: str) -> dict:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.gemini_api_key)
        
        prompt = f"""Extract details from this job posting text:
{text_content[:8000]}

Return a JSON object with: title, company_name, opportunity_type, ai_summary, eligibility, skills (list of strings), location, deadline."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are an expert recruitment assistant. Return structured JSON only. No markdown.",
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Native Opportunity Extract Error: {e}")
        return {}


# --- Routes ---

@router.post("/analyze")
async def analyze_opportunity(req: AnalyzeUrlRequest, current_user: User = Depends(require_mentor)):
    """Fetch URL and use AI to extract details. Gracefully fallback if scraping fails."""
    # 1. Fetch Page
    text_content = ""
    page_title = ""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(req.source_url, headers=headers, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            page_title = soup.title.string if soup.title else ""
            
            # Remove scripts and styles
            for script in soup(["script", "style", "noscript", "header", "footer"]):
                script.decompose()
                
            text_content = soup.get_text(separator=' ', strip=True)
    except Exception as e:
        print(f"Scraping failed for {req.source_url}: {e}")
        # Proceed with empty text_content, AI will fallback or we return defaults

    # 2. Use AI if text found
    ai_data = {}
    if len(text_content) > 100:
        if settings.openrouter_api_key:
            ai_data = call_openrouter_for_opportunity(text_content, settings.openrouter_api_key)
        elif settings.gemini_api_key:
            ai_data = call_native_gemini_for_opportunity(text_content)
            
    # 3. Fallback logic
    return {
        "source_url": req.source_url,
        "title": ai_data.get("title") or page_title or "New Opportunity",
        "company_name": ai_data.get("company_name") or "Unknown Company",
        "opportunity_type": ai_data.get("opportunity_type") or "Full-Time",
        "ai_summary": ai_data.get("ai_summary") or "Apply via the external link provided.",
        "eligibility": ai_data.get("eligibility") or "",
        "skills": ai_data.get("skills") or [],
        "location": ai_data.get("location") or "",
        "deadline": ai_data.get("deadline") or ""
    }

@router.post("/", response_model=OpportunityResponse)
async def create_opportunity(req: OpportunityBase, current_user: User = Depends(require_mentor), db: Session = Depends(get_db)):
    db_opp = Opportunity(
        source_url=req.source_url,
        opportunity_type=req.opportunity_type,
        title=req.title,
        company_name=req.company_name,
        ai_summary=req.ai_summary,
        eligibility=req.eligibility,
        skills=req.skills,
        location=req.location,
        deadline=req.deadline,
        created_by=current_user.id
    )
    db.add(db_opp)
    await db.commit()
    await db.refresh(db_opp)
    
    # Fetch creator name for response
    creator = await db.scalar(select(User).where(User.id == db_opp.created_by))
    
    return {
        **{k: getattr(db_opp, k) for k in db_opp.__table__.columns.keys()},
        "created_at": db_opp.created_at.isoformat(),
        "created_by_name": creator.name if creator else "Mentor"
    }

@router.get("/", response_model=List[OpportunityResponse])
async def list_opportunities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    opps = await db.scalars(select(Opportunity).order_by(desc(Opportunity.created_at)))
    result = []
    for opp in opps:
        creator = await db.scalar(select(User).where(User.id == opp.created_by))
        opp_dict = {k: getattr(opp, k) for k in opp.__table__.columns.keys()}
        opp_dict["created_at"] = opp.created_at.isoformat()
        opp_dict["created_by_name"] = creator.name if creator else "Mentor"
        result.append(opp_dict)
    return result

@router.delete("/{opp_id}")
async def delete_opportunity(opp_id: int, current_user: User = Depends(require_mentor), db: Session = Depends(get_db)):
    opp = await db.scalar(select(Opportunity).where(Opportunity.id == opp_id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    if opp.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own opportunities")
        
    await db.delete(opp)
    await db.commit()
    return {"message": "Opportunity deleted"}
