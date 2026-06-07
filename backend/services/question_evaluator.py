from services import gemini_service


def evaluate_question(problem_text: str) -> dict:
    """
    Validates a coding problem using the LLM as gatekeeper.

    Three outcomes from the LLM:
      - "invalid"  → junk / not a coding question → raises ValueError with reason
      - "repaired" → partial question, LLM auto-filled gaps → returns repaired dict
      - "valid"    → complete question → returns as-is

    NOTE: This is a plain sync function — the backend is Flask, not FastAPI.
          Raises ValueError on invalid input so Flask routes can return HTTP 400.
    """
    parsed = gemini_service.parse_problem(problem_text)

    status = parsed.get("status")

    if status == "invalid":
        reason = parsed.get("reason") or "Input is not a valid coding problem."
        raise ValueError(reason)

    elif status == "repaired":
        print(
            f"[QuestionEvaluator] auto-repaired by LLM: "
            f"'{parsed.get('title', '<no title>')}'"
        )
        return parsed

    elif status == "valid":
        return parsed

    else:
        # Unexpected status — never let it through to the interview room
        raise ValueError(
            "Unable to determine problem validity. Please paste a proper coding question."
        )
