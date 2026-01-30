from fastapi import APIRouter
from app.config import logger

router = APIRouter(tags=["System"])

@router.get("/version")
def get_version():
    """
    Returns the current version and status of the backend.
    Used for health checks and diagnostics.
    """
    logger.info("Health check requested")
    return {
        "version": "1.0.0",
        "status": "running",
        "component": "studio_backend"
    }
