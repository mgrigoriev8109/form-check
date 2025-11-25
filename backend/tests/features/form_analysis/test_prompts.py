"""
Unit tests for form analysis prompts module
"""
import pytest
from typing import Dict, Any

from app.features.form_analysis.prompts import (
    get_exercise_prompt,
    format_biomechanics_data,
    SQUAT_PROMPT,
    EXERCISE_PROMPTS
)


@pytest.mark.unit
def test_get_exercise_prompt_squat() -> None:
    """
    Test getting squat-specific prompt

    Asserts:
        Returns correct squat prompt
    """
    prompt = get_exercise_prompt("squat")

    assert prompt == SQUAT_PROMPT
    assert "squat" in prompt.lower()
    assert "Hip" in prompt
    assert "Knee" in prompt


@pytest.mark.unit
def test_get_exercise_prompt_case_insensitive() -> None:
    """
    Test exercise prompt lookup is case-insensitive

    Asserts:
        Different case variations return same prompt
    """
    prompt_lower = get_exercise_prompt("squat")
    prompt_upper = get_exercise_prompt("SQUAT")
    prompt_mixed = get_exercise_prompt("SqUaT")

    assert prompt_lower == prompt_upper == prompt_mixed


@pytest.mark.unit
def test_get_exercise_prompt_with_whitespace() -> None:
    """
    Test exercise prompt handles whitespace

    Asserts:
        Whitespace is stripped before lookup
    """
    prompt = get_exercise_prompt("  squat  ")

    assert prompt == SQUAT_PROMPT


@pytest.mark.unit
def test_get_exercise_prompt_unknown_defaults_to_squat() -> None:
    """
    Test unknown exercise types default to squat prompt

    Asserts:
        Unknown exercises return squat prompt as fallback
    """
    prompt = get_exercise_prompt("unknown_exercise")

    assert prompt == SQUAT_PROMPT


@pytest.mark.unit
def test_get_exercise_prompt_deadlift() -> None:
    """
    Test getting deadlift prompt (currently placeholder)

    Asserts:
        Deadlift prompt exists in mapping
    """
    prompt = get_exercise_prompt("deadlift")

    assert prompt is not None
    assert "deadlift" in EXERCISE_PROMPTS


@pytest.mark.unit
def test_format_biomechanics_data_complete(
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test formatting complete biomechanics data

    Args:
        sample_biomechanics_data: Sample biomechanics data fixture

    Asserts:
        Formatted string contains all key information
    """
    formatted = format_biomechanics_data(sample_biomechanics_data)

    assert isinstance(formatted, str)
    assert "SQUAT DATA" in formatted
    assert "90 frames" in formatted
    assert "BOTTOM POSITION" in formatted
    assert "MOVEMENT PATTERNS" in formatted
    assert "RISK FLAGS" in formatted

    # Check specific values are included
    assert "95.0" in formatted  # Hip angle
    assert "85.0" in formatted  # Knee angle
    assert "35.0" in formatted  # Torso lean
    assert "1.33" in formatted  # Rise ratio


@pytest.mark.unit
def test_format_biomechanics_data_with_risks(
    sample_biomechanics_data_with_risks: Dict[str, Any]
) -> None:
    """
    Test formatting biomechanics data with risk flags

    Args:
        sample_biomechanics_data_with_risks: Sample data with risk flags

    Asserts:
        Risk flags are properly included in formatted output
    """
    formatted = format_biomechanics_data(sample_biomechanics_data_with_risks)

    assert "RISK FLAGS" in formatted
    assert "Excessive torso lean" in formatted
    assert "Neck hyperextension" in formatted
    assert "Hips rising faster" in formatted


@pytest.mark.unit
def test_format_biomechanics_data_no_risks(
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test formatting biomechanics data without risk flags

    Args:
        sample_biomechanics_data: Sample biomechanics data fixture

    Asserts:
        Shows 'None detected' when no risk flags present
    """
    formatted = format_biomechanics_data(sample_biomechanics_data)

    assert "RISK FLAGS: None detected" in formatted


@pytest.mark.unit
def test_format_biomechanics_data_missing_fields() -> None:
    """
    Test formatting handles missing optional fields gracefully

    Asserts:
        Missing fields show as 'N/A'
    """
    incomplete_data: Dict[str, Any] = {
        "frameCount": 50,
        "keyPositions": {
            "bottomPosition": {}
        },
        "temporalAnalysis": {}
    }

    formatted = format_biomechanics_data(incomplete_data)

    assert "N/A" in formatted
    assert "50 frames" in formatted


@pytest.mark.unit
def test_format_biomechanics_data_empty_dict() -> None:
    """
    Test formatting handles completely empty data

    Asserts:
        Empty dict doesn't crash, returns basic structure
    """
    empty_data: Dict[str, Any] = {}

    formatted = format_biomechanics_data(empty_data)

    assert isinstance(formatted, str)
    assert "SQUAT DATA" in formatted
    assert "RISK FLAGS: None detected" in formatted


@pytest.mark.unit
def test_squat_prompt_contains_key_elements() -> None:
    """
    Test squat prompt contains essential analysis elements

    Asserts:
        Prompt includes optimal ranges, risks, and format instructions
    """
    assert "OPTIMAL" in SQUAT_PROMPT
    assert "RISKS" in SQUAT_PROMPT
    assert "FORMAT" in SQUAT_PROMPT
    assert "Hip" in SQUAT_PROMPT
    assert "Knee" in SQUAT_PROMPT
    assert "Torso" in SQUAT_PROMPT


@pytest.mark.unit
def test_exercise_prompts_mapping() -> None:
    """
    Test exercise prompts dictionary contains expected keys

    Asserts:
        All expected exercise types are in mapping
    """
    assert "squat" in EXERCISE_PROMPTS
    assert "deadlift" in EXERCISE_PROMPTS
    assert "bench" in EXERCISE_PROMPTS


@pytest.mark.unit
def test_format_biomechanics_data_preserves_precision() -> None:
    """
    Test that numeric formatting preserves decimal precision

    Asserts:
        Float values are properly formatted in output
    """
    data = {
        "frameCount": 100,
        "keyPositions": {
            "bottomPosition": {
                "hipAngle": 95.5555,
                "kneeAngle": 85.1234,
                "torsoLean": 35.7890,
                "neckAngle": 155.0
            }
        },
        "temporalAnalysis": {
            "riseRateRatio": 1.3333,
            "maxTorsoLean": 35.7890,
            "minHipAngle": 95.5555
        },
        "riskFlags": []
    }

    formatted = format_biomechanics_data(data)

    # Check that values appear (may be rounded in display)
    assert "95.5555" in formatted or "95.56" in formatted
    assert "1.3333" in formatted or "1.33" in formatted
