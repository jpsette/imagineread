from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models import AnalyzeRequest, CleanRequest, YOLOAnalyzeRequest, OCRRequest
from app.database import get_db
from app import crud
from app.utils import logger, TEMP_DIR

# --- SERVICE IMPORTS ---
# AI Service acts as orchestrator for Layout and Cleaning
from app.services.ai_service import analyze_page_layout, clean_page_content, perform_ocr
# Dedicated Services for Detection
from app.services.frame_service import detect_frames
from app.services.balloon_service import execute_yolo

router = APIRouter(tags=["AI"])

@router.post("/analyze_page")
async def analyze_page(request: AnalyzeRequest):
    try:
        return analyze_page_layout(request.image_url)
    except Exception as e:
        logger.error(f"Analyze Page Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clean_page")
async def clean_page(request: CleanRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"🧼 [AI Router] Clean Request for {request.image_url}")
        logger.info(f"   -> Balloons Count: {len(request.bubbles)}")
        if request.bubbles:
            logger.info(f"   -> Sample Balloon: {request.bubbles[0]}")
            
        clean_url, mask_url = clean_page_content(request.image_url, request.bubbles)
        if not clean_url: return {"clean_image_url": request.image_url}
        
        final_clean_url = f"http://127.0.0.1:8000/temp/{clean_url}"
        
        final_clean_url = f"http://127.0.0.1:8000/temp/{clean_url}"
        
        # PERSISTENCE LOGIC REMOVED (Moved to Manual Save)
        # We only return the URLs for preview; user must explicitly Save to persist.

        return {
            "clean_image_url": final_clean_url,
            "debug_mask_url": f"http://127.0.0.1:8000/temp/{mask_url}" if mask_url else None
        }
    except Exception as e:
        logger.error(f"Clean Page Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analisar-yolo")
async def analisar_yolo(request: YOLOAnalyzeRequest):
    try:
        # Calls the dedicated Balloon Service
        return execute_yolo(request.image_path)
    except Exception as e:
        logger.error(f"YOLO Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ler-texto")
async def read_text(request: OCRRequest):
    try:
        updated_balloons = perform_ocr(request.image_path, request.balloons)
        return {"status": "success", "balloons": updated_balloons}
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analisar-quadros")
async def analisar_quadros(request: YOLOAnalyzeRequest):
    try:
        # Calls the dedicated Frame Service
        frames = detect_frames(request.image_path)
        # Returns 'panels' key for Frontend compatibility
        return {"status": "success", "panels": frames}
    except Exception as e:
        logger.error(f"Panel Detection Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
