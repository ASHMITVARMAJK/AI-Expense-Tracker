import time
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, expenses, ai

# Create database tables automatically if they don't exist
Base.metadata.create_all(bind=engine)
print(">>> DATABASE CONNECTED:", engine.url)

app = FastAPI(title="SpendAI Python Backend", version="1.0.0")

# Setup CORS with local and configured origins
configured = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
default_local = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:3000"
]
allowed_origins = list(set(configured + default_local))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Rate Limiter Middleware for /api/ai/* endpoints
rate_limit_records = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 10
WINDOW_SECONDS = 60

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow preflight OPTIONS requests without rate limiting
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if path.startswith("/api/ai/"):
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        now = time.time()
        rate_limit_records[client_ip] = [
            t for t in rate_limit_records[client_ip] if now - t < WINDOW_SECONDS
        ]

        if len(rate_limit_records[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
            return Response(
                content='{"error": "Too many AI requests. Rate limit is 10 requests per minute. Please try again later."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )

        rate_limit_records[client_ip].append(now)

    return await call_next(request)

# Include Routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(ai.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "framework": "FastAPI (Python)"}
