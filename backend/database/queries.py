import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from database.connection import get_connection

def create_tables_if_not_exist():
    conn = get_connection()
    if not conn:
        print("Failed to get DB connection for creating tables.")
        return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                problem_text TEXT,
                user_name VARCHAR(255),
                parsed_problem JSON,
                cheating_detected BOOLEAN DEFAULT FALSE,
                tab_switch_count INT DEFAULT 0,
                screen_share_count INT DEFAULT 0,
                review JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(255),
                sender VARCHAR(50),
                message_text TEXT,
                code_context TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"Error creating tables: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def create_session(session_id: str, problem_text: str, user_name: Optional[str], parsed_problem: Dict[str, Any]) -> None:
    conn = get_connection()
    if not conn: return
    try:
        cursor = conn.cursor()
        parsed_problem_json = json.dumps(parsed_problem) if parsed_problem else None
        cursor.execute("""
            INSERT INTO sessions (session_id, problem_text, user_name, parsed_problem)
            VALUES (%s, %s, %s, %s)
        """, (session_id, problem_text, user_name, parsed_problem_json))
        conn.commit()
    except Exception as e:
        print(f"Error creating session: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    if not conn: return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sessions WHERE session_id = %s", (session_id,))
        row = cursor.fetchone()
        if row:
            if row.get("parsed_problem") and isinstance(row["parsed_problem"], str):
                row["parsed_problem"] = json.loads(row["parsed_problem"])
            elif row.get("parsed_problem") and isinstance(row["parsed_problem"], dict):
                pass
                
            if row.get("review") and isinstance(row["review"], str):
                row["review"] = json.loads(row["review"])
            elif row.get("review") and isinstance(row["review"], dict):
                pass
                
            row["cheating_detected"] = bool(row.get("cheating_detected"))
        return row
    except Exception as e:
        print(f"Error getting session: {e}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def add_message(session_id: str, sender: str, message_text: str, code_context: Optional[str] = None) -> None:
    conn = get_connection()
    if not conn: return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO messages (session_id, sender, message_text, code_context)
            VALUES (%s, %s, %s, %s)
        """, (session_id, sender, message_text, code_context))
        conn.commit()
    except Exception as e:
        print(f"Error adding message: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_messages(session_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM messages WHERE session_id = %s ORDER BY created_at ASC", (session_id,))
        return cursor.fetchall()
    except Exception as e:
        print(f"Error getting messages: {e}")
        return []
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def update_tab_switch_count(session_id: str, count: int, cheating_detected: bool) -> None:
    conn = get_connection()
    if not conn: return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sessions 
            SET tab_switch_count = %s, cheating_detected = %s
            WHERE session_id = %s
        """, (count, cheating_detected, session_id))
        conn.commit()
    except Exception as e:
        print(f"Error updating tab switch: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def update_screen_share_count(session_id: str, count: int) -> None:
    conn = get_connection()
    if not conn: return
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sessions 
            SET screen_share_count = %s
            WHERE session_id = %s
        """, (count, session_id))
        conn.commit()
    except Exception as e:
        print(f"Error updating screen share: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def save_review(session_id: str, review: Dict[str, Any]) -> None:
    conn = get_connection()
    if not conn: return
    try:
        cursor = conn.cursor()
        review_json = json.dumps(review) if review else None
        cursor.execute("""
            UPDATE sessions 
            SET review = %s
            WHERE session_id = %s
        """, (review_json, session_id))
        conn.commit()
    except Exception as e:
        print(f"Error saving review: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
