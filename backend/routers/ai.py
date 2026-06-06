from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse, ScreenAnalysisRequest, ScreenAnalysisResponse
from database import queries
from services import gemini_service, memory_service

router = APIRouter()

# ── Chat Route ────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = await queries.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # 1. Fetch conversation history prior to new message
        history = await memory_service.get_formatted_history(request.session_id)

        # 2. Add Candidate's message and current code state to database
        await queries.add_message(
            session_id=request.session_id,
            sender="user",
            message_text=request.user_message,
            code_context=request.current_code
        )

        # 3. Call Gemini/Groq service to get Jake's response
        jake_response = await gemini_service.chat_with_jake(
            session_id=request.session_id,
            user_message=request.user_message,
            current_code=request.current_code,
            problem_text=session["problem_text"],
            conversation_history=history
        )

        # 4. Save Jake's response to the database
        await queries.add_message(
            session_id=request.session_id,
            sender="ai",
            message_text=jake_response
        )

        return ChatResponse(
            response=jake_response,
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat communication: {str(e)}")


# ── Screen Analysis Route ─────────────────────────────────────────────────────
@router.post("/analyze-screen", response_model=ScreenAnalysisResponse)
async def analyze_screen(request: ScreenAnalysisRequest):
    session = await queries.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # Retrieve recent messages to give Jake dialog context of the screen image
        history = await memory_service.get_formatted_history(request.session_id)

        # Get the latest code context if any exists in conversation history
        current_code = None
        for msg in reversed(history):
            if msg.get("code_context"):
                current_code = msg["code_context"]
                break

        # Send to multimodal analysis service
        jake_analysis = await gemini_service.analyze_screenshot(
            session_id=request.session_id,
            image_base64=request.image_base64,
            problem_text=session["problem_text"],
            current_code=current_code,
            conversation_history=history
        )

        # Save Jake's screen feedback as an AI comment in transcript database
        await queries.add_message(
            session_id=request.session_id,
            sender="ai",
            message_text=jake_analysis
        )

        return ScreenAnalysisResponse(
            response=jake_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in screen analysis: {str(e)}")
