import os
import json
import uuid

import io
from typing import List
from PIL import Image, ImageDraw, ImageFilter
from PIL import Image as PILImage
from google import genai
from google.genai import types

from loguru import logger 

from app.config import (
    CREDENTIALS_PATH, PROJECT_ID, LOCATION, MODEL_ID, 
    TEMP_DIR, BASE_DIR
)

# Remove logger from config import above
# We are importing it from loguru directly

from app.utils import resolve_local_path

# --- AI CLIENT INIT ---
client = None

def init_genai_client():
    global client
    if os.path.exists(CREDENTIALS_PATH):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
        logger.info(f"🔑 Auth Env Set: {CREDENTIALS_PATH}")
    else:
        logger.warning(f"⚠️ credentials.json not found at: {CREDENTIALS_PATH}")

    try:
        logger.info("🔌 Initializing Vertex AI Client (Modern SDK)...")
        client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
        logger.info("✅ GenAI Client Ready!")
    except Exception as e:
        logger.error(f"❌ Failed to init GenAI Client: {e}")
        client = None

# --- YOLO SERVICE ---
from .balloon_service import execute_yolo





# --- VERTEX AI SERVICES ---
def analyze_page_layout(image_path: str):
    if not client: raise Exception("GenAI Client not initialized")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    logger.info(f"🚀 Analyzing page with {MODEL_ID}...")
    prompt = """
    Analyze this comic book page. Detect **Speech Bubbles** and **Captions**.
    Instructions:
    1. Return JSON Array: [{ "text": "...", "box_2d": [ymin, xmin, ymax, xmax] }]
    2. Coordinates scale 0-1000. Box strictly encloses bubble.
    """
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            types.Part.from_text(text=prompt)
        ],
        config=types.GenerateContentConfig(
            temperature=0.0, max_output_tokens=8192, response_mime_type="application/json"
        )
    )
    
    clean_text = response.text.replace("```json", "").replace("```", "").strip()
    data = json.loads(clean_text)
    
    # Normalize
    normalized = []
    for item in data:
        if not item.get("text") or len(str(item.get("text")).strip()) < 2: continue
        box = item.get("box_2d") or item.get("box") or item.get("bounding_box")
        if box and isinstance(box, list) and len(box) == 4:
            item["box_2d"] = box
            normalized.append(item)
            
            
    return normalized

# --- FRAME SERVICE ---
from .frame_service import detect_frames




def clean_page_content(image_path_or_url: str, bubbles: List[dict]):
    if not client: raise Exception("GenAI Client not initialized")
    
    local_path = resolve_local_path(image_path_or_url)
    if not os.path.exists(local_path): 
        raise Exception(f"Image not found at path: {local_path}")

    # FIX: Always use Original Source for Cleaning
    # If we detect a temp/clean file, try to find the original in library
    filename = os.path.basename(local_path)
    if "_clean" in filename or "clean_" in filename:
        logger.info("ℹ️ Detected cleaning request on already cleaned file. Reverting to original.")
        # Attempt to reconstruct original filename
        # Pattern 1: clean_page_X_ID.jpg -> page_X_ID.jpg
        # Pattern 2: clean_filename.jpg -> filename.jpg
        original_name = filename.replace("clean_", "").replace("clean", "")
        
        # Check Library
        from app.config import LIBRARY_DIR
        potential_path = os.path.join(LIBRARY_DIR, original_name)
        
        if os.path.exists(potential_path):
            local_path = potential_path
            logger.info(f"✅ Found original source in Library: {local_path}")
        else:
             # Try Temp just in case
             potential_path_temp = os.path.join(TEMP_DIR, original_name)
             if os.path.exists(potential_path_temp):
                 local_path = potential_path_temp
                 logger.info(f"✅ Found original source in Temp: {local_path}")

    filename = os.path.basename(local_path)
    
    with PILImage.open(local_path) as img:
        w_orig, h_orig = img.size
        
        # --- MASK GENERATION (via Service) ---
        from app.services.mask_service import create_mask_from_bubbles
        mask = create_mask_from_bubbles(w_orig, h_orig, bubbles)
        
        if mask is None:
            return None, None
        
        # DEBUG: Salvar para verificação visual
        session_id = uuid.uuid4().hex[:6]
        mask_filename = f"mask_{session_id}.png"
        mask_path = os.path.join(TEMP_DIR, mask_filename)
        mask.save(mask_path)
        logger.info(f"✅ Mask saved to: {mask_path}")
        
        # --- END MASK GENERATION ---
        
        # --- INPAINTING (via Service) ---
        from app.services.inpainting_service import clean_page_content as execute_inpainting
        clean_name = execute_inpainting(client, local_path, mask_path, filename)
        
        return clean_name, mask_filename

from app.services.ocr_service import perform_ocr as execute_ocr_logic

def perform_ocr(image_path_or_url: str, balloons: List[dict]):
    """
    Delegates OCR task to the dedicated OCR Service.
    """
    # Pass the global client and model_id from this module
    return execute_ocr_logic(image_path_or_url, balloons, client, MODEL_ID)

# --- ASYNC JOB WRAPPERS ---
from app.services.job_manager import job_manager, JobState

def process_detection_job(job_id: str, image_path: str):
    """
    Wrapper to run YOLO in background and update job state.
    """
    try:
        job_manager.update_job(job_id, JobState.PROCESSING)
        
        # Run Synchronous Logic
        result = execute_yolo(image_path)
        
        if result.get("status") == "success":
             job_manager.update_job(job_id, JobState.COMPLETED, result=result)
        else:
             job_manager.update_job(job_id, JobState.FAILED, error="YOLO execution returned failure status")
             
    except Exception as e:
        logger.error(f"❌ Async Detection Job Failed: {e}")
        job_manager.update_job(job_id, JobState.FAILED, error=str(e))

def process_ocr_job(job_id: str, image_path: str, balloons: List[dict]):
    """
    Wrapper to run OCR in background and update job state.
    """
    try:
        job_manager.update_job(job_id, JobState.PROCESSING)
        
        # Run Synchronous Logic
        updated_balloons = perform_ocr(image_path, balloons)
        
        job_manager.update_job(job_id, JobState.COMPLETED, result={"status": "success", "balloons": updated_balloons})
             
    except Exception as e:
        logger.error(f"❌ Async OCR Job Failed: {e}")
        job_manager.update_job(job_id, JobState.FAILED, error=str(e))
