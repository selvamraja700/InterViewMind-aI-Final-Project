import asyncio
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from models.schemas import (
    CreateSessionRequest,
    CreateSessionResponse,
    ParsedProblem,
    EndInterviewResponse,
    ReviewData,
    CategoryScores
)
from database import queries
from services import gemini_service, memory_service

router = APIRouter()

# ── Helpers for request/response schemas ──────────────────────────────────────

class TabSwitchRequest(BaseModel):
    count: int
    cheating_detected: bool

class ScreenShareRequest(BaseModel):
    count: int


# ── Create Session Route ──────────────────────────────────────────────────────
@router.post("/session", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    try:
        session_id = f"session_{uuid.uuid4().hex[:12]}"
        
        # Parse the problem statement via LLM
        parsed = await gemini_service.parse_problem(request.problem_text)
        
        # Insert session into PostgreSQL database
        await queries.create_session(
            session_id=session_id,
            problem_text=request.problem_text,
            user_name=request.user_name,
            parsed_problem=parsed
        )

        parsed_problem = ParsedProblem(
            title=parsed.get("title", "Problem Statement"),
            difficulty=parsed.get("difficulty", "Medium"),
            topic=parsed.get("topic", "General"),
            statement=parsed.get("statement", request.problem_text),
            constraints=parsed.get("constraints", []),
            examples=parsed.get("examples", [])
        )

        return CreateSessionResponse(
            session_id=session_id,
            problem=parsed_problem
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


# ── Server-Sent Events (SSE) preparation ──────────────────────────────────────
@router.get("/prepare/{session_id}")
async def prepare_interview(session_id: str):
    # Check if session exists first
    session = await queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        steps = [
            "problem_loaded",
            "constraints_analyzed",
            "brute_force_mapped",
            "hints_prepared",
            "evaluation_ready"
        ]

        # Let the frontend know preparation has started
        yield {"event": "ping", "data": "start"}
        await asyncio.sleep(0.5)

        for step in steps:
            # Yield step as SSE event name
            yield {"event": step, "data": step}
            await asyncio.sleep(0.8)

        # Final message to transition candidate to interview room
        yield {"event": "ready", "data": "ready"}

    return EventSourceResponse(event_generator())


# ── Tab Switch / Cheating Update ──────────────────────────────────────────────
@router.post("/tab-switch/{session_id}")
async def tab_switch(session_id: str, payload: TabSwitchRequest):
    session = await queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await queries.update_tab_switch_count(
        session_id=session_id,
        count=payload.count,
        cheating_detected=payload.cheating_detected
    )
    return {"status": "ok"}


# ── Screen Share Increment ────────────────────────────────────────────────────
@router.post("/screen-share/{session_id}")
async def screen_share(session_id: str, payload: ScreenShareRequest):
    session = await queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await queries.update_screen_share_count(
        session_id=session_id,
        count=payload.count
    )
    return {"status": "ok"}


# ── End Interview & Review Generation ─────────────────────────────────────────
@router.post("/end/{session_id}", response_model=EndInterviewResponse)
async def end_interview(session_id: str):
    session = await queries.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # Retrieve full conversation history
        history = await memory_service.get_formatted_history(session_id)

        # Generate review report via LLM
        review_data = await gemini_service.generate_review(
            session_id=session_id,
            problem_text=session["problem_text"],
            conversation_history=history,
            cheating_detected=session["cheating_detected"],
            tab_switch_count=session["tab_switch_count"],
            screen_share_count=session["screen_share_count"]
        )

        # Save generated review to database
        await queries.save_review(session_id, review_data)

        # Build schema Response
        scores = CategoryScores(
            problem_solving=review_data["category_scores"]["problem_solving"],
            communication=review_data["category_scores"]["communication"],
            code_quality=review_data["category_scores"]["code_quality"],
            optimization=review_data["category_scores"]["optimization"],
            edge_cases=review_data["category_scores"]["edge_cases"]
        )

        review = ReviewData(
            category_scores=scores,
            overall_score=review_data["overall_score"],
            strongest=review_data["strongest"],
            weakest=review_data["weakest"],
            feedback=review_data["feedback"]
        )

        return EndInterviewResponse(review=review)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate review report: {str(e)}")
