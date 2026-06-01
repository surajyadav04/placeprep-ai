<div align="center">

<img src="frontend/public/icons.svg" alt="PlacePrep AI Logo" width="140" height="140" style="border-radius: 20px;">

<br>

<h1 align="center">
  ✨ PlacePrep AI ✨
</h1>

<p align="center">
  <i>The Ultimate Alchemical Forge for Placement Preparation</i>
</p>

<p align="center">
  <a href="#features"><b>Features</b></a> &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#tech-stack"><b>Tech Stack</b></a> &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#installation"><b>Installation</b></a> &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#architecture"><b>Architecture</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge&color=00e5ff" alt="Status">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge&color=8a2be2" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&color=ff007f" alt="License">
</p>

</div>

<br>

> *"Elevating the placement journey from an opaque process to a precise, data-driven science."*

<br>

---

## 🌌 The Vision

**PlacePrep AI** is not just an application; it is an intelligent forge for tomorrow's professionals. Designed as a secure institutional gateway, it strips away the noise of placement preparation and replaces it with clarity, actionable AI feedback, and a premium user experience. 

It acts as your personal mentor, a rigorous interviewer, and an ATS-savvy resume critic—all wrapped in a stunning glassmorphism interface that feels alive.

<br>

---

## 🔮 Core Capabilities

### 🛡️ <kbd>The Gateway</kbd> *(Authentication)*
Security meets simplicity. PlacePrep AI employs a robust, decoupled JWT authentication architecture that gracefully verifies users while keeping sensitive institutional records completely isolated. 

### 📄 <kbd>The Forge</kbd> *(ATS Analyzer)*
Throw your resume into the forge. Our AI engine parses every line, scoring it against modern Applicant Tracking Systems. It doesn't just grade you—it guides you with section-by-section critiques, keyword optimization, and formatting secrets.

### 🎭 <kbd>The Crucible</kbd> *(Mock Interviews)*
Step into the simulation. Whether you're facing a grueling Technical round or a behavioral HR interview, our AI analyzes your performance in real-time. It evaluates:
- 💡 **Sentiment:** *Are you projecting confidence or hesitation?*
- 🎯 **Clarity:** *Is your logic sound and easy to follow?*
- ⚡ **Confidence:** *Do you believe in your own answers?*

### 📈 <kbd>The Oracle</kbd> *(Performance Analytics)*
Data is your greatest asset. Track your evolution through beautifully rendered charts. Watch your ATS scores climb and your interview clarity improve as you iterate on your preparation.

### 🎨 <kbd>The Aesthetic</kbd> *(Premium UI/UX)*
Preparation shouldn't feel like a chore. Built with fluid micro-animations and an elegant glassmorphism design system, the interface is visually striking. Fully responsive, with a seamless Light & Dark mode transition for those late-night grind sessions.

<br>

---

## 🛠️ The Architecture

<div align="center">

### 🎨 Frontend Canvas
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

Crafted with React and Vite for blazing-fast performance. Styled with custom CSS and Tailwind to achieve that signature frosted-glass look.

<br>

### ⚙️ Backend Engine
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

Powered by Python and FastAPI. The database relies on async SQLite (via `aiosqlite`) and SQLAlchemy, ensuring lightning-fast queries and strict separation of user profiles from read-only institutional data.

</div>

<br>

---

## 🚀 Summoning the Project

### I. The Codebase
Clone the repository and step into the workspace:
```bash
git clone https://github.com/surajyadav04/placeprep-ai.git
cd placeprep-ai
```

### II. Awakening the Backend
```bash
cd backend
python -m venv .venv

# Activate the virtual environment
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies and ignite the server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
> **Note:** The backend will autonomously forge a clean SQLite database upon its first breath.

### III. Illuminating the Frontend
```bash
cd frontend
npm install

# Launch the visual interface
npm run dev
```

### IV. The Gateway
Open your browser and navigate to `http://localhost:5173` to step inside.

<br>

---

<div align="center">
  <p><i>Crafted for the next generation of engineers and visionaries. 🚀</i></p>
</div>
