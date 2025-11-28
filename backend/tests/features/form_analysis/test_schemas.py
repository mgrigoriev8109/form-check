"""
Unit tests for form analysis Pydantic schemas
"""

from datetime import UTC, datetime
from typing import Any

import pytest
from pydantic import ValidationError

from app.features.form_analysis.schemas import (
    BiomechanicsMetrics,
    FormAnalysisRequest,
    FormAnalysisResponse,
    KeyPosition,
    KeyPositions,
    TemporalAnalysis,
)


@pytest.mark.unit
def test_biomechanics_metrics_valid() -> None:
    """
    Test BiomechanicsMetrics with valid data

    Asserts:
        Model is created successfully with all fields
    """
    metrics = BiomechanicsMetrics(
        hipAngle=95.0,
        kneeAngle=85.0,
        ankleAngle=70.0,
        torsoLean=35.0,
        neckAngle=155.0,
        hipHeight=0.35,
        shoulderHeight=0.55,
        kneeForwardTravel=15.0,
    )

    assert metrics.hipAngle == 95.0
    assert metrics.kneeAngle == 85.0
    assert metrics.ankleAngle == 70.0
    assert metrics.torsoLean == 35.0
    assert metrics.neckAngle == 155.0
    assert metrics.hipHeight == 0.35
    assert metrics.shoulderHeight == 0.55
    assert metrics.kneeForwardTravel == 15.0


@pytest.mark.unit
def test_biomechanics_metrics_missing_required_field() -> None:
    """
    Test BiomechanicsMetrics fails with missing required field

    Asserts:
        ValidationError is raised
    """
    with pytest.raises(ValidationError) as exc_info:
        BiomechanicsMetrics(
            hipAngle=95.0,
            kneeAngle=85.0,
            # ankleAngle missing
            torsoLean=35.0,
            neckAngle=155.0,
            hipHeight=0.35,
            shoulderHeight=0.55,
            kneeForwardTravel=15.0,
        )

    errors = exc_info.value.errors()
    assert any(error["loc"] == ("ankleAngle",) for error in errors)


@pytest.mark.unit
def test_biomechanics_metrics_invalid_type() -> None:
    """
    Test BiomechanicsMetrics fails with invalid data type

    Asserts:
        ValidationError is raised for incorrect type
    """
    with pytest.raises(ValidationError):
        BiomechanicsMetrics(
            hipAngle="not-a-number",  # Should be float
            kneeAngle=85.0,
            ankleAngle=70.0,
            torsoLean=35.0,
            neckAngle=155.0,
            hipHeight=0.35,
            shoulderHeight=0.55,
            kneeForwardTravel=15.0,
        )


@pytest.mark.unit
def test_key_position_valid() -> None:
    """
    Test KeyPosition with valid data

    Asserts:
        Model includes frame number and inherits BiomechanicsMetrics
    """
    position = KeyPosition(
        frame=45,
        hipAngle=95.0,
        kneeAngle=85.0,
        ankleAngle=70.0,
        torsoLean=35.0,
        neckAngle=155.0,
        hipHeight=0.35,
        shoulderHeight=0.55,
        kneeForwardTravel=15.0,
    )

    assert position.frame == 45
    assert position.hipAngle == 95.0


@pytest.mark.unit
def test_temporal_analysis_valid() -> None:
    """
    Test TemporalAnalysis with valid data

    Asserts:
        Model is created with all temporal metrics
    """
    analysis = TemporalAnalysis(
        hipRiseRate=0.0133,
        shoulderRiseRate=0.01,
        riseRateRatio=1.33,
        maxTorsoLean=35.0,
        maxKneeForwardTravel=15.0,
        neckExtensionMax=165.0,
        minHipAngle=95.0,
    )

    assert analysis.hipRiseRate == 0.0133
    assert analysis.shoulderRiseRate == 0.01
    assert analysis.riseRateRatio == 1.33
    assert analysis.maxTorsoLean == 35.0


@pytest.mark.unit
def test_key_positions_valid(sample_biomechanics_data: dict[str, Any]) -> None:
    """
    Test KeyPositions with valid nested data

    Args:
        sample_biomechanics_data: Sample biomechanics data fixture

    Asserts:
        Model correctly parses nested position data
    """
    positions_data = sample_biomechanics_data["keyPositions"]
    positions = KeyPositions(**positions_data)

    assert positions.setup.frame == 0
    assert positions.bottomPosition.frame == 45
    assert positions.completion.frame == 89


@pytest.mark.unit
def test_form_analysis_request_valid(sample_biomechanics_data: dict[str, Any]) -> None:
    """
    Test FormAnalysisRequest with valid complete data

    Args:
        sample_biomechanics_data: Sample biomechanics data fixture

    Asserts:
        Full request model is validated successfully
    """
    request = FormAnalysisRequest(**sample_biomechanics_data)

    assert request.exerciseType == "squat"
    assert request.frameCount == 90
    assert request.duration == "3.0s"
    assert request.keyPositions.setup.frame == 0
    assert request.temporalAnalysis.riseRateRatio == 1.33
    assert request.riskFlags == []


@pytest.mark.unit
def test_form_analysis_request_with_risk_flags(
    sample_biomechanics_data_with_risks: dict[str, Any],
) -> None:
    """
    Test FormAnalysisRequest with risk flags

    Args:
        sample_biomechanics_data_with_risks: Sample data with risk flags

    Asserts:
        Risk flags are properly included in the model
    """
    request = FormAnalysisRequest(**sample_biomechanics_data_with_risks)

    assert len(request.riskFlags) > 0
    assert "Excessive torso lean" in request.riskFlags[0]


@pytest.mark.unit
def test_form_analysis_request_default_risk_flags() -> None:
    """
    Test FormAnalysisRequest defaults to empty risk flags

    Asserts:
        Risk flags default to empty list when not provided
    """
    minimal_data = {
        "exerciseType": "squat",
        "frameCount": 90,
        "duration": "3.0s",
        "keyPositions": {
            "setup": {
                "frame": 0,
                "hipAngle": 175.0,
                "kneeAngle": 178.0,
                "ankleAngle": 85.0,
                "torsoLean": 5.0,
                "neckAngle": 165.0,
                "hipHeight": 0.95,
                "shoulderHeight": 1.0,
                "kneeForwardTravel": 0.0,
            },
            "bottomPosition": {
                "frame": 45,
                "hipAngle": 95.0,
                "kneeAngle": 85.0,
                "ankleAngle": 70.0,
                "torsoLean": 35.0,
                "neckAngle": 155.0,
                "hipHeight": 0.35,
                "shoulderHeight": 0.55,
                "kneeForwardTravel": 15.0,
            },
            "completion": {
                "frame": 89,
                "hipAngle": 175.0,
                "kneeAngle": 178.0,
                "ankleAngle": 85.0,
                "torsoLean": 5.0,
                "neckAngle": 165.0,
                "hipHeight": 0.95,
                "shoulderHeight": 1.0,
                "kneeForwardTravel": 0.0,
            },
        },
        "temporalAnalysis": {
            "hipRiseRate": 0.0133,
            "shoulderRiseRate": 0.01,
            "riseRateRatio": 1.33,
            "maxTorsoLean": 35.0,
            "maxKneeForwardTravel": 15.0,
            "neckExtensionMax": 165.0,
            "minHipAngle": 95.0,
        },
    }

    request = FormAnalysisRequest(**minimal_data)
    assert request.riskFlags == []


@pytest.mark.unit
def test_form_analysis_request_optional_all_frames() -> None:
    """
    Test FormAnalysisRequest with optional allFramesData

    Asserts:
        allFramesData is optional and can be None
    """
    minimal_data = {
        "exerciseType": "squat",
        "frameCount": 90,
        "duration": "3.0s",
        "keyPositions": {
            "setup": {
                "frame": 0,
                "hipAngle": 175.0,
                "kneeAngle": 178.0,
                "ankleAngle": 85.0,
                "torsoLean": 5.0,
                "neckAngle": 165.0,
                "hipHeight": 0.95,
                "shoulderHeight": 1.0,
                "kneeForwardTravel": 0.0,
            },
            "bottomPosition": {
                "frame": 45,
                "hipAngle": 95.0,
                "kneeAngle": 85.0,
                "ankleAngle": 70.0,
                "torsoLean": 35.0,
                "neckAngle": 155.0,
                "hipHeight": 0.35,
                "shoulderHeight": 0.55,
                "kneeForwardTravel": 15.0,
            },
            "completion": {
                "frame": 89,
                "hipAngle": 175.0,
                "kneeAngle": 178.0,
                "ankleAngle": 85.0,
                "torsoLean": 5.0,
                "neckAngle": 165.0,
                "hipHeight": 0.95,
                "shoulderHeight": 1.0,
                "kneeForwardTravel": 0.0,
            },
        },
        "temporalAnalysis": {
            "hipRiseRate": 0.0133,
            "shoulderRiseRate": 0.01,
            "riseRateRatio": 1.33,
            "maxTorsoLean": 35.0,
            "maxKneeForwardTravel": 15.0,
            "neckExtensionMax": 165.0,
            "minHipAngle": 95.0,
        },
    }

    request = FormAnalysisRequest(**minimal_data)
    assert request.allFramesData is None


@pytest.mark.unit
def test_form_analysis_response_valid() -> None:
    """
    Test FormAnalysisResponse with valid data

    Asserts:
        Response model is created correctly
    """
    response = FormAnalysisResponse(
        analysis="Good form overall", timestamp=datetime.now(UTC), exerciseType="squat"
    )

    assert response.analysis == "Good form overall"
    assert isinstance(response.timestamp, datetime)
    assert response.exerciseType == "squat"


@pytest.mark.unit
def test_form_analysis_response_missing_required() -> None:
    """
    Test FormAnalysisResponse fails without required fields

    Asserts:
        ValidationError is raised when required fields missing
    """
    with pytest.raises(ValidationError):
        FormAnalysisResponse(
            # analysis missing
            timestamp=datetime.now(UTC)
            # exerciseType missing
        )


@pytest.mark.unit
def test_form_analysis_response_serialization() -> None:
    """
    Test FormAnalysisResponse can be serialized to JSON

    Asserts:
        Model can be converted to dictionary and JSON
    """
    response = FormAnalysisResponse(
        analysis="Test analysis", timestamp=datetime.now(UTC), exerciseType="deadlift"
    )

    # Test model_dump
    data = response.model_dump()
    assert "analysis" in data
    assert "timestamp" in data
    assert "exerciseType" in data

    # Test JSON serialization
    json_str = response.model_dump_json()
    assert isinstance(json_str, str)
    assert "Test analysis" in json_str


@pytest.mark.unit
def test_form_analysis_request_model_dump(
    sample_biomechanics_data: dict[str, Any],
) -> None:
    """
    Test FormAnalysisRequest can be converted back to dictionary

    Args:
        sample_biomechanics_data: Sample biomechanics data fixture

    Asserts:
        Model can be dumped to dict for API calls
    """
    request = FormAnalysisRequest(**sample_biomechanics_data)
    dumped = request.model_dump()

    assert dumped["exerciseType"] == "squat"
    assert dumped["frameCount"] == 90
    assert "keyPositions" in dumped
    assert "temporalAnalysis" in dumped


@pytest.mark.unit
def test_negative_angles_validation() -> None:
    """
    Test that schema accepts negative angles (valid biomechanically)

    Asserts:
        Negative values are accepted for angles
    """
    metrics = BiomechanicsMetrics(
        hipAngle=-10.0,  # Hyperextension
        kneeAngle=5.0,
        ankleAngle=-5.0,
        torsoLean=-15.0,  # Backward lean
        neckAngle=140.0,
        hipHeight=0.5,
        shoulderHeight=0.7,
        kneeForwardTravel=-2.0,  # Backward travel
    )

    assert metrics.hipAngle == -10.0
    assert metrics.torsoLean == -15.0
