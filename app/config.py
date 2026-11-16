import os
from pydantic_settings import BaseSettings

def resolve_db_url() -> str:
    from urllib.parse import urlsplit, urlunsplit, quote

    url = (
        os.getenv("DATABASE_URL") or
        os.getenv("SPRING_DATASOURCE_URL") or
        os.getenv("spring.datasource.url") or
        "sqlite:///./test.db"
    ).strip()
    if url.startswith("jdbc:"):
        url = url[len("jdbc:"):]
    url = url.strip("'\" ")
    # Normalise any postgres scheme to the installed psycopg2 driver
    for prefix in ("postgresql+psycopg://", "postgresql+psycopg2://", "postgres://", "postgresql://"):
        if url.startswith(prefix):
            url = "postgresql://" + url[len(prefix):]
            break

    # Spring-style setups keep credentials in separate env vars; merge them in
    # when the URL itself carries none (this caused "no password supplied").
    if url.startswith("postgresql"):
        parts = urlsplit(url)
        if parts.password is None:
            user = parts.username or os.getenv("SPRING_DATASOURCE_USERNAME") or os.getenv("DB_USER")
            pwd = os.getenv("SPRING_DATASOURCE_PASSWORD") or os.getenv("DB_PASSWORD")
            if user and pwd:
                host = parts.hostname or ""
                if parts.port:
                    host += f":{parts.port}"
                netloc = f"{quote(user, safe='')}:{quote(pwd, safe='')}@{host}"
                url = urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    return url

class Settings(BaseSettings):
    DATABASE_URL: str = resolve_db_url()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "ai-expense-tracker-f2e94")
    CORS_ALLOWED_ORIGINS: str = os.getenv(
        "CORS_ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000,https://ai-expense-tracker-three-theta.vercel.app"
    )

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

def get_db_url(url: str) -> str:
    if url.startswith("jdbc:postgresql://"):
        return url.replace("jdbc:postgresql://", "postgresql://")
    return url

