<div align="center">
  <img src="frontend/public/icons.svg" alt="PlacePrep AI Logo" width="100" height="100">
  <h1 align="center">PlacePrep AI</h1>
  <p align="center">
    <strong>An Institutional Gateway & AI-Powered Placement Preparation Platform</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

## 🚀 Overview

**PlacePrep AI** is a comprehensive, AI-driven platform designed to streamline and elevate the placement preparation process for students. By acting as an institutional gateway, it seamlessly authenticates users and unlocks a suite of powerful tools—ranging from intelligent resume analysis to interactive mock interviews—equipping students with actionable insights to land their dream roles.

## ✨ Features

### 🔐 Institutional Authentication
- **Secure Access:** Robust JWT-based authentication system.
- **Decoupled Architecture:** Cleanly separated user authentication and institutional registry logic, ensuring data privacy and a seamless onboarding experience.

### 📄 AI Resume Analyzer (ATS Scoring)
- **Smart Parsing:** Upload your resume to receive a real-time Applicant Tracking System (ATS) score.
- **Actionable Feedback:** Get detailed, section-by-section recommendations on formatting, keyword optimization, and content improvements to ensure your resume passes automated screenings.

### 🎙️ Interactive Mock Interviews
- **Simulated Environments:** Practice in specialized domains, including Technical and HR interview modes.
- **Real-Time AI Feedback:** Receive granular feedback on your answers.
- **Advanced Metrics:** The AI evaluates responses based on **Sentiment**, **Clarity**, and **Confidence**, providing a holistic view of your interview performance.

### 📊 Performance Analytics
- **Visual Progress:** Track your ATS scores and mock interview results over time through an intuitive, data-rich analytics dashboard.
- **Insight Driven:** Identify strengths and target weak areas before stepping into real interviews.

### 🎨 Premium UI/UX & Theming
- **Dynamic Design:** Built with a modern glassmorphism aesthetic, subtle micro-animations, and fluid transitions using Framer Motion.
- **Light/Dark Mode:** Seamlessly toggle between fully supported Light and Dark themes for an optimal viewing experience in any environment.

### ⚙️ Customizable Profiles
- **Student Portfolio:** Maintain an editable profile linking your GitHub, LinkedIn, and personal portfolio.
- **Skills Tracking:** Easily update your tech stack and core competencies.

## 🛠️ Tech Stack

**Frontend:**
- **Framework:** React.js (Vite)
- **Styling:** Vanilla CSS / TailwindCSS (Glassmorphism UI)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM

**Backend:**
- **Framework:** FastAPI (Python)
- **Database:** SQLite (async via `aiosqlite`)
- **ORM:** SQLAlchemy
- **Security:** Passlib (bcrypt), python-jose (JWT)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### 1. Clone the Repository
```bash
git clone https://github.com/surajyadav04/placeprep-ai.git
cd placeprep-ai
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
*The backend will automatically generate a fresh SQLite database (`clean.db`) upon startup.*

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

### 4. Access the Platform
Navigate to `http://localhost:5173` in your browser.

## 🏗️ Architecture Notes
- The database schema strictly separates `User` metadata from institutional records, allowing flexible updates to user profiles without compromising read-only institutional data.
- The platform uses a micro-animation heavy design philosophy aimed at producing a state-of-the-art, premium feel to keep users engaged during their preparation journey.

---

<div align="center">
  <i>Empowering the next generation of engineers and professionals.</i>
</div>
