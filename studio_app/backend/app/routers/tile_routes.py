from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.tile_service import tile_service
import os

router = APIRouter(tags=["Deep Zoom Tiles"])


# IMPORTANT: Specific routes must come BEFORE generic routes!
# Otherwise FastAPI will match "local" as an image_id

@router.get("/tiles/local/{zoom}/{x}/{y}")
def get_local_tile(zoom: int, x: int, y: int, path: str = Query(..., description="Absolute path to local image file")):
    """
    Serves a tile for a LOCAL file (not in database).
    Used for imported PDFs/images that haven't been uploaded to cloud.
    """
    # Security: Basic path validation
    if not path.startswith('/'):
        raise HTTPException(status_code=400, detail="Path must be absolute")
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    
    tile_path = tile_service.get_tile_for_local_path(path, zoom, x, y)
    
    if not tile_path:
        raise HTTPException(status_code=404, detail="Tile could not be generated")
        
    return FileResponse(tile_path, media_type="image/jpeg")


@router.get("/tiles/{image_id}/{zoom}/{x}/{y}")
def get_tile(image_id: str, zoom: int, x: int, y: int, db: Session = Depends(get_db)):
    """
    Serves a specific tile for deep zoom.
    Generates it on-demand if missing.
    """
    tile_path = tile_service.get_tile_path(image_id, zoom, x, y, db)
    
    if not tile_path:
        raise HTTPException(status_code=404, detail="Tile not found or could not be generated")
        
    return FileResponse(tile_path, media_type="image/jpeg")

