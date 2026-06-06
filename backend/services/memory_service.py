from typing import List, Dict, Any
from database.queries import get_messages

async def get_formatted_history(session_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves history of conversation for session_id and formats it 
    as a list of dictionaries with 'sender', 'message_text', and 'code_context'.
    """
    messages = await get_messages(session_id)
    formatted = []
    for msg in messages:
        formatted.append({
            "sender": msg["sender"],
            "message_text": msg["message_text"],
            "code_context": msg.get("code_context")
        })
    return formatted
