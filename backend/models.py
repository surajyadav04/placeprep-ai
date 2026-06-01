# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, JSON # type: ignore
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship # type: ignore
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from .database import Base  # type: ignore

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String)
    role = Column(String, default="student")
    
    # Editable Profile Fields
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    interviews = relationship("Interview", back_populates="user")
    resumes = relationship("Resume", back_populates="user")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # "HR", "Tech"
    overall_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    question_text = Column(Text)
    user_answer = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    sentiment = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    
    interview = relationship("Interview", back_populates="questions")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ats_score = Column(Float, nullable=True)
    feedback_json = Column(JSON, nullable=True)
    file_path = Column(String, nullable=True)
    
    user = relationship("User", back_populates="resumes")
