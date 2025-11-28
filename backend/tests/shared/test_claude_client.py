"""
Unit tests for ClaudeService
"""

import os
from typing import Any
from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.shared.claude_client import ClaudeService, get_claude_service


@pytest.mark.unit
def test_claude_service_initialization_success() -> None:
    """
    Test ClaudeService initializes successfully with API key

    Asserts:
        ClaudeService instance is created with valid client
    """
    # API key is set in conftest.py
    service = ClaudeService()

    assert service is not None
    assert service.client is not None


@pytest.mark.unit
def test_claude_service_initialization_missing_api_key() -> None:
    """
    Test ClaudeService raises ValueError when API key is missing

    Asserts:
        ValueError is raised with appropriate message
    """
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}, clear=True):
        with pytest.raises(ValueError) as exc_info:
            ClaudeService()

        assert "ANTHROPIC_API_KEY" in str(exc_info.value)


@pytest.mark.unit
async def test_analyze_form_success(
    mock_claude_service: ClaudeService,
    sample_biomechanics_data: dict[str, Any],
    mock_claude_response: str,
) -> None:
    """
    Test successful form analysis with mocked Claude API

    Args:
        mock_claude_service: Mocked Claude service fixture
        sample_biomechanics_data: Sample biomechanics data
        mock_claude_response: Expected response text

    Asserts:
        Analysis returns expected text and API is called correctly
    """
    result = await mock_claude_service.analyze_form(sample_biomechanics_data)

    assert result == mock_claude_response
    assert isinstance(result, str)
    assert len(result) > 0

    # Verify the API was called
    mock_claude_service.client.messages.create.assert_called_once()

    # Verify the call arguments
    call_args = mock_claude_service.client.messages.create.call_args
    assert call_args.kwargs["model"] == "claude-3-5-haiku-20241022"
    assert call_args.kwargs["max_tokens"] == 450
    assert "messages" in call_args.kwargs
    assert "system" in call_args.kwargs


@pytest.mark.unit
async def test_analyze_form_with_different_exercise_types(
    mock_claude_service: ClaudeService, sample_biomechanics_data: dict[str, Any]
) -> None:
    """
    Test form analysis with different exercise types

    Args:
        mock_claude_service: Mocked Claude service fixture
        sample_biomechanics_data: Sample biomechanics data

    Asserts:
        Service handles different exercise types correctly
    """
    exercise_types = ["squat", "deadlift", "bench"]

    for exercise in exercise_types:
        data = sample_biomechanics_data.copy()
        data["exerciseType"] = exercise

        result = await mock_claude_service.analyze_form(data)

        assert isinstance(result, str)
        assert len(result) > 0


@pytest.mark.unit
async def test_analyze_form_api_error(sample_biomechanics_data: dict[str, Any]) -> None:
    """
    Test form analysis handles API errors gracefully

    Args:
        sample_biomechanics_data: Sample biomechanics data

    Asserts:
        Exception is raised when API call fails
    """
    service = ClaudeService()

    # Mock the client to raise an exception
    mock_client = AsyncMock()
    mock_client.messages.create = AsyncMock(side_effect=Exception("API Error"))
    service.client = mock_client

    with pytest.raises(Exception) as exc_info:
        await service.analyze_form(sample_biomechanics_data)

    assert "API Error" in str(exc_info.value)


@pytest.mark.unit
async def test_analyze_form_unexpected_response_format(
    sample_biomechanics_data: dict[str, Any],
) -> None:
    """
    Test form analysis handles unexpected response format

    Args:
        sample_biomechanics_data: Sample biomechanics data

    Asserts:
        ValueError is raised when response format is unexpected
    """
    service = ClaudeService()

    # Mock the client to return unexpected format
    mock_client = AsyncMock()
    mock_message = Mock()
    mock_content_block = Mock(spec=[])  # No 'text' attribute
    mock_message.content = [mock_content_block]
    mock_client.messages.create = AsyncMock(return_value=mock_message)
    service.client = mock_client

    with pytest.raises(ValueError) as exc_info:
        await service.analyze_form(sample_biomechanics_data)

    assert "Unexpected response format" in str(exc_info.value)


@pytest.mark.unit
async def test_analyze_form_with_risk_flags(
    mock_claude_service: ClaudeService,
    sample_biomechanics_data_with_risks: dict[str, Any],
) -> None:
    """
    Test form analysis with risk flags included

    Args:
        mock_claude_service: Mocked Claude service fixture
        sample_biomechanics_data_with_risks: Sample data with risk flags

    Asserts:
        Service processes risk flags correctly
    """
    result = await mock_claude_service.analyze_form(sample_biomechanics_data_with_risks)

    assert isinstance(result, str)
    assert len(result) > 0

    # Verify risk flags are included in the request
    call_args = mock_claude_service.client.messages.create.call_args
    user_message = call_args.kwargs["messages"][0]["content"]

    # Check that risk flags appear in formatted data
    assert "RISK FLAGS" in user_message


@pytest.mark.unit
async def test_analyze_form_system_prompt_caching(
    mock_claude_service: ClaudeService, sample_biomechanics_data: dict[str, Any]
) -> None:
    """
    Test that system prompt uses cache control for efficiency

    Args:
        mock_claude_service: Mocked Claude service fixture
        sample_biomechanics_data: Sample biomechanics data

    Asserts:
        System prompt includes cache_control directive
    """
    await mock_claude_service.analyze_form(sample_biomechanics_data)

    call_args = mock_claude_service.client.messages.create.call_args
    system_messages = call_args.kwargs["system"]

    # Verify cache control is set
    assert len(system_messages) > 0
    assert "cache_control" in system_messages[0]
    assert system_messages[0]["cache_control"]["type"] == "ephemeral"


@pytest.mark.unit
def test_get_claude_service_singleton() -> None:
    """
    Test that get_claude_service returns a singleton instance

    Asserts:
        Multiple calls return the same instance
    """
    # Reset the global singleton
    import app.shared.claude_client as client_module

    client_module._claude_service = None

    service1 = get_claude_service()
    service2 = get_claude_service()

    assert service1 is service2


@pytest.mark.unit
async def test_analyze_form_empty_data(mock_claude_service: ClaudeService) -> None:
    """
    Test form analysis with minimal/empty data

    Args:
        mock_claude_service: Mocked Claude service fixture

    Asserts:
        Service handles empty data gracefully
    """
    empty_data: dict[str, Any] = {
        "exerciseType": "squat",
        "frameCount": 0,
        "keyPositions": {},
        "temporalAnalysis": {},
        "riskFlags": [],
    }

    result = await mock_claude_service.analyze_form(empty_data)

    assert isinstance(result, str)


@pytest.mark.unit
async def test_analyze_form_model_configuration(
    mock_claude_service: ClaudeService, sample_biomechanics_data: dict[str, Any]
) -> None:
    """
    Test that Claude API is called with correct model configuration

    Args:
        mock_claude_service: Mocked Claude service fixture
        sample_biomechanics_data: Sample biomechanics data

    Asserts:
        Correct model and token limits are used
    """
    await mock_claude_service.analyze_form(sample_biomechanics_data)

    call_args = mock_claude_service.client.messages.create.call_args

    # Verify model configuration
    assert call_args.kwargs["model"] == "claude-3-5-haiku-20241022"
    assert call_args.kwargs["max_tokens"] == 450

    # Verify message structure
    messages = call_args.kwargs["messages"]
    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert "content" in messages[0]
