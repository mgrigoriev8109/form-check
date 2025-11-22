from fastapi import APIRouter, HTTPException
from app.models.schemas import FormAnalysisRequest, FormAnalysisResponse
from app.services.claude_service import get_claude_service
from datetime import datetime

router = APIRouter(
    prefix="/api",
    tags=["form-analysis"]
)


@router.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(request: FormAnalysisRequest):
    """
    Analyze workout form from video frames using Claude AI

    Args:
        request: FormAnalysisRequest containing frames and exercise type

    Returns:
        FormAnalysisResponse with analysis results

    Raises:
        HTTPException: If analysis fails
    """
    try:
        # Get Claude service instance
        claude_service = get_claude_service()

        # Perform analysis (async)
        analysis = await claude_service.analyze_form(
            frames=request.frames,
            exercise_type=request.exerciseType
        )

        # Return response
        return FormAnalysisResponse(
            analysis=analysis,
            timestamp=datetime.utcnow(),
            exerciseType=request.exerciseType
        )

    except ValueError as e:
        # API key not configured
        raise HTTPException(
            status_code=500,
            detail=f"Service configuration error: {str(e)}"
        )
    except Exception as e:
        # Other errors during analysis
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze form: {str(e)}"
        )
