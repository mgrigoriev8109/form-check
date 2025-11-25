"""
Integration tests for form analysis router endpoints
"""
import pytest
from typing import Dict, Any
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from datetime import datetime


@pytest.mark.integration
def test_analyze_form_success(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any],
    mock_claude_service: Any
) -> None:
    """
    Test successful form analysis with valid data

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
        mock_claude_service: Mocked Claude service
    """
    with patch('app.features.form_analysis.router.get_claude_service', return_value=mock_claude_service):
        response = test_client.post(
            "/api/analyze-form",
            json=sample_biomechanics_data
        )

    assert response.status_code == 200

    data = response.json()
    assert "analysis" in data
    assert "timestamp" in data
    assert "exerciseType" in data
    assert data["exerciseType"] == "squat"
    assert len(data["analysis"]) > 0


@pytest.mark.integration
def test_analyze_form_with_risk_flags(
    test_client: TestClient,
    sample_biomechanics_data_with_risks: Dict[str, Any],
    mock_claude_service: Any
) -> None:
    """
    Test form analysis with risk flags present

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data_with_risks: Sample data with risk flags
        mock_claude_service: Mocked Claude service
    """
    with patch('app.features.form_analysis.router.get_claude_service', return_value=mock_claude_service):
        response = test_client.post(
            "/api/analyze-form",
            json=sample_biomechanics_data_with_risks
        )

    assert response.status_code == 200

    data = response.json()
    assert "analysis" in data
    assert data["exerciseType"] == "deadlift"


@pytest.mark.integration
def test_analyze_form_missing_required_field(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test form analysis fails with missing required fields

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
    """
    # Remove required field
    incomplete_data = sample_biomechanics_data.copy()
    del incomplete_data["exerciseType"]

    response = test_client.post(
        "/api/analyze-form",
        json=incomplete_data
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.integration
def test_analyze_form_invalid_data_types(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test form analysis fails with invalid data types

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
    """
    invalid_data = sample_biomechanics_data.copy()
    invalid_data["frameCount"] = "not-a-number"  # Should be int

    response = test_client.post(
        "/api/analyze-form",
        json=invalid_data
    )

    assert response.status_code == 422  # Validation error
    assert "detail" in response.json()


@pytest.mark.integration
def test_analyze_form_invalid_angles(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test that invalid angle values are rejected

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
    """
    invalid_data = sample_biomechanics_data.copy()
    invalid_data["keyPositions"]["setup"]["hipAngle"] = "invalid"

    response = test_client.post(
        "/api/analyze-form",
        json=invalid_data
    )

    assert response.status_code == 422


@pytest.mark.integration
def test_analyze_form_api_error(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test handling of Claude API errors

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
    """
    # Mock a service that raises an exception
    mock_service = AsyncMock()
    mock_service.analyze_form = AsyncMock(side_effect=Exception("API Error"))

    with patch('app.features.form_analysis.router.get_claude_service', return_value=mock_service):
        response = test_client.post(
            "/api/analyze-form",
            json=sample_biomechanics_data
        )

    assert response.status_code == 500
    assert "detail" in response.json()
    assert "Failed to analyze form" in response.json()["detail"]


@pytest.mark.integration
def test_analyze_form_value_error(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any]
) -> None:
    """
    Test handling of ValueError (e.g., missing API key)

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
    """
    # Mock get_claude_service to raise ValueError
    with patch('app.features.form_analysis.router.get_claude_service', side_effect=ValueError("API key not set")):
        response = test_client.post(
            "/api/analyze-form",
            json=sample_biomechanics_data
        )

    assert response.status_code == 500
    assert "detail" in response.json()
    assert "Service configuration error" in response.json()["detail"]


@pytest.mark.integration
def test_analyze_form_empty_request_body(test_client: TestClient) -> None:
    """
    Test that empty request body returns validation error

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.post(
        "/api/analyze-form",
        json={}
    )

    assert response.status_code == 422


@pytest.mark.integration
def test_analyze_form_response_structure(
    test_client: TestClient,
    sample_biomechanics_data: Dict[str, Any],
    mock_claude_service: Any
) -> None:
    """
    Test that response has correct structure

    Args:
        test_client: FastAPI test client fixture
        sample_biomechanics_data: Sample request data
        mock_claude_service: Mocked Claude service
    """
    with patch('app.features.form_analysis.router.get_claude_service', return_value=mock_claude_service):
        response = test_client.post(
            "/api/analyze-form",
            json=sample_biomechanics_data
        )

    assert response.status_code == 200

    data = response.json()

    # Verify all required fields are present
    assert "analysis" in data
    assert "timestamp" in data
    assert "exerciseType" in data

    # Verify timestamp is valid ISO format
    timestamp = data["timestamp"]
    datetime.fromisoformat(timestamp.replace('Z', '+00:00'))

    # Verify analysis is a non-empty string
    assert isinstance(data["analysis"], str)
    assert len(data["analysis"]) > 0

    # Verify exercise type matches request
    assert data["exerciseType"] == sample_biomechanics_data["exerciseType"]
