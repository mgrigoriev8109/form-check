import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings and environment variables"""

    # API Keys
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")

    # API Settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # CORS Settings
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5174")


settings = Settings()
