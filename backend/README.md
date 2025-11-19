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

## Development

### Adding new dependencies

```bash
pip install package-name
pip freeze > requirements.txt
```

## Next Steps

- [ ] Implement Claude API integration for form analysis
- [ ] Add video frame processing endpoint
- [ ] Add error handling and logging
- [ ] Add tests
