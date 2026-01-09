import cv2
import numpy as np
import json
import sys
import os
import torch

# Suppress Torch logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "lama.pt")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output", "inpainted")

def ceil_modulo(x, mod):
    if x % mod == 0:
        return x
    return (x // mod + 1) * mod

def pad_img_to_modulo(img, mod):
    channels, height, width = img.shape
    out_height = ceil_modulo(height, mod)
    out_width = ceil_modulo(width, mod)
    return np.pad(img, ((0, 0), (0, out_height - height), (0, out_width - width)), mode='reflect')

def run():
    try:
        # ARGS: 1=Image Path, 2=JSON Path
        if len(sys.argv) < 3:
            print(json.dumps({"status": "error", "message": "Missing arguments"}))
            return

        image_path = sys.argv[1]
        balloons_json_path = sys.argv[2] 

        if not os.path.exists(image_path):
             print(json.dumps({"status": "error", "message": f"Image not found: {image_path}"}))
             return

        # 1. Load Image
        img = cv2.imread(image_path) # BGR
        if img is None:
             print(json.dumps({"status": "error", "message": "Failed to load image"}))
             return
             
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # RGB
        
        # 2. Create Mask
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        
        if os.path.exists(balloons_json_path):
            with open(balloons_json_path, 'r') as f:
                data = json.load(f)
        else:
             print(json.dumps({"status": "error", "message": "JSON file not found"}))
             return

        # 2. Parse Balloons (Defensive)
        if hasattr(data, 'get'):
             balloons = data.get('balloons', [])
        elif isinstance(data, list):
             balloons = data
        else:
             balloons = []

        # 3. Create Mask
        mask = np.zeros(img.shape[:2], dtype=np.uint8)
        
        has_polygons = False
        for b in balloons:
            # Try polygon first
            polygon = b.get('polygon')
            points = []
            
            if polygon and len(polygon) > 0:
                points = np.array(polygon, np.int32)
            elif 'box' in b:
                # Fallback to box
                x, y, w, h = map(int, b['box'])
                points = np.array([[x, y], [x+w, y], [x+w, y+h], [x, y+h]], dtype=np.int32)
                
            if len(points) > 0:
                 # Flatten if needed (cv2.fillPoly expects [pts])
                 points = points.reshape((-1, 1, 2))
                 cv2.fillPoly(mask, [points], 255)
                 has_polygons = True
                 
        if not has_polygons:
             print(json.dumps({"status": "error", "message": "No valid polygons found."}))
             return

        # --- DILATION (Fix for thin masks/borders) ---
        kernel = np.ones((20, 20), np.uint8) 
        mask = cv2.dilate(mask, kernel, iterations=1)
        
        # --- DEBUG: SAVE MASK ---
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
        debug_mask_path = os.path.join(OUTPUT_DIR, "debug_mask_check.png")
        cv2.imwrite(debug_mask_path, mask)
        # ------------------------

        # 3. Preprocessing for LaMa (Native Torch)
        # Convert to floats [0, 1]
        img = img.astype(np.float32) / 255.0
        mask = mask.astype(np.float32) / 255.0
        
        # HWC (OpenCV) -> CHW (Torch)
        img = np.transpose(img, (2, 0, 1))
        mask = np.expand_dims(mask, 0) # [1, H, W]

        # Add Batch Dim -> [1, C, H, W]
        img = np.expand_dims(img, 0)
        mask = np.expand_dims(mask, 0)
        
        # Pad to multiple of 8
        batch_img = torch.from_numpy(img).float()
        batch_mask = torch.from_numpy(mask).float()
        
        # LaMa requires shape to be mod 8. 
        # But wait, does the model handle padding? Or do we need to pad?
        # Usually manually padding is safer.
        pad_mod = 8
        h, w = batch_img.shape[2], batch_img.shape[3]
        
        # Calculate padding needed
        ph = ceil_modulo(h, pad_mod) - h
        pw = ceil_modulo(w, pad_mod) - w
        
        if ph > 0 or pw > 0:
            batch_img = torch.nn.functional.pad(batch_img, (0, pw, 0, ph), mode='reflect')
            batch_mask = torch.nn.functional.pad(batch_mask, (0, pw, 0, ph), mode='reflect')
            
        # 4. Inference
        device = torch.device('cpu') 
        # Check MPS?
        if torch.backends.mps.is_available():
             device = torch.device('mps')
        
        model = torch.jit.load(MODEL_PATH, map_location='cpu') # Load to CPU first
        model.to(device)
        model.eval()
        
        batch_img = batch_img.to(device)
        batch_mask = batch_mask.to(device)
        
        with torch.no_grad():
            res = model(batch_img, batch_mask)
            
        # 5. Post-Processing
        res = res.cpu()
        
        # Crop back to original size
        res = res[:, :, :h, :w]
        
        # CHW -> HWC
        res = res[0].permute(1, 2, 0).numpy()
        
        # Un-normalize
        res = np.clip(res * 255, 0, 255).astype(np.uint8)
        res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
        
        # 6. Save
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            
        filename = os.path.basename(image_path)
        name, ext = os.path.splitext(filename)
        output_filename = f"{name}_CLEAN{ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        cv2.imwrite(output_path, res)
        
        # Return Abs Path
        abs_output_path = os.path.abspath(output_path)
        
        print(json.dumps({
            "status": "success",
            "cleaned_image": abs_output_path,
            "debug_mask": debug_mask_path
        }))

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    run()
