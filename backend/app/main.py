from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import form_analysis
from typing import Dict
import os

app = FastAPI(
    title="Form Check API",
    description="Backend service for analyzing weightlifting form using Claude AI",
    version="0.1.0"
)

# Configure CORS for React frontend - MUST come before router inclusion
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(form_analysis.router)


@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint - API information"""
    return {
        "name": "Form Check API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Form Check API is running"
    }
