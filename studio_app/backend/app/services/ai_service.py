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
from ultralytics import YOLO
import numpy as np

# Load Model Globallly (Singleton Pattern)
# Go up from backend/app/services -> backend/app -> backend -> root, then down to models
try:
    logger.info("🏗️ Starting YOLO Model Load...")
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_file_dir, '../models/comic_speech_bubble_seg_v1.pt')
    
    # Fallback to YOLOv8n-seg if specific model not found (dev safety)
    if not os.path.exists(model_path):
        logger.warning(f"⚠️ Custom model not found at {model_path}. Using standard yolov8n-seg.pt")
        model_path = "yolov8n-seg.pt"
    else:
        logger.info(f"✅ Loaded Custom YOLO Model: {model_path}")
        
    yolo_model = YOLO(model_path)
    logger.info("✅ YOLO Model Loaded Successfully")
    
except Exception as e:
    logger.error(f"❌ Failed to load YOLO model: {e}")
    yolo_model = None

def execute_yolo(image_path_or_url: str):
    """
    Executes YOLO directly using ultralytics library.
    Replaces legacy run_yolo.py script.
    """
    if not yolo_model:
        raise Exception("YOLO Model not loaded")

    # 1. Resolve Path
    local_path = resolve_local_path(image_path_or_url)
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Image not found: {local_path}")

    logger.info(f"🚀 Running YOLO (In-Memory) on: {local_path}")

    try:
        # 2. Run Inference
        # save=True matches legacy behavior to save debug images (can be disabled for speed)
        results = yolo_model.predict(
            source=local_path,
            save=True,
            conf=0.15,
            project=os.path.join(TEMP_DIR, "inference"),
            name="run",
            exist_ok=True,
            verbose=False
        )

        if not results:
             return {"status": "success", "balloons": [], "count": 0}

        result = results[0].cpu()
        balloons = []
        
        # 3. Process Boxes
        if result.boxes:
            for i, box in enumerate(result.boxes):
                conf = float(box.conf)
                if conf < 0.15: continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                w, h = x2 - x1, y2 - y1
                
                # Default Polygon (Box)
                polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
                
                # Try Mask for Polygon
                if result.masks is not None:
                     if hasattr(result.masks, 'xy') and len(result.masks.xy) > i:
                        raw_poly = result.masks.xy[i]
                        if len(raw_poly) > 0:
                            polygon = raw_poly.tolist()

                balloons.append({
                    "id": i,
                    "conf": round(conf, 2),
                    "box": [x1, y1, w, h],
                    "polygon": polygon
                })

        return {
            "status": "success",
            "balloons": balloons,
            "count": len(balloons),
            "image_output": result.save_dir
        }

    except Exception as e:
        logger.error(f"❌ YOLO Direct Execution Error: {e}")
        raise e


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
        
        # --- MASK GENERATION (Refactored to Spec) ---
        # Cria máscara preta
        mask = PILImage.new("L", (w_orig, h_orig), 0)
        draw = ImageDraw.Draw(mask)
        
        has_bubbles = False
        logger.info(f"🧼 [Backend] Generating Mask for {len(bubbles)} bubbles...")
        
        for i, b in enumerate(bubbles):
            # Input: [ymin, xmin, ymax, xmax] (0-1000)
            if 'box_2d' not in b: continue
            
            # Extract Normalized Coords
            box = b['box_2d']
            if len(box) != 4: continue
            
            ymin_n, xmin_n, ymax_n, xmax_n = box
            
            # Conversão para Pixels Absolutos
            x1 = int((xmin_n / 1000) * w_orig)
            y1 = int((ymin_n / 1000) * h_orig)
            x2 = int((xmax_n / 1000) * w_orig)
            y2 = int((ymax_n / 1000) * h_orig)
            
            logger.info(f"   🔹 Bubble {i}: Norm[{ymin_n}, {xmin_n}...] -> Pixels[{x1}, {y1}, {x2}, {y2}]")
            
            # PIL espera [x1, y1, x2, y2]
            draw.rectangle([x1, y1, x2, y2], fill=255)
            has_bubbles = True

        if not has_bubbles: 
            logger.warning("❌ No valid bubbles found to clean.")
            return None, None
        
        # Dilatação para cobrir a borda do balão (Essential!)
        # MaxFilter(25) expande a área branca em ~12px para cada lado
        logger.info("🔧 Applying Aggressive Dilation (MaxFilter 25)...")
        mask = mask.filter(ImageFilter.MaxFilter(25))
        
        # DEBUG: Salvar para verificação visual
        session_id = uuid.uuid4().hex[:6]
        mask_filename = f"mask_{session_id}.png"
        mask_path = os.path.join(TEMP_DIR, mask_filename)
        mask.save(mask_path)
        logger.info(f"✅ Mask saved to: {mask_path}")
        
        # --- END MASK GENERATION ---
        
        raw_ref = types.RawReferenceImage(reference_id=1, reference_image=types.Image.from_file(location=local_path))
        mask_ref = types.MaskReferenceImage(reference_id=2, reference_image=types.Image.from_file(location=mask_path), config=types.MaskReferenceConfig(mask_mode='MASK_MODE_USER_PROVIDED'))
        
        resp = client.models.edit_image(
            model='imagen-3.0-capability-001',
            prompt="Remove text bubbles. Fill with background texture. Maintain art style.",
            reference_images=[raw_ref, mask_ref],
            config=types.EditImageConfig(edit_mode='EDIT_MODE_INPAINT_INSERTION', number_of_images=1, guidance_scale=60.0, output_mime_type='image/png', negative_prompt="text, bubbles, artifacts")
        )
        
        temp_ai_path = os.path.join(TEMP_DIR, f"temp_ai_{session_id}.png")
        if resp.generated_images: resp.generated_images[0].image.save(temp_ai_path)
        else: raise Exception("No image generated by AI")
        
        # Copositing
        with PILImage.open(local_path) as orig, PILImage.open(temp_ai_path) as ai, PILImage.open(mask_path) as m:
            if ai.size != orig.size: ai = ai.resize(orig.size, PILImage.LANCZOS)
            orig.paste(ai, (0,0), m.convert("L"))
            
            clean_name = f"clean_{filename}"
            clean_path = os.path.join(TEMP_DIR, clean_name)
            orig.save(clean_path, quality=95)
        
        try: os.remove(temp_ai_path)
        except: pass
        
        return clean_name, mask_filename

def perform_ocr(image_path_or_url: str, balloons: List[dict]):
    if not client: raise Exception("GenAI Client not initialized")
    
    local_path = resolve_local_path(image_path_or_url)
    if not os.path.exists(local_path):
        raise Exception(f"Image not found at path: {local_path}")
    
    logger.info(f"📖 Starting OCR on: {os.path.basename(local_path)} with {len(balloons)} bubbles")

    full_img = Image.open(local_path)
    chunk_size = 10
    
    for i in range(0, len(balloons), chunk_size):
        chunk = balloons[i:i+chunk_size]
        prompt = "Read the text from each. Return JSON ARRAY of strings."
        payload = [types.Part.from_text(text=prompt)]
        valid_indices = []
        
        for idx, b in enumerate(chunk):
            box = b.get('box')
            if not box: continue
            x, y, w, h = map(int, box)
            
            # Safety crop
            x, y = max(0, x), max(0, y)
            w, h = min(full_img.width-x, w), min(full_img.height-y, h)
            if w <= 0 or h <= 0: continue

            crop = full_img.crop((x, y, x+w, y+h))
            buf = io.BytesIO()
            crop.save(buf, "JPEG")
            payload.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"))
            valid_indices.append(idx)
        
        if not valid_indices: continue
        
        try:
            resp = client.models.generate_content(
                model=MODEL_ID, contents=payload, 
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            
            # Sanitize response (Strip Markdown)
            # Sanitize response (Strip Markdown aggressively)
            raw_text = resp.text.strip()
            # Remove all markdown code block markers
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            if raw_text.endswith("```"):
                raw_text = raw_text.rstrip("```")
            
            # Additional Cleanup for Bad Escapes
            # Remove single backslashes that aren't escaping typical chars
            # raw_text = raw_text.replace("\\", "\\\\") # Too aggressive?
            
            try:
                # 1. Attempt strict parsing
                texts = json.loads(raw_text)
            except json.JSONDecodeError:
                # 2. Attempt permissive parsing
                try: 
                    texts = json.loads(raw_text, strict=False)
                except:
                     # 3. Fallback: Raw text as single result
                     logger.warning(f"OCR JSON Parse Failed. raw: {raw_text[:20]}...")
                     texts = [raw_text] if len(valid_indices) == 1 else []

            # Ensure texts is a list
            if not isinstance(texts, list):
                 texts = [str(texts)]

            for k, txt in enumerate(texts):
                if k < len(valid_indices): 
                    # Clean the individual text string
                    clean_txt = str(txt).strip()
                    chunk[valid_indices[k]]['text'] = clean_txt
                
        except Exception as e:
            logger.error(f"OCR Batch Error: {e}")
            # Fallback for the entire batch exception
            # We don't overwrite with empty, we just leave old text (or empty string)
            pass
            
    return balloons

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
