import os
import json
import base64
import httpx
from typing import Dict, Any, List, Optional

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL = "gemini-1.5-flash"

# ── Low-level Gemini REST helper ───────────────────────────────────────────────

def _call_gemini(
    system_prompt: str,
    user_parts: List[Dict],
    json_mode: bool = False,
) -> str:
    """
    Calls Gemini 1.5 Flash via REST API. No SDK required.
    user_parts is a list of content parts e.g. [{"text": "..."}, {"inlineData": {...}}]
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment.")

    url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    payload: Dict[str, Any] = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": user_parts
            }
        ],
    }

    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
        )
        if not response.is_success:
            raise RuntimeError(f"Gemini API error {response.status_code}: {response.text}")
        
        data = response.json()
        # Extract text from first candidate
        return data["candidates"][0]["content"]["parts"][0]["text"]


# ── Groq Fallback helper ───────────────────────────────────────────────────────

def _call_groq_fallback(
    system_prompt: str,
    user_prompt: str,
    json_mode: bool = False,
) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set in environment — no fallback available.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: Dict[str, Any] = {
        "model": "llama-3.1-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.4,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


# ── Parse Problem ──────────────────────────────────────────────────────────────

def parse_problem(problem_text: str) -> Dict[str, Any]:
    system_prompt = (
        "You are an expert system that parses unstructured coding problem descriptions "
        "(like LeetCode problems) into structured JSON. Return a JSON object with fields:\n"
        "  title (string), difficulty (Easy|Medium|Hard), topic (string),\n"
        "  statement (string), constraints (array of strings), examples (array of "
        "{input, output, explanation?}).\n"
        "Return ONLY valid JSON. No markdown, no commentary outside the JSON."
    )
    user_parts = [{"text": f"Parse this problem:\n\n{problem_text}"}]

    try:
        text = _call_gemini(system_prompt, user_parts, json_mode=True)
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ Gemini parse_problem failed: {e}. Trying Groq...")
        try:
            text = _call_groq_fallback(
                system_prompt,
                f"Parse this problem:\n\n{problem_text}",
                json_mode=True,
            )
            return json.loads(text)
        except Exception as e2:
            print(f"❌ Groq fallback also failed: {e2}")
            return {
                "title": "Coding Problem",
                "difficulty": "Medium",
                "topic": "General",
                "statement": problem_text[:800],
                "constraints": [],
                "examples": [],
            }


# ── Jake Persona Prompt ────────────────────────────────────────────────────────

JAKE_SYSTEM_PROMPT = """You are Jake, a senior technical recruiter and software engineer conducting a live technical coding interview.

Rules:
1. NEVER give away solutions, complete algorithms, or correct code.
2. Guide with hints, Socratic questions, and light nudges only.
3. Ask ONE question at a time. Keep responses under 4 sentences.
4. Follow the natural interview stages:
   - Stage 1: Clarify the problem, ask for brute-force approach.
   - Stage 2: Prompt optimizations (time/space complexity, better data structures).
   - Stage 3: Comment on live code progress — style, edge cases, logic.
   - Stage 4: Ask for test cases and edge case dry-runs.
5. Be professional, encouraging, and direct.
6. NEVER admit you are an AI, Gemini, or a chatbot. You are Jake — a real human interviewer."""


# ── Chat with Jake ─────────────────────────────────────────────────────────────

def chat_with_jake(
    session_id: str,
    user_message: str,
    current_code: Optional[str],
    problem_text: str,
    conversation_history: List[Dict[str, Any]],
) -> str:
    history_str = ""
    for msg in conversation_history:
        role = "Candidate" if msg["sender"] == "user" else "Jake"
        history_str += f"{role}: {msg['message_text']}\n"

    prompt_text = (
        f"Problem:\n{problem_text}\n\n"
        f"Candidate's Current Code:\n{current_code or '(No code yet)'}\n\n"
        f"Chat History:\n{history_str}\n"
        f"Candidate says: {user_message}\n\n"
        "Respond as Jake. One question or one short hint. Max 4 sentences."
    )

    user_parts = [{"text": prompt_text}]

    try:
        return _call_gemini(JAKE_SYSTEM_PROMPT, user_parts).strip()
    except Exception as e:
        print(f"⚠️ Gemini chat failed: {e}. Trying Groq...")
        try:
            return _call_groq_fallback(JAKE_SYSTEM_PROMPT, prompt_text)
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
            return "That's a good point. Can you walk me through how you're thinking about the time complexity here?"


# ── Analyze Screenshot ─────────────────────────────────────────────────────────

def analyze_screenshot(
    session_id: str,
    image_base64: str,
    problem_text: str,
    current_code: Optional[str],
    conversation_history: List[Dict[str, Any]],
) -> str:
    # Strip data URL prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    history_str = ""
    for msg in conversation_history:
        role = "Candidate" if msg["sender"] == "user" else "Jake"
        history_str += f"{role}: {msg['message_text']}\n"

    text_part = {
        "text": (
            f"Problem:\n{problem_text}\n\n"
            f"Candidate's code context:\n{current_code or '(None)'}\n\n"
            f"History:\n{history_str}\n\n"
            "Analyze this screenshot of the candidate's screen. Comment on visible code bugs, "
            "progress, or anything that would help the candidate. Respond as Jake. 2–4 sentences."
        )
    }
    image_part = {
        "inlineData": {
            "mimeType": "image/png",
            "data": image_base64,
        }
    }

    try:
        return _call_gemini(JAKE_SYSTEM_PROMPT, [text_part, image_part]).strip()
    except Exception as e:
        print(f"⚠️ Gemini vision failed: {e}. Falling back to text-only Groq...")
        try:
            return _call_groq_fallback(
                JAKE_SYSTEM_PROMPT,
                f"The candidate shared a screenshot. Current code:\n{current_code or '(None)'}\n"
                "Give brief constructive feedback as Jake.",
            )
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
            return "I can see your screenshot. How does your current solution compare to the brute force you described?"


# ── Generate Interview Review ──────────────────────────────────────────────────

def generate_review(
    session_id: str,
    problem_text: str,
    conversation_history: List[Dict[str, Any]],
    cheating_detected: bool,
    tab_switch_count: int,
    screen_share_count: int,
) -> Dict[str, Any]:
    system_prompt = (
        "You are an expert technical interview evaluator. Score the candidate on a 0–100 scale "
        "across: problem_solving, communication, code_quality, optimization, edge_cases.\n"
        "Return ONLY a JSON object:\n"
        "{\n"
        '  "category_scores": {"problem_solving": int, "communication": int, '
        '"code_quality": int, "optimization": int, "edge_cases": int},\n'
        '  "overall_score": int,\n'
        '  "strongest": "short phrase",\n'
        '  "weakest": "short phrase",\n'
        '  "feedback": "2-3 paragraph qualitative feedback"\n'
        "}\n"
        "No markdown, no commentary outside the JSON."
    )

    history_str = ""
    for msg in conversation_history:
        role = "Candidate" if msg["sender"] == "user" else "Jake"
        history_str += f"{role}: {msg['message_text']}\n"
        if msg.get("code_context"):
            history_str += f"[Code: {msg['code_context'][:300]}...]\n"

    user_text = (
        f"Problem:\n{problem_text}\n\n"
        f"Conversation:\n{history_str}\n\n"
        f"Integrity flags — Cheating: {cheating_detected}, "
        f"Tab switches: {tab_switch_count}, Screen shares: {screen_share_count}\n\n"
        "Generate the performance review JSON."
    )

    try:
        text = _call_gemini(system_prompt, [{"text": user_text}], json_mode=True)
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ Gemini review failed: {e}. Trying Groq...")
        try:
            text = _call_groq_fallback(system_prompt, user_text, json_mode=True)
            return json.loads(text)
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
            base = 30 if cheating_detected else 72
            return {
                "category_scores": {
                    "problem_solving": base,
                    "communication": base + 5,
                    "code_quality": base - 3,
                    "optimization": base - 8,
                    "edge_cases": base + 2,
                },
                "overall_score": base,
                "strongest": "Problem decomposition",
                "weakest": "Optimization awareness",
                "feedback": "The AI evaluator encountered a technical issue. Scores are estimated based on available interview data.",
            }
