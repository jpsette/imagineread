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
        result = perform_ocr(request.image_path, request.balloons)
        return {
            "status": "success", 
            "balloons": result.get("balloons", []),
            "detected_language": result.get("detected_language")
        }
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

# --- TRANSLATION ENDPOINT ---
from app.models import TranslationRequest
from app.services.translation_service import translate_texts
from app.config import MODEL_ID

@router.post("/traduzir")
async def translate(request: TranslationRequest):
    try:
        # Import client dynamically to get the initialized instance
        from app.services.ai_service import client
        
        logger.info(f"🌐 Translation request: {request.source_lang} → {request.target_lang} ({len(request.texts)} texts)")
        
        result = translate_texts(
            texts=request.texts,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
            client=client,
            model_id=MODEL_ID,
            context=request.context,
            glossary=[{"original": t.original, "translation": t.translation} for t in request.glossary] if request.glossary else None
        )
        
        return {
            "status": "success" if result["success"] else "error",
            "translations": result.get("translations", []),
            "error": result.get("error")
        }
    except Exception as e:
        logger.error(f"Translation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
