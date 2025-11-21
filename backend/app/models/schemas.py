from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class FormAnalysisRequest(BaseModel):
    """Request model for form analysis endpoint"""
    frames: List[str] = Field(..., description="List of base64 encoded video frames")
    exerciseType: str = Field(..., description="Type of exercise (e.g., 'squat', 'deadlift', 'bench press')")


class FormAnalysisData(BaseModel):
    """Structured analysis data from Claude"""
    keyObservations: List[str] = Field(
        ..., description="Specific observations about movement points"
    )
    safetyConcerns: List[str] = Field(
        default_factory=list, description="Safety concerns identified, empty if none"
    )
    recommendations: List[str] = Field(
        ..., description="Concrete recommendations for improvement"
    )


class FormAnalysisResponse(BaseModel):
    """Response model for form analysis endpoint"""
    analysis: FormAnalysisData = Field(..., description="Structured form analysis from Claude")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Analysis timestamp")
    exerciseType: str = Field(..., description="Type of exercise analyzed")

    class Config:
        json_schema_extra = {
            "example": {
                "analysis": {
                    "keyObservations": [
                        "Good depth achieved in the bottom position",
                        "Knees track slightly inward during ascent"
                    ],
                    "safetyConcerns": ["Lower back rounding at bottom of squat"],
                    "recommendations": [
                        "Focus on engaging core before descent",
                        "Practice hip mobility drills"
                    ],
                },
                "timestamp": "2025-11-20T10:30:00Z",
                "exerciseType": "squat"
            }
        }
