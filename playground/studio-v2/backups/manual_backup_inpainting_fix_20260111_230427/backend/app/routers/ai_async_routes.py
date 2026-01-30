from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models import YOLOAnalyzeRequest, OCRRequest
from app.services import ai_service
from app.services.job_manager import job_manager

router = APIRouter(prefix="/ai", tags=["AI Async"])

@router.post("/detect/async")
async def detect_async(request: YOLOAnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Starts an async YOLO detection job.
    Returns: {"job_id": "...", "status": "PENDING"}
    """
    job_id = job_manager.create_job("YOLO_DETECTION")
    background_tasks.add_task(ai_service.process_detection_job, job_id, request.image_path)
    return {"job_id": job_id, "status": "PENDING"}

@router.post("/ocr/async")
async def ocr_async(request: OCRRequest, background_tasks: BackgroundTasks):
    """
    Starts an async OCR job.
    Returns: {"job_id": "...", "status": "PENDING"}
    """
    job_id = job_manager.create_job("OCR_READING")
    background_tasks.add_task(ai_service.process_ocr_job, job_id, request.image_path, request.balloons)
    return {"job_id": job_id, "status": "PENDING"}
