from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config import logger
from app.database import get_db
from app.services.cleanup_service import cleanup_orphans

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

@router.post("/cleanup")
def run_cleanup(db: Session = Depends(get_db)):
    """
    Manually triggers the Garbage Collector to remove orphan files.
    """
    count = cleanup_orphans(db)
    return {"status": "success", "deleted_files": count}
