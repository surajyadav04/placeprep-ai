import os
import re
import json
import uuid
import urllib.request
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, File, Form, UploadFile, Depends  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel, Field

from .database import engine, Base
from . import models  # type: ignore
from .config import settings
from .auth import router as auth_router, get_current_user
from .services.resume_service import (
    validate_file,
    extract_text,
    parse_resume,
    score_resume,
    detect_formatting_issues,
    generate_feedback,
    match_jd,
    extract_skills,
    extract_jd_skills,
    _section_scores,
    ResumeAnalysisResponse,
    JDMatchResponse,
)

# ---------- Gemini Client (optional) ----------

client = None
if settings.gemini_api_key:
    try:
        from google import genai
        client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")


# ---------- App Lifespan ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


# ---------- App Setup ----------

app = FastAPI(
    title="PlacePrep AI",
    description="AI-powered Interview Preparation Platform API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


# ---------- Schemas ----------

class EvaluationRequest(BaseModel):
    question: str
    answer: str


class EvaluationResponse(BaseModel):
    score: int = Field(..., description="Overall score 0–100.")
    review: str = Field(..., description="Detailed qualitative feedback.")
    strengths: List[str] = Field(..., description="2–3 specific strengths.")
    weaknesses: List[str] = Field(..., description="2–3 areas for improvement.")
    filler_words_count: int = Field(..., description="Total filler word count.")
    filler_words_detected: List[str] = Field(..., description="Unique filler words found.")
    ideal_answer: str = Field(..., description="Model answer for this question.")
    sandbox: bool = Field(False, description="True if response was simulated.")


class JDMatchRequest(BaseModel):
    job_description: str


# ---------- Simulated Fallback ----------

def get_simulated_feedback(question: str, answer: str) -> EvaluationResponse:
    """Rule-based evaluation when AI APIs are unavailable."""
    q   = question.lower()
    ans = answer.lower()

    if "process" in q and "thread" in q:
        ideal = ("A process is an independent execution unit with its own dedicated memory space. "
                 "A thread is a lightweight subprocess within a process sharing the parent's memory, "
                 "enabling faster context-switching. A thread crash can terminate the entire process.")
        expected_keywords = ["memory", "share", "lightweight", "context", "process", "thread"]
    elif "hash table" in q or "under the hood" in q:
        ideal = ("A hash table stores key-value pairs using a hash function to compute an index. "
                 "Collisions are handled via chaining or open addressing. Average O(1) time complexity.")
        expected_keywords = ["hash", "collision", "index", "chaining", "probing", "o(1)"]
    elif "url" in q or "browser" in q:
        ideal = ("The browser resolves the domain via DNS, establishes a TCP connection "
                 "(+ TLS for HTTPS), sends an HTTP GET, receives the response, then renders the page.")
        expected_keywords = ["dns", "ip", "tcp", "handshake", "http", "render", "request"]
    elif "tcp" in q and "udp" in q:
        ideal = ("TCP is connection-oriented and reliable; UDP is connectionless and faster. "
                 "TCP is used for web/files; UDP for streaming and gaming.")
        expected_keywords = ["connection-oriented", "connectionless", "reliable", "speed", "streaming", "packet"]
    elif "difficult" in q or "problem" in q or "solved" in q:
        ideal = ("Use the STAR method: Situation, Task, Action, Result. Describe the challenge, "
                 "specific actions taken (debugging, profiling, redesign), and measurable outcomes.")
        expected_keywords = ["star", "situation", "task", "action", "result", "debug", "solve"]
    else:
        ideal = ("Structure your response clearly: state core concepts, explain inner workings, "
                 "and give practical examples to demonstrate understanding.")
        expected_keywords = ["concept", "example", "explain"]

    fillers       = ["um", "uh", "like", "actually", "basically", "so", "you know"]
    detected_fillers = []
    filler_count  = 0
    words         = re.findall(r"\b\w+\b", ans)
    word_count    = len(words)

    for filler in fillers:
        if " " in filler:
            count = len(re.findall(re.escape(filler), ans))
        else:
            count = sum(1 for w in words if w == filler)
        if count > 0:
            detected_fillers.append(filler)
            filler_count += count

    matched_keywords = [kw for kw in expected_keywords if kw in ans]
    keyword_ratio    = len(matched_keywords) / len(expected_keywords) if expected_keywords else 0.5

    if word_count < 15:
        base_score = 40 + word_count
    elif word_count < 50:
        base_score = 55 + (word_count - 15) * 0.5
    else:
        base_score = 75 + min((word_count - 50) * 0.2, 15)

    score = int(base_score + (keyword_ratio * 15))
    score = max(10, min(100, score))

    strengths: List[str] = []
    weaknesses: List[str] = []

    if word_count > 40:
        strengths.append("Detailed and comprehensive explanation.")
    else:
        weaknesses.append("Response is short — elaborate on technical details with examples.")

    if matched_keywords:
        strengths.append(f"Correctly mentioned: {', '.join(matched_keywords[:3])}.")
    else:
        weaknesses.append("Missing core terminology relevant to this question.")

    if filler_count > 3:
        weaknesses.append("Frequent filler words detected — try pausing instead.")
    else:
        strengths.append("Clear communication with minimal filler words.")

    if not strengths:
        strengths = ["Structured attempt to answer the question."]
    if not weaknesses:
        weaknesses = ["Keep practicing for more confident, fluid delivery."]

    if score >= 85:
        review = (f"Excellent response! You demonstrated deep understanding using correct terminology "
                  f"({', '.join(matched_keywords[:2]) if matched_keywords else 'key concepts'}).")
    elif score >= 70:
        review = "Good attempt. Core concepts are right — add more structure and technical depth."
    else:
        review = ("Incomplete or lacking key details. Practice explaining step-by-step "
                  "and aim for at least 30–45 seconds of coverage.")

    return EvaluationResponse(
        score=score,
        review=review,
        strengths=strengths,
        weaknesses=weaknesses,
        filler_words_count=filler_count,
        filler_words_detected=detected_fillers,
        ideal_answer=ideal,
        sandbox=True,
    )


# ---------- OpenRouter Evaluation ----------

def call_openrouter(question: str, answer: str, api_key: str) -> EvaluationResponse:
    """Evaluate using OpenRouter API with Gemini 2.5 Flash."""
    url = "https://openrouter.ai/api/v1/chat/completions"

    system_instruction = (
        "You are an expert technical and behavioral interviewer. "
        "Analyze the candidate's spoken response. Evaluate accuracy, depth, structure, and clarity. "
        "Identify filler words (um, uh, like, so, actually, basically). "
        "Return a valid JSON object only — no markdown, no extra text."
    )

    prompt = f"""Evaluate this interview answer:
Question: {question}
Candidate Answer: {answer}

Return JSON with exactly these fields:
{{
  "score": 0-100,
  "review": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "filler_words_count": 0,
  "filler_words_detected": ["string"],
  "ideal_answer": "string"
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

    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type":  "application/json",
            "HTTP-Referer":  "https://placeprep.ai",
            "X-Title":       "PlacePrep AI",
        },
    )

    response     = urllib.request.urlopen(req, timeout=20)
    res_data     = json.loads(response.read().decode("utf-8"))
    content_str  = res_data["choices"][0]["message"]["content"]
    content_json = json.loads(content_str)

    return EvaluationResponse(
        score=content_json.get("score", 70),
        review=content_json.get("review", ""),
        strengths=content_json.get("strengths", []),
        weaknesses=content_json.get("weaknesses", []),
        filler_words_count=content_json.get("filler_words_count", 0),
        filler_words_detected=content_json.get("filler_words_detected", []),
        ideal_answer=content_json.get("ideal_answer", ""),
        sandbox=False,
    )


# ---------- Routes ----------

@app.get("/")
def read_root():
    return {"message": "Welcome to PlacePrep AI API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# --- Interview Evaluation ---

@app.post("/api/interview/evaluate", response_model=EvaluationResponse)
async def evaluate_interview(request: EvaluationRequest, current_user: models.User = Depends(get_current_user)):
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="Answer transcript is empty.")

    # 1. Try OpenRouter (Gemini 2.5 Flash via API)
    if settings.openrouter_api_key:
        try:
            return call_openrouter(request.question, request.answer, settings.openrouter_api_key)
        except Exception as e:
            print(f"OpenRouter failed: {e}")

    # 2. Try native Gemini client
    if client:
        try:
            from google.genai import types

            prompt = (
                f"Evaluate this interview answer:\n"
                f"Question: {request.question}\n"
                f"Answer: {request.answer}\n\n"
                f"Return a JSON object with: score, review, strengths, weaknesses, "
                f"filler_words_count, filler_words_detected, ideal_answer."
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are an expert technical interviewer. Evaluate the answer and return "
                        "structured JSON only. No markdown."
                    ),
                    response_mime_type="application/json",
                    response_schema=EvaluationResponse,
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            data["sandbox"] = False
            return EvaluationResponse(**data)
        except Exception as e:
            print(f"Gemini evaluation failed: {e}")

    # 3. Fallback to rule-based simulation
    return get_simulated_feedback(request.question, request.answer)


# --- Resume Analysis ---

@app.post("/api/resume/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a resume (PDF/DOCX) and get ATS analysis.
    Optionally include jd_text as a form field for semantic JD matching.
    """
    validate_file(file)

    temp_dir  = os.path.join(os.path.dirname(__file__), "tmp", "resumes")
    os.makedirs(temp_dir, exist_ok=True)
    ext       = os.path.splitext(file.filename or "resume.pdf")[1].lower()
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext}")

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Core pipeline
        raw_text          = extract_text(temp_path)
        parsed            = parse_resume(raw_text)
        formatting_issues = detect_formatting_issues(temp_path)
        score_data        = score_resume(
            parsed,
            jd_text=jd_text or None,
            resume_full_text=raw_text,
            formatting_issues=formatting_issues,
        )

        # Skill intelligence
        resume_skills     = extract_skills(raw_text)
        resume_skill_names = {s["name"] for s in resume_skills}
        missing_skills: List[str] = []
        if jd_text:
            jd_skills     = extract_jd_skills(jd_text)
            missing_skills = [s for s in jd_skills if s not in resume_skill_names][:15]

        # Section scores
        sec_scores = _section_scores(parsed)

        # Feedback
        feedback = generate_feedback(score_data, parsed=parsed, jd_text=jd_text or None)

        return ResumeAnalysisResponse(
            ats_score=score_data["ats_score"],
            keyword_match=score_data["keyword_match"],
            semantic_score=score_data["semantic_score"],
            readability=score_data["readability"],
            completeness=score_data["completeness"],
            impact_score=score_data["impact_score"],
            formatting=int(score_data["formatting"]),
            section_scores=sec_scores,
            extracted_skills=resume_skills,
            missing_skills=missing_skills,
            impact_lines=score_data.get("impact_lines", []),
            ats_tips=feedback["ats_tips"],
            strengths=feedback["strengths"],
            weaknesses=feedback["weaknesses"],
            parsed=parsed,
            formatting_issues=formatting_issues,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# --- JD Matching ---

@app.post("/api/resume/match-jd", response_model=JDMatchResponse)
async def match_resume_jd(file: UploadFile = File(...), jd: JDMatchRequest = None, current_user: models.User = Depends(get_current_user)):
    """Upload resume and provide a job description to get match analysis."""
    if not jd or not jd.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    validate_file(file)

    temp_dir  = os.path.join(os.path.dirname(__file__), "tmp", "resumes")
    os.makedirs(temp_dir, exist_ok=True)
    ext       = os.path.splitext(file.filename or "resume.pdf")[1].lower()
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext}")

    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        raw_text = extract_text(temp_path)
        parsed   = parse_resume(raw_text)
        result   = match_jd(parsed, jd.job_description)

        return JDMatchResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD matching failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
