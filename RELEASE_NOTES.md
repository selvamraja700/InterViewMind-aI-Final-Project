# Release Notes

## 🚀 v1.0.0 Stable Release

This is the first complete, stable release of the **InterViewMind AI** project. This platform provides a comprehensive coding environment and a conversational AI interviewer designed to simulate real-world technical interviews.

### 🌟 Key Features in this Release:
- **Interactive AI Interviewer (Jake)**: Integrated with Google Gemini 2.0 to provide Socratic guidance and hints during the interview.
- **In-Browser IDE**: Fully functional code editor powered by Monaco Editor.
- **Code Execution Engine**: Safely compiles and executes candidate code directly from the browser.
- **Advanced Proctoring System**: 
  - Tracks and flags tab-switching to detect cheating.
  - Analyzes shared screens using Gemini Vision to evaluate unauthorized resources.
- **Comprehensive Evaluation**: Generates a detailed feedback report automatically at the end of the session, scoring the candidate on Problem Solving, Communication, Code Quality, Optimization, and Edge Cases.

### 🏗️ Architecture Snapshot:
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand.
- **Backend**: Python 3.9+, Flask, MySQL.
- **AI Integration**: Google Gemini API, Groq.

*To view the complete setup instructions and project architecture, see the `README.md`.*
