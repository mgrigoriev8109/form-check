from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class BiomechanicsMetrics(BaseModel):
    """Biomechanical metrics for a single frame"""
    hipAngle: float = Field(..., ge=0, le=180, description="Hip joint angle in degrees")
    kneeAngle: float = Field(..., ge=0, le=180, description="Knee joint angle in degrees")
    ankleAngle: float = Field(..., ge=0, le=180, description="Ankle joint angle in degrees")
    torsoLean: float = Field(..., ge=-90, le=90, description="Torso lean angle from vertical in degrees")
    neckAngle: float = Field(..., ge=0, le=180, description="Neck angle in degrees")
    hipHeight: float = Field(..., ge=0, le=1, description="Hip height normalized (0-1)")
    shoulderHeight: float = Field(..., ge=0, le=1, description="Shoulder height normalized (0-1)")
    kneeForwardTravel: float = Field(..., ge=-100, le=100, description="Knee forward travel as percentage")


class KeyPosition(BiomechanicsMetrics):
    """Key position in movement with frame number"""
    frame: int = Field(..., ge=0, description="Frame index")


class TemporalAnalysis(BaseModel):
    """Temporal movement patterns across frames"""
    hipRiseRate: float = Field(..., description="Hip rise rate per frame")
    shoulderRiseRate: float = Field(..., description="Shoulder rise rate per frame")
    riseRateRatio: float = Field(..., ge=0, description="Ratio of hip rise to shoulder rise")
    maxTorsoLean: float = Field(..., ge=-90, le=90, description="Maximum torso lean angle in degrees")
    maxKneeForwardTravel: float = Field(..., ge=-100, le=100, description="Maximum knee forward travel percentage")
    neckExtensionMax: float = Field(..., ge=0, le=180, description="Maximum neck extension angle")
    minHipAngle: float = Field(..., ge=0, le=180, description="Minimum hip angle (indicates depth)")


class KeyPositions(BaseModel):
    """Key positions identified in the movement"""
    setup: KeyPosition = Field(..., description="Setup/starting position")
    bottomPosition: KeyPosition = Field(..., description="Bottom/lowest position")
    completion: KeyPosition = Field(..., description="Completion/ending position")


class FormAnalysisRequest(BaseModel):
    """Request model for form analysis endpoint with biomechanics data"""
    exerciseType: str = Field(..., min_length=1, max_length=50, description="Type of exercise (e.g., 'Squat', 'Deadlift')")
    frameCount: int = Field(..., ge=1, le=100, description="Number of frames analyzed")
    duration: str = Field(..., max_length=100, description="Approximate duration of movement")
    keyPositions: KeyPositions = Field(..., description="Key positions in the movement")
    temporalAnalysis: TemporalAnalysis = Field(..., description="Temporal movement patterns")
    riskFlags: List[str] = Field(default=[], max_length=20, description="Automatically detected risk flags")
    allFramesData: Optional[List[BiomechanicsMetrics]] = Field(None, max_length=100, description="Frame-by-frame metrics (optional, not used in analysis)")

    @field_validator('exerciseType')
    @classmethod
    def validate_exercise_type(cls, v: str) -> str:
        """Validate exercise type is one of the supported types"""
        allowed = {'squat', 'deadlift', 'Squat', 'Deadlift'}
        if v not in allowed:
            raise ValueError(f'Exercise type must be one of {allowed}')
        return v

    @field_validator('riskFlags')
    @classmethod
    def validate_risk_flags(cls, v: List[str]) -> List[str]:
        """Limit individual risk flag length to prevent injection attacks"""
        return [flag[:200] for flag in v]


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
