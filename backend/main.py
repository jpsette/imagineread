import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.config import logger, TEMP_DIR, LIBRARY_DIR
from app.services.ai_service import init_genai_client
from app.routers import project_routes, file_routes, ai_routes
from app.database import engine, Base
import app.models_db # Import models so they are registered with Base

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # STARTUP
    logger.info("🚀 Starting Imagine Read Engine (Modularized)...")
    Base.metadata.create_all(bind=engine) # Ensure DB Tables exist
    init_genai_client()
    yield
    # SHUTDOWN
    logger.info("👋 Shutting down Imagine Read Engine...")

app = FastAPI(title="Imagine Read Engine", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "app://."],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Mounts
app.mount("/temp", StaticFiles(directory=TEMP_DIR), name="temp")
app.mount("/library", StaticFiles(directory=LIBRARY_DIR), name="library")

# Include Routers
app.include_router(project_routes.router)
app.include_router(file_routes.router)
app.include_router(ai_routes.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Imagine Read Engine (Modular)"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
