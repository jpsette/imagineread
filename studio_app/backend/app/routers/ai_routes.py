from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models import AnalyzeRequest, CleanRequest, YOLOAnalyzeRequest, OCRRequest
from app.services.ai_service import analyze_page_layout, clean_page_content, execute_yolo, perform_ocr
from app.utils import logger, TEMP_DIR
from app.database import get_db
from app import crud

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
        clean_url, mask_url = clean_page_content(request.image_url, request.bubbles)
        if not clean_url: return {"clean_image_url": request.image_url}
        
        final_clean_url = f"http://127.0.0.1:8000/temp/{clean_url}"
        
        # PERSISTENCE LOGIC
        if request.file_id:
            try:
                # Use CRUD Update
                updated = crud.update_file_clean_status(db, request.file_id, final_clean_url)
                if updated:
                    logger.info(f"💾 Persisted clean URL for file {request.file_id}")
                else:
                    logger.warning(f"⚠️ Failed to find file {request.file_id} for persistence.")
            except Exception as e:
                logger.error(f"Failed to persist clean URL: {e}")

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
        from app.services.ai_service import detect_panels_cv2
        panels = detect_panels_cv2(request.image_path)
        return {"status": "success", "panels": panels}
    except Exception as e:
        logger.error(f"Panel Detection Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
