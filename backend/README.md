# Form Check Backend API

Python FastAPI backend service for analyzing weightlifting form using Claude AI.

## Prerequisites

- Python 3.11+ (currently using Python 3.14)
- Claude API key from [Anthropic Console](https://console.anthropic.com/)

## Setup

### 1. Create and activate virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```
CLAUDE_API_KEY=your_actual_api_key_here
```

## Running the Server

### Development mode

```bash
# Make sure you're in the backend directory and venv is activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### `GET /`
Returns API information and status.

### `GET /health`
Health check endpoint to verify the API is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Form Check API is running"
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app and endpoints
│   ├── config.py            # Configuration and environment variables
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/          # API route handlers (future)
│   └── services/            # Business logic (Claude API integration, etc.)
├── venv/                    # Virtual environment (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example            # Example environment variables
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Testing

This project includes comprehensive test coverage (93%) using pytest.

### Quick Start

Run all tests:
```bash
# Using the test runner script
./run_tests.sh

# Or directly with pytest
source venv/bin/activate
pytest
```

### Test Options

```bash
# Run specific test types
./run_tests.sh unit           # Unit tests only
./run_tests.sh integration    # Integration tests only

# Coverage reports
./run_tests.sh coverage       # HTML coverage report

# Other options
./run_tests.sh fast           # Skip coverage for speed
./run_tests.sh verbose        # Detailed output
```

### Test Structure

- **52 total tests** covering all major components
- **Unit tests**: Schema validation, business logic, helpers
- **Integration tests**: API endpoints, error handling, CORS
- **Mocked external APIs**: No real API calls in tests

See [tests/README.md](./tests/README.md) for detailed testing documentation.

## Type Checking

Run mypy for static type checking:

```bash
mypy app/
```

Configuration is in [mypy.ini](./mypy.ini).

## Development

### Adding new dependencies

```bash
pip install package-name
pip freeze > requirements.txt
```

### Code Quality Checklist

Before committing:
- [ ] Run tests: `./run_tests.sh`
- [ ] Check types: `mypy app/`
- [ ] Verify coverage: `./run_tests.sh coverage`

## Next Steps

- [x] ~~Add tests~~ (Complete - 93% coverage)
- [x] ~~Implement Claude API integration for form analysis~~ (Complete)
- [ ] Add video frame processing endpoint
- [ ] Add structured logging
- [ ] Add database integration for storing analysis history
- [ ] Add authentication/authorization
