from fastapi import APIRouter, HTTPException
from models.schemas import CodeRunRequest, CodeRunResponse
from services import glot_service

router = APIRouter()

@router.post("/run", response_model=CodeRunResponse)
async def run_code(request: CodeRunRequest):
    try:
        result = await glot_service.execute_code(
            code=request.code,
            language=request.language,
            stdin=request.stdin
        )
        return CodeRunResponse(
            stdout=result["stdout"],
            stderr=result["stderr"],
            exit_code=result["exit_code"],
            time_ms=result["time_ms"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution service error: {str(e)}")
