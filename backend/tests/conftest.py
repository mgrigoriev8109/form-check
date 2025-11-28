"""
Pytest configuration and shared fixtures for all tests
"""

import os
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.testclient import TestClient

# Set test environment variables before importing app
os.environ["ANTHROPIC_API_KEY"] = "test-api-key-12345"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.main import app
from app.shared.claude_client import ClaudeService


@pytest.fixture
def test_client() -> TestClient:
    """
    Create a test client for the FastAPI application

    Returns:
        TestClient instance for making test requests
    """
    return TestClient(app)


@pytest.fixture
def sample_biomechanics_data() -> dict[str, Any]:
    """
    Sample biomechanics data for testing form analysis

    Returns:
        Dictionary with complete biomechanics data structure
    """
    return {
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
        "riskFlags": [],
    }


@pytest.fixture
def sample_biomechanics_data_with_risks() -> dict[str, Any]:
    """
    Sample biomechanics data with risk flags for testing

    Returns:
        Dictionary with biomechanics data including risk flags
    """
    return {
        "exerciseType": "deadlift",
        "frameCount": 80,
        "duration": "2.7s",
        "keyPositions": {
            "setup": {
                "frame": 0,
                "hipAngle": 165.0,
                "kneeAngle": 170.0,
                "ankleAngle": 85.0,
                "torsoLean": 45.0,
                "neckAngle": 145.0,
                "hipHeight": 0.65,
                "shoulderHeight": 0.75,
                "kneeForwardTravel": 5.0,
            },
            "bottomPosition": {
                "frame": 10,
                "hipAngle": 75.0,
                "kneeAngle": 95.0,
                "ankleAngle": 75.0,
                "torsoLean": 55.0,
                "neckAngle": 135.0,
                "hipHeight": 0.35,
                "shoulderHeight": 0.45,
                "kneeForwardTravel": 10.0,
            },
            "completion": {
                "frame": 79,
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
            "hipRiseRate": 0.0075,
            "shoulderRiseRate": 0.0069,
            "riseRateRatio": 1.09,
            "maxTorsoLean": 55.0,
            "maxKneeForwardTravel": 10.0,
            "neckExtensionMax": 165.0,
            "minHipAngle": 75.0,
        },
        "riskFlags": [
            "Excessive torso lean detected (55.0°)",
            "Neck hyperextension risk",
            "Hips rising faster than shoulders",
        ],
    }


@pytest.fixture
def mock_claude_response() -> str:
    """
    Mock Claude API response for form analysis

    Returns:
        Sample analysis text from Claude
    """
    return """**Form Analysis: Squat**

**Strengths:**
- Good depth achieved (hip angle: 95°)
- Controlled descent and ascent
- Stable ankle position throughout movement

**Areas for Improvement:**
- Torso lean of 35° suggests potential mobility limitations
- Consider working on ankle and hip flexibility

**Safety Recommendations:**
- Maintain neutral spine throughout
- Keep knees tracking over toes
- Focus on controlled tempo

Overall: Good form with minor technique refinements needed."""


@pytest.fixture
def mock_anthropic_client(mock_claude_response: str) -> AsyncMock:
    """
    Mock Anthropic client for testing without API calls

    Args:
        mock_claude_response: Sample response text

    Returns:
        AsyncMock configured to return expected response structure
    """
    mock_client = AsyncMock()

    # Create a mock content block with text attribute
    mock_content_block = Mock()
    mock_content_block.text = mock_claude_response

    # Configure the mock message response
    mock_message = Mock()
    mock_message.content = [mock_content_block]

    # Set up the async create method
    mock_client.messages.create = AsyncMock(return_value=mock_message)

    return mock_client


@pytest.fixture
def mock_claude_service(mock_anthropic_client: AsyncMock) -> ClaudeService:
    """
    Mock ClaudeService with injected mock client

    Args:
        mock_anthropic_client: Mocked Anthropic client

    Returns:
        ClaudeService instance with mocked client
    """
    service = ClaudeService()
    service.client = mock_anthropic_client
    return service
