# Backend Test Suite

Comprehensive test coverage for the Form Check FastAPI backend.

## Overview

- **Total Tests**: 52
- **Coverage**: 93%
- **Test Framework**: pytest with pytest-asyncio
- **Mocking**: pytest-mock + unittest.mock

## Test Structure

```
tests/
├── conftest.py                              # Shared fixtures and test configuration
├── test_main.py                             # Main app endpoint tests
├── features/
│   └── form_analysis/
│       ├── test_router.py                   # API endpoint integration tests
│       ├── test_schemas.py                  # Pydantic schema validation tests
│       └── test_prompts.py                  # Prompt formatting tests
└── shared/
    └── test_claude_client.py               # ClaudeService unit tests
```

## Running Tests

### Run All Tests
```bash
source venv/bin/activate
pytest
```

### Run with Verbose Output
```bash
pytest -v
```

### Run Specific Test File
```bash
pytest tests/features/form_analysis/test_router.py
```

### Run Specific Test
```bash
pytest tests/test_main.py::test_root_endpoint
```

### Run Tests by Marker
```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

### Generate Coverage Report
```bash
# Terminal output (default)
pytest

# HTML report (viewable in browser)
pytest --cov-report=html
open htmlcov/index.html

# XML report (for CI/CD)
pytest --cov-report=xml
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
Test individual components in isolation:
- Schema validation
- Prompt formatting
- ClaudeService logic
- Helper functions

### Integration Tests (`@pytest.mark.integration`)
Test API endpoints with full request/response cycle:
- Main app endpoints
- Form analysis router
- Error handling
- CORS configuration

## Key Test Fixtures

Defined in [conftest.py](./conftest.py):

- **test_client**: FastAPI TestClient for making requests
- **sample_biomechanics_data**: Valid biomechanics data for testing
- **sample_biomechanics_data_with_risks**: Data with risk flags included
- **mock_claude_response**: Sample Claude API response text
- **mock_anthropic_client**: Mocked Anthropic API client
- **mock_claude_service**: ClaudeService with mocked client

## Test Coverage Breakdown

| Module | Coverage | Notes |
|--------|----------|-------|
| [main.py](../app/main.py) | 100% | All endpoints tested |
| [router.py](../app/features/form_analysis/router.py) | 100% | Success/error paths covered |
| [schemas.py](../app/features/form_analysis/schemas.py) | 100% | All validations tested |
| [prompts.py](../app/features/form_analysis/prompts.py) | 100% | Formatting logic covered |
| [claude_client.py](../app/shared/claude_client.py) | 100% | Mocked API interactions |
| [config.py](../app/config.py) | 0% | Settings only, no logic |

## Writing New Tests

### Example Unit Test
```python
import pytest

@pytest.mark.unit
def test_new_feature() -> None:
    """
    Test description

    Asserts:
        Expected behavior
    """
    result = my_function()
    assert result == expected_value
```

### Example Integration Test
```python
import pytest
from fastapi.testclient import TestClient

@pytest.mark.integration
def test_new_endpoint(test_client: TestClient) -> None:
    """
    Test endpoint description

    Args:
        test_client: FastAPI test client fixture

    Asserts:
        Expected response
    """
    response = test_client.get("/new-endpoint")
    assert response.status_code == 200
```

### Async Tests
```python
import pytest

@pytest.mark.unit
async def test_async_function() -> None:
    """Test async function"""
    result = await async_function()
    assert result is not None
```

## Mocking External APIs

The Claude API is mocked in tests to avoid:
- Real API costs
- Network dependencies
- Rate limits
- Flaky tests

Example:
```python
from unittest.mock import patch, AsyncMock

@pytest.mark.integration
def test_with_mocked_api(test_client, mock_claude_service):
    with patch('app.features.form_analysis.router.get_claude_service',
               return_value=mock_claude_service):
        response = test_client.post("/api/analyze-form", json=data)
        assert response.status_code == 200
```

## CI/CD Integration

Tests are configured for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    source venv/bin/activate
    pytest --cov-report=xml

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what's being tested
2. **Docstrings**: Include description and assertions in docstrings
3. **Fixtures**: Reuse fixtures from conftest.py for consistency
4. **Markers**: Tag tests appropriately (@pytest.mark.unit, @pytest.mark.integration)
5. **Coverage**: Aim for >80% coverage on critical paths
6. **Mock External APIs**: Never hit real APIs in tests
7. **Async Tests**: Use pytest-asyncio for async function tests
8. **Error Cases**: Test both success and failure scenarios

## Common Issues

### AsyncIO Warnings
If you see asyncio warnings, ensure `pytest-asyncio` is installed and tests are properly marked with `async def`.

### Import Errors
Make sure you're in the virtual environment:
```bash
source venv/bin/activate
```

### Environment Variables
Test environment variables are set in [conftest.py](./conftest.py). The real `.env` file is not loaded during tests.

## Adding New Tests

When adding new features:

1. Create test file in appropriate directory
2. Import necessary fixtures from conftest.py
3. Write unit tests for business logic
4. Write integration tests for API endpoints
5. Run tests and verify coverage
6. Update this README if adding new patterns

## Maintenance

- Run tests before committing: `pytest`
- Check coverage regularly: `pytest --cov-report=term-missing`
- Update fixtures when data models change
- Keep mocks synchronized with real API behavior
- Review and update tests when refactoring

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
