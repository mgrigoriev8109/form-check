import os
from collections.abc import Awaitable, Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.features.form_analysis import router as form_analysis

app = FastAPI(
    title="Form Check API",
    description="Backend service for analyzing weightlifting form using Claude AI",
    version="0.1.0",
    # Disable interactive docs in production
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)

        # Content Security Policy
        # Skip CSP for docs routes in development (they need external CDN resources)
        is_production = os.getenv("ENVIRONMENT") == "production"
        is_docs_route = request.url.path in ["/docs", "/redoc", "/openapi.json"]

        if is_production or not is_docs_route:
            response.headers["Content-Security-Policy"] = "default-src 'self'"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Enable browser XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Enforce HTTPS (only in production)
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response


app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS for React frontend - MUST come after security headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(form_analysis.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - API information"""
    return {"name": "Form Check API", "version": "0.1.0", "status": "running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy", "message": "Form Check API is running"}
