"""
Integration tests for main application endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_root_endpoint(test_client: TestClient) -> None:
    """
    Test the root endpoint returns API information

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/")

    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Form Check API"
    assert data["version"] == "0.1.0"
    assert data["status"] == "running"


@pytest.mark.integration
def test_health_check_endpoint(test_client: TestClient) -> None:
    """
    Test the health check endpoint returns healthy status

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "message" in data
    assert "running" in data["message"].lower()


@pytest.mark.integration
def test_cors_headers(test_client: TestClient) -> None:
    """
    Test that CORS headers are properly configured

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    # CORS middleware should add appropriate headers
    assert "access-control-allow-origin" in response.headers


@pytest.mark.integration
def test_404_not_found(test_client: TestClient) -> None:
    """
    Test that non-existent endpoints return 404

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/nonexistent-endpoint")

    assert response.status_code == 404
    assert "detail" in response.json()
