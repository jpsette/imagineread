import os
import numpy as np
from ultralytics import YOLO
from loguru import logger
from app.config import TEMP_DIR
from app.utils import resolve_local_path

# --- YOLO INITIALIZATION (Singleton) ---
yolo_model = None
try:
    logger.info("🏗️ Starting YOLO Model Load...")
    # Go up from backend/app/services -> backend/app -> backend -> root, then down to models
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_file_dir, '../models/comic_speech_bubble_seg_v1.pt')
    
    # Fallback to YOLOv8n-seg if specific model not found (dev safety)
    if not os.path.exists(model_path):
        logger.warning(f"⚠️ Custom model not found at {model_path}. Using standard yolov8n-seg.pt")
        model_path = "yolov8n-seg.pt"
    else:
        logger.info(f"✅ Loaded Custom YOLO Model: {model_path}")
        
    yolo_model = YOLO(model_path)
    logger.info("✅ YOLO Model Loaded Successfully in balloon_service")
    
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
            imgsz=1920, # HIGH RESOLUTION (Balanced for Simplification)
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
                
                # Try Mask for Polygon with SMART SIMPLIFICATION
                if result.masks is not None:
                     if hasattr(result.masks, 'xy') and len(result.masks.xy) > i:
                        raw_poly = result.masks.xy[i]
                        
                        if len(raw_poly) > 0:
                            # 1. Convert to integer numpy array for OpenCV
                            try:
                                import cv2
                                # Reshape for cv2: (N, 1, 2)
                                contour = raw_poly.astype(np.int32).reshape(-1, 1, 2)
                                
                                # 2. Calculate Perimeter (arcLength)
                                peri = cv2.arcLength(contour, True)
                                
                                # 3. Apply Douglas-Peucker Simplification
                                # Epsilon = 0.2% of perimeter.
                                # - 0.001 (0.1%): Very faithful, keeps some noise.
                                # - 0.003 (0.3%): "Comic Style" (Smoothed but organic).
                                # - 0.010 (1.0%): Geometric/Low Poly.
                                epsilon = 0.003 * peri
                                approx = cv2.approxPolyDP(contour, epsilon, True)
                                
                                # 4. Convert back to list of [x, y]
                                # Reshape back to (N, 2)
                                if len(approx) > 2:
                                    polygon = approx.reshape(-1, 2).tolist()
                                else:
                                    # Fallback if simplification destroyed the shape
                                    polygon = raw_poly.tolist()
                                    
                            except ImportError:
                                logger.warning("⚠️ OpenCV (cv2) not found. Using raw polygon.")
                                polygon = raw_poly.tolist()
                            except Exception as e:
                                logger.error(f"⚠️ Polygon Simplification Failed: {e}")
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
