<div align="center">

<img src="frontend/public/icons.svg" alt="PlacePrep AI Logo" width="120" height="120">

# ✨ PlacePrep AI ✨

*Where institutional clarity meets artificial intelligence.*

**[ Features ]** • **[ Tech Stack ]** • **[ Installation ]** • **[ Architecture ]**

<br>

> *“Elevating the placement journey from an opaque process to a precise science.”*

</div>

---

## 🌌 The Vision

**PlacePrep AI** is not just an application; it is an intelligent forge for tomorrow's professionals. Designed as a secure institutional gateway, it strips away the noise of placement preparation and replaces it with clarity, actionable AI feedback, and a premium user experience. 

It acts as a personal mentor, a rigorous interviewer, and an ATS-savvy resume critic—all wrapped in a stunning glassmorphism interface.

---

## 🔮 Core Capabilities

### 🛡️ The Gateway (Authentication)
Security meets simplicity. PlacePrep AI employs a robust, decoupled JWT authentication architecture that gracefully verifies users while keeping sensitive institutional records completely isolated. 

### 📄 The Resume Forge (ATS Analyzer)
Throw your resume into the forge. Our AI engine parses every line, scoring it against modern Applicant Tracking Systems. It doesn't just grade you—it guides you with section-by-section critiques, keyword optimization, and formatting secrets.

### 🎭 The Crucible (Mock Interviews)
Step into the simulation. Whether you're facing a grueling Technical round or a behavioral HR interview, our AI analyzes your performance in real-time. It evaluates:
- **Sentiment:** *Are you projecting confidence or hesitation?*
- **Clarity:** *Is your logic sound and easy to follow?*
- **Confidence:** *Do you believe in your own answers?*

### 📈 The Oracle (Performance Analytics)
Data is your greatest asset. Track your evolution through beautifully rendered charts. Watch your ATS scores climb and your interview clarity improve as you iterate on your preparation.

### 🎨 The Aesthetic (Premium UI/UX)
Preparation shouldn't feel like a chore. Built with fluid micro-animations (Framer Motion) and an elegant glassmorphism design system, the interface feels alive. Fully responsive, with a seamless Light & Dark mode transition for late-night grind sessions.

---

## 🛠️ The Architecture

<div align="center">
  <code>React.js</code> • <code>Vite</code> • <code>TailwindCSS</code> • <code>FastAPI</code> • <code>SQLite</code> • <code>Python</code>
</div>

<br>

**Frontend Canvas:** 
Crafted with React and Vite for blazing-fast performance. Styled with custom CSS and Tailwind to achieve that signature frosted-glass look.

**Backend Engine:**
Powered by Python and FastAPI. The database relies on async SQLite (via `aiosqlite`) and SQLAlchemy, ensuring lightning-fast queries and strict separation of user profiles from read-only institutional data.

---

## 🚀 Summoning the Project (Installation)

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
*(The backend will autonomously forge a clean SQLite database upon its first breath.)*

### III. Illuminating the Frontend
```bash
cd frontend
npm install

# Launch the visual interface
npm run dev
```

### IV. The Gateway
Open your browser and navigate to `http://localhost:5173` to step inside.

---

<div align="center">
  <p><i>Crafted for the next generation of engineers and visionaries.</i></p>
</div>
