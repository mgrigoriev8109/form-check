from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class FormAnalysisRequest(BaseModel):
    """Request model for form analysis endpoint"""
    frames: List[str] = Field(..., description="List of base64 encoded video frames")
    exerciseType: str = Field(..., description="Type of exercise (e.g., 'squat', 'deadlift', 'bench press')")


class FormAnalysisResponse(BaseModel):
    """Response model for form analysis endpoint"""
    analysis: str = Field(..., description="Detailed form analysis from Claude")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Analysis timestamp")
    exerciseType: str = Field(..., description="Type of exercise analyzed")

    class Config:
        json_schema_extra = {
            "example": {
                "analysis": "Your squat form shows good depth and knee tracking...",
                "timestamp": "2025-11-20T10:30:00Z",
                "exerciseType": "squat"
            }
        }
