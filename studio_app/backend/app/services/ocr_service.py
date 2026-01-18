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

    # --- 3. CROP IMAGES ---
    for idx, b in enumerate(balloons):
        try:
            # Flexible coordinate handling (box or direct keys)
            box = b.get('box')
            if box:
                x, y, w, h = map(int, box)
                x2, y2 = x + w, y + h
            else:
                # Fallback if 'box' is missing but coordinates exist
                y1, x1, y2, x2 = int(b['y1']), int(b['x1']), int(b['y2']), int(b['x2'])
                x, y = x1, y1
            
            # Boundary Safety
            x, y = max(0, x), max(0, y)
            x2, y2 = min(full_img.width, x2), min(full_img.height, y2)
            
            if x2 <= x or y2 <= y: continue

            crop = full_img.crop((x, y, x2, y2))
            
            buf = io.BytesIO()
            crop.save(buf, "JPEG")
            
            inputs.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"))
            valid_indices.append(idx)
        except Exception as e:
            logger.error(f"⚠️ Crop error for balloon {idx}: {e}")
            continue

    if not valid_indices:
        return balloons

    # --- 4. SINGLE API EXECUTION ---
    try:
        logger.info(f"🚀 Sending 1 request with {len(valid_indices)} images to Gemini...")
        
        resp = client.models.generate_content(
            model=model_id, 
            contents=inputs,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        raw_text = resp.text
        if not raw_text:
             logger.warning("Empty response from Gemini")
             return balloons

        # --- 5. ROBUST PARSING (REGEX) ---
        json_data = []
        try:
            # Regex: Find first '[' and last ']' to ignore Markdown wrapper text
            match = re.search(r'\[.*\]', raw_text, re.DOTALL)
            if match:
                clean_json_str = match.group()
                json_data = json.loads(clean_json_str)
            else:
                json_data = json.loads(raw_text)
        except Exception as e:
             logger.warning(f"OCR JSON Parse Failed. raw: {raw_text[:50]}... Error: {e}")
             return balloons
        
        text_map = {item.get('index'): item.get('text', '') for item in json_data}

        for i, original_idx in enumerate(valid_indices):
            extracted_text = text_map.get(i, "")
            extracted_text = str(extracted_text).strip()
            balloons[original_idx]['text'] = extracted_text
            logger.info(f"✅ Blob {i} -> Text: {extracted_text[:30]}...")

        return balloons

    except Exception as e:
        logger.error(f"❌ Critical OCR Error: {e}")
        return balloons
