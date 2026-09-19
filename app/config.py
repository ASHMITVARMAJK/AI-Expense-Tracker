import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "SPRING_DATASOURCE_URL", 
        os.getenv("DATABASE_URL", "sqlite:///./test.db")
    )
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "ai-expense-tracker-f2e94")
    CORS_ALLOWED_ORIGINS: str = os.getenv(
        "CORS_ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000"
    )

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

def get_db_url(url: str) -> str:
    """Strips Spring Boot 'jdbc:' prefix if present for Python SQLAlchemy compatibility."""
    if url.startswith("jdbc:postgresql://"):
        return url.replace("jdbc:postgresql://", "postgresql://")
    return url
