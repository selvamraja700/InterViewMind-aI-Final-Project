import json
from typing import Dict, Any, List, Optional
from datetime import datetime

_sessions = {}
_messages = []

def create_tables_if_not_exist():
    pass

def create_session(session_id: str, problem_text: str, user_name: Optional[str], parsed_problem: Dict[str, Any]) -> None:
    _sessions[session_id] = {
        "session_id": session_id,
        "problem_text": problem_text,
        "user_name": user_name,
        "parsed_problem": parsed_problem,
        "cheating_detected": False,
        "tab_switch_count": 0,
        "screen_share_count": 0,
        "review": None,
        "created_at": datetime.now()
    }

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return _sessions.get(session_id)

def add_message(session_id: str, sender: str, message_text: str, code_context: Optional[str] = None) -> None:
    _messages.append({
        "session_id": session_id,
        "sender": sender,
        "message_text": message_text,
        "code_context": code_context,
        "created_at": datetime.now()
    })

def get_messages(session_id: str) -> List[Dict[str, Any]]:
    return [m for m in _messages if m["session_id"] == session_id]

def update_tab_switch_count(session_id: str, count: int, cheating_detected: bool) -> None:
    if session_id in _sessions:
        _sessions[session_id]["tab_switch_count"] = count
        _sessions[session_id]["cheating_detected"] = cheating_detected

def update_screen_share_count(session_id: str, count: int) -> None:
    if session_id in _sessions:
        _sessions[session_id]["screen_share_count"] = count

def save_review(session_id: str, review: Dict[str, Any]) -> None:
    if session_id in _sessions:
        _sessions[session_id]["review"] = review
