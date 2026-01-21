import sys
from loguru import logger
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.types import Scope # Needed for the override
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.config import TEMP_DIR, LIBRARY_DIR
from app.services.ai_service import init_genai_client
from app.routers import (
    project_routes,
    # file_routes,  <-- REMOVED (Legacy)
    ai_routes,
    system_routes,
    job_routes,
    ai_async_routes
)
from app.routers.filesystem import core as fs_core
from app.routers.filesystem import uploads as fs_uploads
from app.routers.filesystem import exports as fs_exports
from app.database import engine, Base
import app.models_db

# Configure Loguru
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
)

# --- CUSTOM STATIC FILES CLASS TO FORCE CORS ---
# This fixes the issue where mounted apps bypass global middleware
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope: Scope):
        response = await super().get_response(path, scope)
        # Force allow origin on the file response itself
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
# -----------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # STARTUP
    logger.info("🚀 Starting Imagine Read Engine (Modularized)...")
    Base.metadata.create_all(bind=engine)
    init_genai_client()
    yield
    # SHUTDOWN
    logger.info("👋 Shutting down Imagine Read Engine...")
    
    # Auto-Cleanup on Shutdown
    from app.database import SessionLocal
    from app.services.cleanup_service import cleanup_orphans
    try:
        db = SessionLocal()
        cleanup_orphans(db)
        db.close()
    except Exception as e:
        logger.error(f"Shutdown cleanup failed: {e}")

app = FastAPI(title="Imagine Read Engine", lifespan=lifespan)

# CORS (Global - Keep for API routes)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "app://."
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UPDATED MOUNTS ---
# Use CORSStaticFiles instead of standard StaticFiles
app.mount("/temp", CORSStaticFiles(directory=TEMP_DIR), name="temp")
app.mount("/library", CORSStaticFiles(directory=LIBRARY_DIR), name="library")
# ----------------------

# Include Routers
app.include_router(project_routes.router)
# app.include_router(file_routes.router) <-- REMOVED
app.include_router(fs_core.router)
app.include_router(fs_uploads.router)
app.include_router(fs_exports.router)

app.include_router(ai_routes.router)
app.include_router(system_routes.router)
app.include_router(job_routes.router)
app.include_router(ai_async_routes.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Imagine Read Engine (Modular)"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
