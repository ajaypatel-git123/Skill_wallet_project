"""Main FastAPI Application for Multimodal Construction Intelligence Platform."""

from contextlib import asynccontextmanager
import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables early
load_dotenv()

from database import get_history, init_db
from routers import assistant, crack, knowledge, planning, safety, valuation
from schemas import APIResponse

# Upload directory setup
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown procedures."""
    # Initialize SQLite database and tables
    init_db()
    yield


# Create FastAPI application
app = FastAPI(
    title="Construction Intelligence Platform",
    description="Multimodal AI-driven platform for construction safety, structural inspection, cost valuation, project planning, and engineering knowledge.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static uploaded files (inspection images)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register all feature routers
app.include_router(safety.router)
app.include_router(crack.router)
app.include_router(valuation.router)
app.include_router(planning.router)
app.include_router(assistant.router)
app.include_router(knowledge.router)


@app.get("/api/health", response_model=APIResponse, tags=["System"])
async def health_check():
    """Health check endpoint to verify backend service availability."""
    return APIResponse(
        success=True,
        data={
            "status": "healthy",
            "service": "Construction Intelligence Platform",
            "groq_configured": bool(os.getenv("GROQ_API_KEY") and os.getenv("GROQ_API_KEY") not in ("your_key_here", "your_groq_api_key_here")),
        },
    )


@app.get("/api/history", response_model=APIResponse, tags=["History"])
async def fetch_history(
    type: Optional[str] = Query(None, description="Filter history by analysis type (e.g. safety, crack, valuation, planning, daily, knowledge)"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of historical records to retrieve"),
):
    """Retrieve historical analysis records from SQLite database."""
    try:
        records = get_history(result_type=type, limit=limit)
        return APIResponse(success=True, data=records)
    except Exception as exc:
        return APIResponse(success=False, error=f"Failed to fetch history: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
