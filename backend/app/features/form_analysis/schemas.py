from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class BiomechanicsMetrics(BaseModel):
    """Biomechanical metrics for a single frame"""
    hipAngle: float = Field(..., description="Hip joint angle in degrees")
    kneeAngle: float = Field(..., description="Knee joint angle in degrees")
    ankleAngle: float = Field(..., description="Ankle joint angle in degrees")
    torsoLean: float = Field(..., description="Torso lean angle from vertical in degrees")
    neckAngle: float = Field(..., description="Neck angle in degrees")
    hipHeight: float = Field(..., description="Hip height normalized (0-1)")
    shoulderHeight: float = Field(..., description="Shoulder height normalized (0-1)")
    kneeForwardTravel: float = Field(..., description="Knee forward travel as percentage")


class KeyPosition(BiomechanicsMetrics):
    """Key position in movement with frame number"""
    frame: int = Field(..., description="Frame index")


class TemporalAnalysis(BaseModel):
    """Temporal movement patterns across frames"""
    hipRiseRate: float = Field(..., description="Hip rise rate per frame")
    shoulderRiseRate: float = Field(..., description="Shoulder rise rate per frame")
    riseRateRatio: float = Field(..., description="Ratio of hip rise to shoulder rise")
    maxTorsoLean: float = Field(..., description="Maximum torso lean angle in degrees")
    maxKneeForwardTravel: float = Field(..., description="Maximum knee forward travel percentage")
    neckExtensionMax: float = Field(..., description="Maximum neck extension angle")
    minHipAngle: float = Field(..., description="Minimum hip angle (indicates depth)")


class KeyPositions(BaseModel):
    """Key positions identified in the movement"""
    setup: KeyPosition = Field(..., description="Setup/starting position")
    bottomPosition: KeyPosition = Field(..., description="Bottom/lowest position")
    completion: KeyPosition = Field(..., description="Completion/ending position")


class FormAnalysisRequest(BaseModel):
    """Request model for form analysis endpoint with biomechanics data"""
    exerciseType: str = Field(..., description="Type of exercise (e.g., 'Squat', 'Deadlift')")
    frameCount: int = Field(..., description="Number of frames analyzed")
    duration: str = Field(..., description="Approximate duration of movement")
    keyPositions: KeyPositions = Field(..., description="Key positions in the movement")
    temporalAnalysis: TemporalAnalysis = Field(..., description="Temporal movement patterns")
    riskFlags: List[str] = Field(default=[], description="Automatically detected risk flags")
    allFramesData: Optional[List[BiomechanicsMetrics]] = Field(None, description="Frame-by-frame metrics (optional, not used in analysis)")


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
