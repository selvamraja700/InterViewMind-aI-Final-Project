# InterViewMind AI 🚀

An advanced, AI-powered platform designed to simulate real-world technical interviews. It provides a comprehensive coding environment, a conversational AI interviewer ("Jake"), and advanced proctoring/anti-cheating mechanisms to deliver an authentic technical interview experience.

---

## 🌟 Key Features

1. **Interactive AI Interviewer (Jake)**: Powered by Google Gemini. Jake conducts the interview, asks Socratic questions, provides hints only when requested, and analyzes user responses naturally.
2. **In-Browser IDE**: A rich coding environment using Monaco Editor. Candidates can write, test, and execute code in real-time.
3. **Advanced Proctoring System**:
   - **Tab Switching Detection**: Flags potential cheating if the user navigates away from the interview tab.
   - **Screen Share Analysis**: Uses Gemini Vision to analyze shared screens for unauthorized resources.
4. **Comprehensive Code Execution**: Secure execution of candidate code directly from the browser, displaying standard output and errors.
5. **Detailed Final Evaluation**: At the end of the session, the AI generates a detailed review scoring the candidate on Problem Solving, Communication, Code Quality, Optimization, and Edge Cases.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a full-stack web application with a separated frontend and backend.

### **Frontend (React)**
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand / React Context
- **Routing**: React Router DOM
- **Code Editor**: `@monaco-editor/react`

### **Backend (Python / Flask)**
- **Framework**: Flask (Python 3.9+)
- **Database**: MySQL (`mysql-connector-python`)
- **AI Integration**: Google Gemini API (via `gemini-2.0-flash-lite`), Groq API fallback.
- **Code Execution**: Custom integration via `glot_service.py`

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- MySQL Server

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment Setup
cp .env.example .env
# Open .env and add your GEMINI_API_KEY, GROQ_API_KEY, and MySQL credentials.

# Run the server
python main.py
```

### 2. Frontend Setup
```bash
# Navigate to project root
npm install

# Start the development server
npm run dev
```

---

## 📂 Detailed File Structure

### **Backend (`backend/`)**
- `main.py`: The central Flask server defining all HTTP endpoints (`/interview/session`, `/ai/chat`, `/code/run`).
- `services/gemini_service.py`: Core logic for the AI Interviewer. Uses Gemini and Groq to parse problems, conduct chats, and analyze screenshots.
- `services/glot_service.py`: Handles code compilation and execution securely.
- `database/queries.py`: Manages all MySQL operations (storing sessions, messages, and evaluations).

### **Frontend (`src/`)**
- `pages/InterviewPage.jsx`: The core workspace combining the problem description, chat window, and code editor into a resizable split-pane layout.
- `hooks/useVoice.js`: Integrates the Web Speech API for voice interactions with the AI.
- `hooks/useTabGuard.js`: Implements page visibility checks to catch tab-switching (cheating).
- `services/api.js`: Handles all HTTP communication with the Flask backend.
- `components/interview/JakePanel.jsx`: Renders the AI Avatar and voice visualizations.

---

## 🗄️ Database Schema
- **Sessions**: Tracks the `session_id`, `problem_text`, candidate name, and proctoring stats (`tab_switch_count`).
- **Messages**: Stores the conversation history and snapshots of the candidate's code at the time of each message.
- **Reviews**: Stores the final AI-generated feedback and evaluation metrics.

---

## 📦 Stable Release (v1.0.0)

The v1.0.0 Stable Release snapshot is available in this repository. 
You can view the full release notes and stable version data in the `RELEASE_NOTES.md` file located in the root directory.
