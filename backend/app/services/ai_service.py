import os
import json
import uuid
import subprocess
import io
import logging
from typing import List
from PIL import Image, ImageDraw, ImageFilter
from PIL import Image as PILImage
from google import genai
from google.genai import types

from app.config import (
    CREDENTIALS_PATH, PROJECT_ID, LOCATION, MODEL_ID, 
    TEMP_DIR, BASE_DIR, logger
)
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
def execute_yolo(image_path_or_url: str):
    """
    Executes the external YOLO script on a local image file.
    Critically, resolves URLs to local paths to avoid API deadlock.
    """
    # 1. CRITICAL: Resolve URL to Local Path to avoid Deadlock
    # If we pass a URL, YOLO tries to download it from our own API, 
    # which is blocked waiting for YOLO to finish.
    local_path = resolve_local_path(image_path_or_url)
    
    # 2. Validation
    if not os.path.exists(local_path):
        logger.error(f"Image not found at path: {local_path}")
        raise FileNotFoundError(f"Image file not found at: {local_path}")

    # 3. Path Setup
    # Go up one level from backend/app/services -> backend/app -> backend -> ROOT
    current_file_dir = os.path.dirname(os.path.abspath(__file__)) # services
    app_dir = os.path.dirname(current_file_dir) # app
    backend_dir = os.path.dirname(app_dir) # backend
    project_root = os.path.dirname(backend_dir) # Imagine Read root
    
    yolo_dir = os.path.join(project_root, "yolo_engine")
    python_exec = os.path.join(yolo_dir, "venv", "bin", "python")
    script_path = os.path.join(yolo_dir, "run_yolo.py")
    
    # Fallback if venv python not found
    if not os.path.exists(python_exec):
        logger.warning(f"YOLO venv python not found at {python_exec}. Using 'python3'.")
        python_exec = "python3"
    
    if not os.path.exists(script_path):
        raise Exception(f"YOLO Script not found at: {script_path}")

    command = [python_exec, script_path, local_path]
    logger.info(f"🚀 Running YOLO on local file: {local_path}")
    
    # 4. Execute
    try:
        # Timeout set to 120s to prevent infinite hangs
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            logger.error(f"❌ YOLO Process Failed: {result.stderr or result.stdout}")
            raise Exception(f"YOLO Error: {result.stderr or result.stdout}")
            
        try:
             # Extract JSON from potential stdout noise
            out = result.stdout
            idx_start = out.find('{')
            idx_end = out.rfind('}')
            if idx_start != -1 and idx_end != -1: out = out[idx_start:idx_end+1]
            return json.loads(out)
        except:
             logger.error(f"YOLO Parse Error. Output: {result.stdout}")
             return {"error": "JSON Parse Failed", "raw": result.stdout}
        
    except subprocess.TimeoutExpired:
        logger.error("❌ YOLO timed out")
        raise Exception("YOLO process timed out.")
    except Exception as e:
        logger.error(f"❌ Execution Error: {str(e)}")
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
        mask = PILImage.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        
        has_bubbles = False
        for b in bubbles:
            if 'box_2d' not in b: continue
            ymin, xmin, ymax, xmax = b['box_2d']
            x1, y1 = int((xmin/1000)*w_orig), int((ymin/1000)*h_orig)
            x2, y2 = int((xmax/1000)*w_orig), int((ymax/1000)*h_orig)
            draw.rectangle([x1, y1, x2, y2], fill=255)
            has_bubbles = True

        if not has_bubbles: return None, None
        
        mask = mask.filter(ImageFilter.MaxFilter(15))
        session_id = uuid.uuid4().hex[:6]
        mask_filename = f"mask_{session_id}.png"
        mask_path = os.path.join(TEMP_DIR, mask_filename)
        mask.save(mask_path)
        
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
            texts = json.loads(resp.text)
            for k, txt in enumerate(texts):
                if k < len(valid_indices): chunk[valid_indices[k]]['text'] = txt.strip()
        except Exception as e:
            logger.error(f"OCR Batch Error: {e}")
            # Fallback: If JSON parse fails, try to use raw text if it looks like a list
            try:
                 # Sanitize common JSON errors
                 sanitized = resp.text.replace('`', '').strip()
                 if sanitized.startswith('json'): sanitized = sanitized[4:]
                 texts = json.loads(sanitized)
                 for k, txt in enumerate(texts):
                    if k < len(valid_indices): chunk[valid_indices[k]]['text'] = txt.strip()
            except:
                 logger.error("OCR Fallback failed.")
            
    return balloons
