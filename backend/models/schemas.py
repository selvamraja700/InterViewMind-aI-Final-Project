from typing import Optional, Dict, Any, List
from pydantic import BaseModel


# ── Session ───────────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    problem_text: str
    user_name: Optional[str] = None


class ParsedProblem(BaseModel):
    title: str
    difficulty: str
    topic: str
    statement: str
    constraints: List[str]
    examples: List[Dict[str, Any]]


class CreateSessionResponse(BaseModel):
    session_id: str
    problem: ParsedProblem


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    user_message: str
    current_code: Optional[str] = None
    problem_text: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


# ── Screen Analysis ───────────────────────────────────────────────────────────

class ScreenAnalysisRequest(BaseModel):
    session_id: str
    image_base64: str


class ScreenAnalysisResponse(BaseModel):
    response: str


# ── Code Execution ────────────────────────────────────────────────────────────

class CodeRunRequest(BaseModel):
    code: str
    language: str
    stdin: Optional[str] = ""


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    time_ms: int


# ── Review ────────────────────────────────────────────────────────────────────

class CategoryScores(BaseModel):
    problem_solving: int
    communication: int
    code_quality: int
    optimization: int
    edge_cases: int


class ReviewData(BaseModel):
    category_scores: CategoryScores
    overall_score: int
    strongest: str
    weakest: str
    feedback: str


class EndInterviewResponse(BaseModel):
    review: ReviewData
