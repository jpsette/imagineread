from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.tile_service import tile_service

router = APIRouter(tags=["Deep Zoom Tiles"])

@router.get("/tiles/{image_id}/{zoom}/{x}/{y}")
def get_tile(image_id: str, zoom: int, x: int, y: int, db: Session = Depends(get_db)):
    """
    Serves a specific tile for deep zoom.
    Generates it on-demand if missing.
    """
    tile_path = tile_service.get_tile_path(image_id, zoom, x, y, db)
    
    if not tile_path:
        # Return 404 or a transparent placeholder?
        # 404 is better for debug.
        raise HTTPException(status_code=404, detail="Tile not found or could not be generated")
        
    return FileResponse(tile_path, media_type="image/jpeg")
