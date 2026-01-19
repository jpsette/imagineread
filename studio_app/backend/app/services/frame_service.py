import os
import cv2
import uuid
import shutil
import numpy as np
from app.utils import resolve_local_path
from loguru import logger
from app.config import TEMP_DIR

def detect_frames(image_path: str):
    # 1. Resolve Path
    local_path = resolve_local_path(image_path)
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Image not found: {local_path}")
        
    # 2. Load Image
    img = cv2.imread(local_path)
    if img is None:
         return []
         
    h_img, w_img = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 3. STABLE LOGIC: THRESHOLD & EROSION
    _, thresh = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)
    
    kernel_size = 3
    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    processed = cv2.erode(thresh, kernel, iterations=2)
    
    # 4. STABLE LOGIC: FIND CONTOURS
    contours, _ = cv2.findContours(processed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_frames = []
    
    # Area Filters
    min_area = (w_img * h_img) * 0.02 
    max_area = (w_img * h_img) * 0.90 

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch 
        
        if area > min_area and area < max_area:
            aspect = cw / float(ch)
            if aspect > 10 or aspect < 0.1:
                continue
                
            padding = 5
            final_x = max(0, x - padding)
            final_y = max(0, y - padding)
            final_w = min(w_img - final_x, cw + (padding * 2))
            final_h = min(h_img - final_y, ch + (padding * 2))

            raw_frames.append({
                "box_2d": [final_y, final_x, final_y+final_h, final_x+final_w],
                "area": final_w * final_h
            })

    # 5. STABLE LOGIC: NESTED FILTER
    raw_frames.sort(key=lambda x: x["area"], reverse=True)
    
    final_frames = []
    
    for current in raw_frames:
        c_y, c_x, c_y2, c_x2 = current["box_2d"]
        is_nested = False
        
        for kept in final_frames:
            k_y, k_x, k_y2, k_x2 = kept["box_2d"]
            
            inter_x1 = max(c_x, k_x)
            inter_y1 = max(c_y, k_y)
            inter_x2 = min(c_x2, k_x2)
            inter_y2 = min(c_y2, k_y2)
            
            if inter_x1 < inter_x2 and inter_y1 < inter_y2:
                inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
                current_area = (c_x2 - c_x) * (c_y2 - c_y)
                
                if inter_area / current_area > 0.50:
                    is_nested = True
                    break
        
        if not is_nested:
            final_frames.append(current)

    # 6. SORT READING ORDER
    final_frames.sort(key=lambda p: (p["box_2d"][0] // 100, p["box_2d"][1]))
    
    # --- DEBUG: PREPARE FOLDER ---
    debug_dir = os.path.join(TEMP_DIR, "debug_frames")
    os.makedirs(debug_dir, exist_ok=True)

    # 7. FORMAT OUTPUT
    result_frames = []
    for idx, p in enumerate(final_frames):
        y1, x1, y2, x2 = map(int, p["box_2d"])
        
        # --- DEBUG: SAVE IMAGE ---
        try:
            crop = img[y1:y2, x1:x2]
            save_path = os.path.join(debug_dir, f"frame_{idx+1}.jpg")
            cv2.imwrite(save_path, crop)
        except Exception as e:
            logger.error(f"Failed to save debug image: {e}")
        # -------------------------

        p["id"] = f"frame_{idx+1}"
        p["order"] = idx + 1
        p["label"] = "frame"
        p["points"] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
        
        if "area" in p: del p["area"]
        
        result_frames.append(p)
        
    logger.info(f"✅ Detected {len(result_frames)} frames. Debug images saved to: {debug_dir}")
    return result_frames
