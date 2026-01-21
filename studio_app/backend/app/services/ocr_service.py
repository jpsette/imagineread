import os
import json
import io
import re
from typing import List
from PIL import Image
from google.genai import types
from loguru import logger
from app.utils import resolve_local_path

def perform_ocr(image_path_or_url: str, balloons: List[dict], client, model_id: str):
    """
    Executes Single-Shot OCR using Gemini Vision.
    Uses Regex to robustly extract JSON from the model response.
    """
    # --- 1. VALIDATION ---
    if not client: 
        raise Exception("GenAI Client not initialized")
    
    local_path = resolve_local_path(image_path_or_url)
    if not os.path.exists(local_path):
        raise Exception(f"Image not found at path: {local_path}")
    
    logger.info(f"📖 Starting Single-Shot OCR on: {len(balloons)} bubbles")

    if not balloons:
        return balloons

    # --- 2. PREPARE INPUTS ---
    prompt = """
    You are a Comic Book OCR Expert. 
    Task: Read text from the provided speech bubble images.
    Output: A STRICT JSON Array.
    Format: [{"index": 0, "text": "detected text"}, {"index": 1, "text": "..."}]
    Rules:
    - Return ONLY the JSON Array.
    - If empty, use empty string "".
    - Escape double quotes properly inside the text.
    """
    
    inputs = [types.Part.from_text(text=prompt)]
    valid_indices = []
    
    try:
        full_img = Image.open(local_path)
    except Exception as e:
        logger.error(f"Failed to open image: {e}")
        return balloons

    # --- 3. STITCHING (ATLAS STRATEGY) ---
    crops_info = [] # Store (image, original_index)
    
    for idx, b in enumerate(balloons):
        try:
            # Flexible coordinate handling
            box = b.get('box')
            if box:
                x, y, w, h = map(int, box)
                x2, y2 = x + w, y + h
            else:
                y1, x1, y2, x2 = int(b['y1']), int(b['x1']), int(b['y2']), int(b['x2'])
                x, y = x1, y1
            
            # Boundary Safety
            x, y = max(0, x), max(0, y)
            x2, y2 = min(full_img.width, x2), min(full_img.height, y2)
            
            if x2 <= x or y2 <= y: continue

            crop = full_img.crop((x, y, x2, y2))
            crops_info.append({"img": crop, "idx": idx})
            
        except Exception as e:
            logger.error(f"⚠️ Crop error for balloon {idx}: {e}")
            continue

    if not crops_info:
        logger.warning("No valid crops found.")
        return balloons

    # Create Atlas (Vertical Strip with Padding for Labels)
    from PIL import ImageDraw
    
    PADDING = 20
    LABEL_HEIGHT = 20
    
    # Calculate dimensions
    max_w = max(c["img"].width for c in crops_info)
    total_h = sum(c["img"].height + PADDING + LABEL_HEIGHT for c in crops_info)
    
    # Create Canvas (White Background)
    atlas_img = Image.new('RGB', (max_w, total_h), (255, 255, 255))
    draw = ImageDraw.Draw(atlas_img)
    
    current_y = 0
    valid_indices = []
    
    for item in crops_info:
        img = item["img"]
        idx = item["idx"]
        
        # Draw Label
        draw.text((0, current_y), f"ID: {idx}", fill="red")
        
        # Paste Image
        atlas_img.paste(img, (0, current_y + LABEL_HEIGHT))
        
        valid_indices.append(idx)
        current_y += img.height + PADDING + LABEL_HEIGHT

    # Debug: Save Atlas (Optional, helpful for debugging 429s too)
    # atlas_img.save(f"temp_atlas_{len(valid_indices)}.jpg")

    buf = io.BytesIO()
    atlas_img.save(buf, "JPEG", quality=85)
    
    # Update Inputs: Text Prompt + 1 Image
    prompt_atlas = """
    You are a Comic Book OCR Expert. 
    Task: Read text from the provided image, which contains multiple cropped speech bubbles stitched together vertically.
    Each bubble is labeled with a red "ID: X" above it.
    
    Output: A STRICT JSON Array mapping ID to Text.
    Format: [{"index": 0, "text": "detected text"}, {"index": 1, "text": "..."}]
    
    Rules:
    - Look for the red "ID: X" label to identify the index.
    - Return ONLY the JSON Array.
    - If empty, use empty string "".
    - Escape double quotes.
    """
    
    inputs = [
        types.Part.from_text(text=prompt_atlas),
        types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg")
    ]

    import time
    import random

    # --- 4. SINGLE API EXECUTION WITH RETRY ---
    MAX_RETRIES = 5
    base_delay = 1
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            logger.info(f"🚀 Sending ATLAS request (Attempt {attempt+1}/{MAX_RETRIES+1}) to Gemini...")
            
            resp = client.models.generate_content(
                model=model_id, 
                contents=inputs,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            
            raw_text = resp.text
            if not raw_text:
                 logger.warning("Empty response from Gemini")
                 return balloons
            
            # If successful, break and proceed to parsing
            break
            
        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str
            
            if is_rate_limit and attempt < MAX_RETRIES:
                delay = (base_delay * (2 ** attempt)) + (random.randint(0, 1000) / 1000)
                logger.warning(f"⚠️ 429 Rate Limit hit. Retrying in {delay:.2f}s...")
                time.sleep(delay)
                continue
            else:
                logger.error(f"❌ Critical OCR Error (Final): {e}")
                return balloons

    # --- 5. ROBUST PARSING (REGEX) ---
    json_data = [] # ... rest of processing uses raw_text from above
    try:
        # Regex: Find first '[' and last ']' to ignore Markdown wrapper text
        match = re.search(r'\[.*\]', raw_text, re.DOTALL)
        if match:
            clean_json_str = match.group()
        else:
            clean_json_str = raw_text

        # --- SANITIZER (Fix Common LLM JSON Errors) ---
        try:
            # 1. Fix unescaped backslashes (e.g., "C:\path" -> "C:\\path")
            clean_json_str = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', clean_json_str)
            
            # 2. Fix trailing commas (e.g., {"a":1,} -> {"a":1})
            clean_json_str = re.sub(r',\s*]', ']', clean_json_str)
            clean_json_str = re.sub(r',\s*}', '}', clean_json_str)

            json_data = json.loads(clean_json_str)
        except json.JSONDecodeError:
            logger.warning("Sanitized JSON parse failed, trying raw...")
            if match:
                json_data = json.loads(match.group())
            else:
                    json_data = json.loads(raw_text)
    except Exception as e:
            logger.warning(f"OCR JSON Parse Failed. raw: {raw_text[:50]}... Error: {e}")
            return balloons
    
    text_map = {item.get('index'): item.get('text', '') for item in json_data}

    for original_idx in valid_indices:
        extracted_text = text_map.get(original_idx, "")
        extracted_text = str(extracted_text).strip()
        balloons[original_idx]['text'] = extracted_text
        logger.info(f"✅ Blob {original_idx} -> Text: {extracted_text[:30]}...")

    return balloons
