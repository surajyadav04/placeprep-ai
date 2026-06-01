from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
try:
    from .database import Base
except ImportError:
    from database import Base

class StudentMaster(Base):
    __tablename__ = "students_master"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Core Identity
    official_email = Column(String, unique=True, index=True, nullable=False)
    personal_email = Column(String, nullable=True)
    roll_no = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    
    # Academic Grouping
    batch = Column(String, nullable=True)
    campus = Column(String, nullable=True)
    course = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    division = Column(String, nullable=True)
    program_type = Column(String, nullable=True) # e.g., 'btech', 'btech_integrated'
    passing_year = Column(String, nullable=True)
    
    # Contact
    official_phone = Column(String, nullable=True)
    whatsapp_no = Column(String, nullable=True)
    alternate_phone = Column(String, nullable=True)
    
    # Personal
    dob = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    
    # Past Academics
    tenth_percent = Column(Float, nullable=True)
    tenth_board = Column(String, nullable=True)
    tenth_passing_year = Column(String, nullable=True)
    
    twelfth_percent = Column(Float, nullable=True)
    twelfth_board = Column(String, nullable=True)
    twelfth_passing_year = Column(String, nullable=True)
    
    diploma_degree = Column(String, nullable=True)
    diploma_percent = Column(Float, nullable=True)
    diploma_institute = Column(String, nullable=True)
    diploma_passing_year = Column(String, nullable=True)
    
    # Current Academics
    cgpa = Column(Float, nullable=True)
    semester_data = Column(JSON, nullable=True) # Stores sgpa for each semester dynamically
    live_backlogs = Column(Integer, default=0)
    closed_backlogs = Column(Integer, default=0)
    
    # Policy / Admin
    placement_policy_submitted = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="student_master", uselist=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False) # Not nullable anymore since no Google OAuth
    name = Column(String)
    role = Column(String, default="student")
    
    # Foreign Key linking to institutional data for students
    student_master_id = Column(Integer, ForeignKey("students_master.id"), nullable=True)
    
    # Editable Profile Fields
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    student_master = relationship("StudentMaster", back_populates="user")
    opportunities = relationship("Opportunity", back_populates="creator")
    interviews = relationship("Interview", back_populates="user")
    resumes = relationship("Resume", back_populates="user")

class Opportunity(Base):
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    source_url = Column(String, nullable=False)
    opportunity_type = Column(String, nullable=False, default="Full-Time")
    title = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    ai_summary = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)
    location = Column(String, nullable=True)
    deadline = Column(String, nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    creator = relationship("User", back_populates="opportunities")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)
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
