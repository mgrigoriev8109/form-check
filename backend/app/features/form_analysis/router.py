from fastapi import APIRouter, HTTPException
from app.features.form_analysis.schemas import FormAnalysisRequest, FormAnalysisResponse
from app.shared.claude_client import get_claude_service
from datetime import datetime

router = APIRouter(
    prefix="/api",
    tags=["form-analysis"]
)


@router.post("/analyze-form", response_model=FormAnalysisResponse)
async def analyze_form(request: FormAnalysisRequest) -> FormAnalysisResponse:
    """
    Analyze workout form from biomechanics data using Claude AI

    Args:
        request: FormAnalysisRequest containing biomechanics data from pose detection

    Returns:
        FormAnalysisResponse with analysis results

    Raises:
        HTTPException: If analysis fails
    """
    try:
        # Get Claude service instance
        claude_service = get_claude_service()

        # Convert Pydantic model to dictionary for analysis
        biomechanics_data = request.model_dump()

        # Perform analysis (async)
        analysis = await claude_service.analyze_form(biomechanics_data)

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
