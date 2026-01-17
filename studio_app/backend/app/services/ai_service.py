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

import cv2
import numpy as np

# ... imports ...

def detect_panels_cv2(image_path: str):
    # 1. Resolve Path
    local_path = resolve_local_path(image_path)
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Image not found: {local_path}")
        
    # 2. Load Image
    img = cv2.imread(local_path)
    if img is None:
         return []
         
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 3. THRESHOLD: "Isolate Content"
    # Everything darker than 230 is content (White=Content, Black=Background)
    _, thresh = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)
    
    # 4. EROSION (The "Separator")
    # Instead of closing gaps, we ERODE to widen the gutters.
    # This ensures that even thin white lines break the connection between panels.
    kernel_size = 3
    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    
    # Erode twice to make sure panels are separated
    processed = cv2.erode(thresh, kernel, iterations=2)
    
    # 5. FIND CONTOURS (With Hierarchy)
    # RETR_TREE allows us to see if a box is inside another box
    contours, _ = cv2.findContours(processed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    panels = []
    
    # Area Filters
    min_area = (w * h) * 0.02  # 2% (Ignore noise)
    max_area = (w * h) * 0.85  # 85% (CRITICAL: Ignore the giant container box)

    # DEBUG IMAGE
    debug_img = img.copy()

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch # Use bounding box area for simpler filtering
        
        # LOGIC:
        # 1. Must be bigger than noise
        # 2. Must be SMALLER than the full page container (Fixes the single giant box issue)
        if area > min_area and area < max_area:
            
            # Aspect Ratio Sanity Check
            # Panels are rarely super thin strips
            aspect = cw / ch
            if aspect > 10 or aspect < 0.1:
                continue
                
            # Expand the box slightly back to original size 
            # (Since we eroded it, we add a tiny padding to compensate)
            padding = 5
            final_x = max(0, x - padding)
            final_y = max(0, y - padding)
            final_w = min(w - final_x, cw + (padding * 2))
            final_h = min(h - final_y, ch + (padding * 2))

            # Draw Blue Box for valid panels
            cv2.rectangle(debug_img, (final_x, final_y), (final_x + final_w, final_y + final_h), (255, 0, 0), 5)
            
            # Construct Panel Object (Maintains Backend Contract)
            panels.append({
                "id": f"panel_{uuid.uuid4().hex[:8]}", # Temporary ID
                "box_2d": [final_y, final_x, final_y+final_h, final_x+final_w], # [ymin, xmin, ymax, xmax]
                "points": [[final_x, final_y], [final_x+final_w, final_y], [final_x+final_w, final_y+final_h], [final_x, final_y+final_h]],
                "label": "panel"
            })
        else:
            # Draw Red Box for REJECTED panels (Too big or too small) - for debug
            cv2.rectangle(debug_img, (x, y), (x + cw, y + ch), (0, 0, 255), 2)

    # Sort by area (largest first) to ensure we keep the container, not the child
    # Area = (x2-x1) * (y2-y1)
    # box_2d is [y, x, y2, x2] so (x2-x) * (y2-y)
    panels.sort(key=lambda p: (p["box_2d"][3]-p["box_2d"][1]) * (p["box_2d"][2]-p["box_2d"][0]), reverse=True)

    final_panels = []
    
    for current in panels:
        c_y, c_x, c_y2, c_x2 = current["box_2d"]
        is_nested = False
        
        for kept in final_panels:
            k_y, k_x, k_y2, k_x2 = kept["box_2d"]
            
            # Check if 'current' is inside 'kept'
            # Allow small margin of error (padding)
            # Logic: c_x >= k_x AND c_x2 <= k_x2 AND c_y >= k_y AND c_y2 <= k_y2
            if c_x >= k_x and c_x2 <= k_x2 and c_y >= k_y and c_y2 <= k_y2:
                is_nested = True
                break
        
        if not is_nested:
            final_panels.append(current)

    # Re-sort Top-to-Bottom, Left-to-Right for UI order
    final_panels.sort(key=lambda p: (p["box_2d"][0] // 100, p["box_2d"][1]))
    
    # Re-assign IDs
    for idx, p in enumerate(final_panels):
        p["id"] = f"panel_{idx+1}"
        p["order"] = idx + 1
        
    return final_panels


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
    import time
    if not client: raise Exception("GenAI Client not initialized")
    
    local_path = resolve_local_path(image_path_or_url)
    if not os.path.exists(local_path):
        raise Exception(f"Image not found at path: {local_path}")
    
    logger.info(f"📖 Starting Single-Shot OCR on: {len(balloons)} bubbles")

    if not balloons:
        return balloons

    # --- 1. PREPARE INPUTS (Prompt + Images) ---
    # System Instruction: Ask for a JSON Array mapped by index
    prompt = """
    You are a Comic Book OCR Expert. 
    I will provide a series of images (crops of speech bubbles). 
    Your task:
    1. Read the text from EACH image strictly in the order provided.
    2. Return a RAW JSON Array of objects.
    3. Format: [{"index": 0, "text": "content..."}, {"index": 1, "text": "..."}]
    4. If a bubble is empty or unintelligible, return empty string for text.
    5. Do NOT include markdown formatting (like ```json). Just the raw JSON.
    """
    
    inputs = [types.Part.from_text(text=prompt)]

    valid_indices = []
    
    # Load Main Image (Using PIL as in existing code to avoid mixed dependencies/CV2 issues)
    full_img = Image.open(local_path)

    # --- 2. CROP ALL BALLOONS ---
    for idx, b in enumerate(balloons):
        try:
            # Parse coordinates (box is [x, y, w, h])
            # BUT wait, user snippet used y1,x1,y2,x2 from b['y1']... 
            # Existing code used b.get('box') -> x,y,w,h.
            # I MUST ADAPT TO EXISTING DATA STRUCTURE: b['box'] = [x, y, w, h]
            box = b.get('box')
            if not box: continue
            
            x, y, w, h = map(int, box)
            
            # Safety checks for boundaries
            x, y = max(0, x), max(0, y)
            w, h = min(full_img.width-x, w), min(full_img.height-y, h)
            
            if w <= 0 or h <= 0: continue

            # Crop
            crop = full_img.crop((x, y, x+w, y+h))
            
            # Convert to Bytes for API (Standard PIL -> Bytes)
            buf = io.BytesIO()
            crop.save(buf, "JPEG")
            
            inputs.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"))
            valid_indices.append(idx)
        except Exception as e:
            logger.error(f"⚠️ Crop error for balloon {idx}: {e}")
            continue

    if not valid_indices:
        return balloons

    # --- 3. SINGLE API EXECUTION (No Loop) ---
    try:
        logger.info(f"🚀 Sending 1 request with {len(valid_indices)} images to Gemini...")
        
        # *** EXECUTE API CALL ***
        resp = client.models.generate_content(
            model=MODEL_ID, 
            contents=inputs,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        # --- 4. PARSE RESPONSE ---
        raw_text = resp.text.strip()
        
        # Cleanup potential markdown
        if "```json" in raw_text:
            raw_text = raw_text.replace("```json", "").replace("```", "")
        if raw_text.startswith("```"): # generic
             raw_text = raw_text.replace("```", "")
        
        raw_text = raw_text.strip()
             
        try:
            json_data = json.loads(raw_text)
        except:
             # Fallback check
             logger.warning(f"OCR JSON Parse Failed. raw: {raw_text[:50]}...")
             return balloons
        
        # Create map for O(1) lookup
        text_map = {item.get('index'): item.get('text', '') for item in json_data}

        # Map back to IDs using the preserved order
        # valid_indices maps the API input order (0, 1, 2...) to original balloon index
        for i, original_idx in enumerate(valid_indices):
            extracted_text = text_map.get(i, "")
            
            # Clean text
            extracted_text = str(extracted_text).strip()
            
            # Assign to original balloon
            balloons[original_idx]['text'] = extracted_text
            logger.info(f"✅ Blob {i} -> Text: {extracted_text[:30]}...")

        return balloons

    except Exception as e:
        logger.error(f"❌ Critical OCR Error: {e}")
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
