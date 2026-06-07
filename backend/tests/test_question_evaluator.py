import pytest
from unittest.mock import MagicMock, patch


# ── Helper ────────────────────────────────────────────────────────────────────

def make_parsed(status: str, **overrides):
    """Build a realistic parsed dict for tests."""
    base = {
        "status": status,
        "reason": "",
        "title": "Two Sum",
        "difficulty": "Easy",
        "topic": "Arrays, Hash Map",
        "statement": "Given an array of integers, return indices of two numbers that add up to target.",
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        "examples": [{"input": "nums=[2,7,11,15], target=9", "output": "[0,1]"}],
    }
    base.update(overrides)
    return base


# ── Import target AFTER helpers so patch path is resolved correctly ───────────
from services.question_evaluator import evaluate_question


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_valid_problem_passes():
    """A fully valid question must pass through unchanged."""
    parsed = make_parsed("valid")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        result = evaluate_question("Two sum problem...")
        assert result == parsed


def test_junk_text_raises_value_error():
    """Completely invalid input (junk/gibberish) must raise ValueError with HTTP 400 reason."""
    parsed = make_parsed("invalid", reason="Not a coding problem.")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        with pytest.raises(ValueError) as exc:
            evaluate_question("hai bro")
        assert "Not a coding problem" in str(exc.value)


def test_repaired_problem_passes_with_log(capsys):
    """Partial question must be auto-repaired by LLM and returned (not blocked)."""
    parsed = make_parsed("repaired", title="Two Sum (repaired)")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        result = evaluate_question("find two numbers that add to target")
        assert result["status"] == "repaired"
        assert result["title"] == "Two Sum (repaired)"
        # Confirm repair was logged
        captured = capsys.readouterr()
        assert "auto-repaired by LLM" in captured.out


def test_unknown_status_raises_value_error():
    """Any unexpected LLM status must raise ValueError — never reach interview room."""
    parsed = make_parsed("unknown_garbage_status")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        with pytest.raises(ValueError):
            evaluate_question("some text")


def test_invalid_reason_used_in_error_message():
    """The reason from LLM must appear in the raised ValueError."""
    parsed = make_parsed("invalid", reason="Input appears to be a greeting, not a problem.")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        with pytest.raises(ValueError) as exc:
            evaluate_question("hello there")
        assert "greeting" in str(exc.value)


def test_invalid_no_reason_uses_fallback_message():
    """If LLM returns invalid with no reason, a safe fallback message is used."""
    parsed = make_parsed("invalid", reason="")
    with patch(
        "services.question_evaluator.gemini_service.parse_problem",
        MagicMock(return_value=parsed),
    ):
        with pytest.raises(ValueError) as exc:
            evaluate_question("asdkjhaskdjh")
        assert str(exc.value)  # must not be empty
