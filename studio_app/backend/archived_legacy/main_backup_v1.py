import os
import shutil
import uuid
import json
import subprocess
from typing import List
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pdf2image import convert_from_bytes
from PIL import Image
import io

app = FastAPI(title="Imagine Read Engine")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
CREDENTIALS_PATH = os.path.join(BASE_DIR, "credentials.json")

# Ensure temp directory exists
os.makedirs(TEMP_DIR, exist_ok=True)

# Configure CORS to allow requests from the Electron frontend
origins = [
    "http://localhost:5173",  # Vite default dev port
    "http://127.0.0.1:5173",
    "app://."                 # Electron production scheme (if used)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the temp directory to serve static files (images)
app.mount("/temp", StaticFiles(directory=TEMP_DIR), name="temp")

# Debug Credentials on Startup
if os.path.exists(CREDENTIALS_PATH):
    try:
        with open(CREDENTIALS_PATH, 'r') as f:
            creds = json.load(f)
            project_id = creds.get('project_id') or creds.get('quota_project_id')
            print("-" * 50)
            print(f"✅ CREDENTIALS.JSON FOUND!")
            print(f"📁 PROJECT ID: {project_id}")
            print("-" * 50)
    except Exception as e:
        print(f"❌ Error reading credentials.json: {e}")
else:
    print(f"⚠️ credentials.json not found at: {CREDENTIALS_PATH}")

class AnalyzeRequest(BaseModel):
    image_url: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Imagine Read Engine"}

def clear_temp_dir():
    """Helper to clear the temp directory to avoid clutter (optional strategy)."""
    for filename in os.listdir(TEMP_DIR):
        file_path = os.path.join(TEMP_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Clear previous session files (simplification for this local tool)
        clear_temp_dir()

        contents = await file.read()
        
        # Convert PDF to images
        # fmt='jpeg' and thread_count can be tuned.
        images = convert_from_bytes(contents, fmt='jpeg')
        
        image_urls = []
        base_url = "http://127.0.0.1:8000/temp"

        for i, image in enumerate(images):
            # Create a unique filename implementation
            filename = f"page_{i + 1}_{uuid.uuid4().hex[:8]}.jpg"
            save_path = os.path.join(TEMP_DIR, filename)
            image.save(save_path, "JPEG")
            
            # Construct URL
            image_urls.append(f"{base_url}/{filename}")

        return {
            "status": "success",
            "page_count": len(images),
            "pages": image_urls
        }

    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/thumbnail")
async def get_thumbnail(url: str, width: int = 300):
    try:
        # 1. Resolve Path
        # The frontend sends "http://127.0.0.1:8000/temp/..."
        # We need to extract the filename relative to TEMP_DIR
        
        filename = url.split('/')[-1]
        original_path = os.path.join(TEMP_DIR, filename)
        
        if not os.path.exists(original_path):
             # Fail safely (return 404 implies broken image)
             raise HTTPException(status_code=404, detail="Image not found")

        # 2. Prepare Cache Directory
        thumbs_dir = os.path.join(TEMP_DIR, "thumbs")
        os.makedirs(thumbs_dir, exist_ok=True)

        # 3. Check Cache
        thumb_filename = f"{width}_{filename}"
        thumb_path = os.path.join(thumbs_dir, thumb_filename)

        if os.path.exists(thumb_path):
            return FileResponse(thumb_path)

        # 4. Generate Thumbnail
        with Image.open(original_path) as img:
            # Convert to RGB (in case of RGBA/PNG)
            if img.mode in ("RGBA", "P"):
                 img = img.convert("RGB")
            
            # Calculate Height preserving aspect ratio
            aspect_ratio = img.height / img.width
            new_height = int(width * aspect_ratio)
            
            # Resize
            img.thumbnail((width, new_height))
            
            # Save to Cache
            img.save(thumb_path, "JPEG", quality=85)

        headers = {"Cache-Control": "public, max-age=31536000, immutable"}
        return FileResponse(thumb_path, headers=headers)

    except Exception as e:
        print(f"Thumbnail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# --- CONFIG ---
PROJECT_ID = "seismic-mantis-483123-g8"
LOCATION = "us-central1"
MODEL_ID = "gemini-2.0-flash-exp" # User requested "2.5 flash", mapping to 2.0 Flash Exp

# --- GLOBAL GENAI CLIENT ---
from google import genai
from google.genai import types

print("🔌 Initializing Vertex AI Client (Modern SDK)...")
# Explicitly set credentials for the SDK to find
if os.path.exists(CREDENTIALS_PATH):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
    print(f"🔑 Auth Env Set: {CREDENTIALS_PATH}")
else:
    print("⚠️ credentials.json not found! SDK might fail.")

try:
    # Initialize Client Globally
    client = genai.Client(
        vertexai=True, 
        project=PROJECT_ID, 
        location=LOCATION
    )
    print("✅ GenAI Client Ready!")
except Exception as e:
    print(f"❌ Failed to init GenAI Client: {e}")
    client = None

@app.post("/analyze_page")
async def analyze_page(request: AnalyzeRequest):
    if not client:
        raise HTTPException(status_code=500, detail="GenAI Client not initialized.")

    # 1. Resolve Local Image
    try:
        filename = request.image_url.split("/")[-1]
        local_image_path = os.path.join(TEMP_DIR, filename)
        if not os.path.exists(local_image_path):
             raise HTTPException(status_code=404, detail="Imagem não encontrada no servidor")

        # 2. Read Image
        with open(local_image_path, "rb") as image_file:
            image_bytes = image_file.read()

        # 3. Construct Request using Modern SDK
        print(f"🚀 Sending Request to {MODEL_ID} via google-genai SDK...")
        
        prompt_text = """
        Analyze this comic book page. Detect **Speech Bubbles** and **Captions**.
        Instructions:
        1. Return the **Bounding Box** exactly as `[ymin, xmin, ymax, xmax]`.
        2. `ymin` is the top edge, `xmin` is the left edge.
        3. Coordinates must be on a scale of 0 to 1000.
        4. Box must strictly enclose the bubble text.
        
        Return JSON Array: [{ "text": "...", "box_2d": [ymin, xmin, ymax, xmax] }]
        """
        
        # Structure content for SDK
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt_text)
                ],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    max_output_tokens=8192,
                    response_mime_type="application/json"
                )
            )
            
            # 4. Parse Response
            raw_text = response.text
            
            # Clean Markdown
            clean_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            # Bracket Finder (Robustness)
            start = clean_text.find('[')
            end = clean_text.rfind(']')
            if start != -1 and end != -1:
                clean_text = clean_text[start:end+1]
            
            print(f"🔍 AI Raw Output: {clean_text}")
            
            data = json.loads(clean_text)
            
            # Normalize Keys
            normalized_data = []
            for item in data:
                # Ensure text
                if not item.get("text") or len(str(item.get("text")).strip()) < 2:
                    continue
                
                # Normalize box
                if "box" in item and "box_2d" not in item:
                    item["box_2d"] = item["box"]
                elif "bounding_box" in item and "box_2d" not in item:
                    item["box_2d"] = item["bounding_box"]
                
                # Check formatting
                if "box_2d" in item:
                    # Ensure numeric list
                    box = item["box_2d"]
                    if isinstance(box, list) and len(box) == 4:
                        normalized_data.append(item)

            return normalized_data

        except Exception as e:
            print(f"❌ GenAI SDK Error: {e}")
            raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

    except Exception as e:
        print(f"General Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from PIL import Image as PILImage, ImageDraw

class CleanRequest(BaseModel):
    image_url: str
    bubbles: List[dict] # Expecting objects with 'box_2d'

@app.post("/clean_page")
async def clean_page(request: CleanRequest):
    try:
        # 1. Parse Image Path
        filename = request.image_url.split('/')[-1]
        local_image_path = os.path.join(TEMP_DIR, filename)
        
        if not os.path.exists(local_image_path):
            raise HTTPException(status_code=404, detail="Image file not found")

        # 2. Create SINGLE Consolidated Mask for all bubbles
        print(f"🎨 Creating consolidated mask for {len(request.bubbles)} bubbles...")
        
        with PILImage.open(local_image_path) as img:
            w_orig, h_orig = img.size
            
            # Create Black Mask (Background = keep original)
            mask = PILImage.new("L", img.size, 0)
            draw = ImageDraw.Draw(mask)
            
            has_bubbles = False
            for b in request.bubbles:
                if 'box_2d' not in b: continue
                
                # Get coords
                ymin, xmin, ymax, xmax = b['box_2d']
                
                x1 = int((xmin / 1000) * w_orig)
                y1 = int((ymin / 1000) * h_orig)
                x2 = int((xmax / 1000) * w_orig)
                y2 = int((ymax / 1000) * h_orig)
                
                # Draw white rectangle on mask (Area to erase)
                draw.rectangle([x1, y1, x2, y2], fill=255)
                has_bubbles = True

            if not has_bubbles:
                return {"clean_image_url": request.image_url}

            # Save temporary mask
            session_id = uuid.uuid4().hex[:6]
            mask_filename = f"full_mask_{session_id}.png"
            mask_path = os.path.join(TEMP_DIR, mask_filename)
            mask.save(mask_path)

            # 4. Single AI Call (Full Image + Full Mask) with Google Gen AI SDK
            print(f"🚀 Sending SINGLE request to Imagen (Google Gen AI SDK)...")
            
            # Prepare inputs using the new SDK types
            # We use the global 'client' initialized at startup
            
            try:
                # Load images
                raw_ref_image = types.RawReferenceImage(
                    reference_id=1,
                    reference_image=types.Image.from_file(location=local_image_path)
                )
                
                # For basic inpainting, we can sometimes use just RawReference and MaskReference
                mask_ref_image = types.MaskReferenceImage(
                    reference_id=2,
                    reference_image=types.Image.from_file(location=mask_path),
                    config=types.MaskReferenceConfig(
                        mask_mode='MASK_MODE_USER_PROVIDED' # Explicitly stating we provide the mask
                    )
                )
                
                response = client.models.edit_image(
                    model='imagen-3.0-capability-001',
                    prompt="high quality, seamless fill, comic book style background, graphic novel art",
                    reference_images=[raw_ref_image, mask_ref_image],
                    config=types.EditImageConfig(
                        edit_mode='EDIT_MODE_INPAINT_INSERTION', # We are inserting background
                        number_of_images=1,
                        guidance_scale=21.0,
                        output_mime_type='image/png',
                        negative_prompt="text, bubbles, speech bubbles, artifacts, blur, words, letters, distortion"
                    )
                )
                
                # 5. Smart Compositing (The "Zero Distortion" Fix)
                # Instead of saving the AI result directly (which might be lower res),
                # We paste the AI result ONLY where the mask is white, keeping the rest of the original 100% intact.
                
                # Save AI result temp
                # New SDK response structure: response.generated_images[0].image.image_bytes
                temp_ai_path = os.path.join(TEMP_DIR, f"temp_ai_{session_id}.png")
                
                if response.generated_images and len(response.generated_images) > 0:
                   response.generated_images[0].image.save(temp_ai_path)
                else:
                   raise Exception("No image generated by AI")
                
                with PILImage.open(local_image_path) as original_img:
                    with PILImage.open(temp_ai_path) as ai_img:
                        with PILImage.open(mask_path) as mask_img:
                            
                            # Ensure AI result matches original size (Imagen might resize)
                            if ai_img.size != original_img.size:
                                ai_img = ai_img.resize(original_img.size, PILImage.LANCZOS)
                            
                            # Ensure mask is L mode (grayscale) for compositing
                            mask_img = mask_img.convert("L")
                            
                            # Composite: Base = Original, Overlay = AI, Mask = Mask
                            # original_img.paste(ai_img, (0,0), mask_img) works by pasting ai_img ONLY where mask is white
                            original_img.paste(ai_img, (0, 0), mask_img)
                            
                            # Save Final
                            clean_filename = f"clean_{filename}"
                            clean_path = os.path.join(TEMP_DIR, clean_filename)
                            original_img.save(clean_path, quality=95)

                # Cleanup temp
                try: 
                    os.remove(mask_path) 
                    os.remove(temp_ai_path)
                except: pass
                
                return {
                    "clean_image_url": f"http://127.0.0.1:8000/temp/{clean_filename}"
                }

            except Exception as e:
                print(f"❌ GenAI Error: {e}")
                raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")

    except Exception as e:
        print(f"Cleaning Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



def executar_yolo_na_imagem(caminho_da_imagem):
    root_dir = os.path.dirname(BASE_DIR)
    python_exec = os.path.join(root_dir, "yolo_engine", "venv", "bin", "python")
    script_path = os.path.join(root_dir, "yolo_engine", "run_yolo.py")
    
    # Verify paths exist
    if not os.path.exists(python_exec):
         raise Exception(f"YOLO Python not found at {python_exec}")
    if not os.path.exists(script_path):
         raise Exception(f"YOLO Script not found at {script_path}")

    command = [python_exec, script_path, caminho_da_imagem]
    
    print(f"Running YOLO command: {command}")
    
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode != 0:
        # Try to parse error from stdout/stderr if valid json
        raise Exception(f"YOLO Error: {result.stderr or result.stdout}")
        
    return result.stdout

class YOLOAnalyzeRequest(BaseModel):
    image_path: str

@app.post("/analisar-yolo")
async def analisar_yolo(request: YOLOAnalyzeRequest):
    try:
        image_path = request.image_path
        
        # Resolve URL to local path if needed
        if image_path.startswith("http"):
             filename = image_path.split('/')[-1]
             image_path = os.path.join(TEMP_DIR, filename)

        if not os.path.exists(image_path):
             raise HTTPException(status_code=404, detail=f"Image not found at {image_path}")

        output_str = executar_yolo_na_imagem(image_path)
        
        # Robust Parsing: Extract valid JSON substring (ignoring potential log noise)
        try:
            start_index = output_str.find('{')
            end_index = output_str.rfind('}')
            
            if start_index != -1 and end_index != -1 and end_index > start_index:
                clean_json_str = output_str[start_index : end_index + 1]
                output_data = json.loads(clean_json_str)
            else:
                # If no braces found, try parsing raw (will likely fail/throw)
                output_data = json.loads(output_str)
                
        except Exception:
             # Fallback: Return raw output for debugging
             print(f"Failed to parse YOLO output: {output_str}")
             output_data = {"raw_output": output_str, "error": "JSON Parse Failed"}

        return output_data

    except Exception as e:
        print(f"YOLO Endpoint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import uuid

def executar_ocr_nos_baloes(caminho_da_imagem, balloons_json):
    root_dir = os.path.dirname(BASE_DIR)
    python_exec = os.path.join(root_dir, "yolo_engine", "venv", "bin", "python")
    script_path = os.path.join(root_dir, "yolo_engine", "run_ocr.py")
    
    if not os.path.exists(python_exec):
         raise Exception(f"OCR Python not found at {python_exec}")
         
    # Save balloons to a temp file
    temp_filename = f"temp_balloons_{uuid.uuid4()}.json"
    temp_filepath = os.path.join(TEMP_DIR, temp_filename)
    
    # Wrapper object
    data_wrapper = {"balloons": balloons_json}
    
    with open(temp_filepath, "w") as f:
         json.dump(data_wrapper, f)
    
    command = [python_exec, script_path, caminho_da_imagem, temp_filepath]
    
    print(f"Running OCR command with temp file: {temp_filepath}")
    
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode != 0:
             print(f"OCR STDERR: {result.stderr}")
             raise Exception(f"OCR Error: {result.stderr or result.stdout}")
             
        return result.stdout
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filepath):
             os.remove(temp_filepath)

class OCRRequest(BaseModel):
    image_path: str
    balloons: list

# --- VERTEX AI OCR (HYBRID MODE) ---
async def read_text_from_crops_vertex(image_path: str, balloons: List[dict]):
    """
    Crops balloons from the image and sends them to Vertex AI for text extraction.
    Processing in batches to respect API limits.
    """
    if not client:
        print("❌ GenAI Client not ready for OCR.")
        return balloons

    print(f"🪄 Starting Vertex AI OCR for {len(balloons)} balloons...")
    
    try:
        # Load Full Image
        full_img = Image.open(image_path)
        img_w, img_h = full_img.size
        
        # Prepare Batch
        # We will simply send a list of images to the model with a prompt.
        # For better mapping, we process in chunks (e.g. 10 at a time).
        chunk_size = 10
        total_balloons = len(balloons)
        
        for i in range(0, total_balloons, chunk_size):
            chunk = balloons[i : i + chunk_size]
            print(f"   Processing batch {i} to {min(i+chunk_size, total_balloons)}...")
            
            payload_contents = []
            
            # Add Prompt first
            prompt = """
            Read the text from each of the following comic book speech bubbles. 
            Return a JSON ARRAY of strings, where each string is the text of the corresponding image in order.
            Example: ["Hello there", "Stop!", ""]
            If a bubble is empty or contains no text, use an empty string. 
            Do not include Markdown formatting in your response. Just the raw JSON array.
            """
            payload_contents.append(types.Part.from_text(text=prompt))
            
            # Add Images
            valid_indices_in_chunk = [] # Track which balloons in this chunk were actually added (valid crops)
            
            for idx, balloon in enumerate(chunk):
                box = balloon.get('box') # [x, y, w, h]
                if not box: 
                    continue
                    
                x, y, w, h = map(int, box)
                
                # Padding (Same strategy as before, safely)
                padding = 5
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(img_w, x + w + padding)
                y2 = min(img_h, y + h + padding)
                
                crop = full_img.crop((x1, y1, x2, y2))
                
                # Upscale tiny crops for Model clarity (optional, but good for stability)
                if h < 50 or w < 50:
                     crop = crop.resize((crop.width * 2, crop.height * 2), Image.BICUBIC)
                
                # To Bytes
                buf = io.BytesIO()
                crop.save(buf, format="JPEG", quality=90)
                image_bytes = buf.getvalue()
                
                payload_contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
                valid_indices_in_chunk.append(idx)
            
            if not valid_indices_in_chunk:
                continue
                
            # Send to Vertex
            try:
                response = client.models.generate_content(
                    model=MODEL_ID,
                    contents=payload_contents,
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        max_output_tokens=4000,
                        response_mime_type="application/json"
                    )
                )
                
                # Parse
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                extracted_texts = json.loads(clean_json)
                
                # Map back to balloons
                # extracted_texts is a list of strings [text1, text2...]
                # valid_indices_in_chunk maps the order: 0th image -> chunk[valid_indices_in_chunk[0]]
                
                for k, text_result in enumerate(extracted_texts):
                    if k < len(valid_indices_in_chunk):
                         original_chunk_idx = valid_indices_in_chunk[k]
                         chunk[original_chunk_idx]['text'] = text_result.strip()
                         
            except Exception as e:
                print(f"❌ Error in Vertex Batch: {e}")
                
    except Exception as emain:
         print(f"❌ Error in Hybrid OCR: {emain}")

    return balloons


# --- INPAINTING (LAMA) ---
@app.post("/limpar-imagem")
async def clean_image(request: OCRRequest):
    """
    Receives text detection data (box/polygon).
    Runs local LaMa Inpainting script to remove bubbles.
    """
    # 1. Save input to temp JSON
    temp_json_path = os.path.join(TEMP_DIR, f"clean_payload_{uuid.uuid4()}.json")
    try:
        # Resolve Image Path
        image_path = request.image_path
        if image_path.startswith("http"):
             filename = image_path.split('/')[-1]
             image_path = os.path.join(TEMP_DIR, filename)

        if not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")

        with open(temp_json_path, 'w') as f:
            json.dump({"balloons": request.balloons}, f)

        # 2. Run Script
        script_path = os.path.join(BASE_DIR, "..", "yolo_engine", "run_inpainting.py")
        
        # Determine python path (same venv as yolo)
        # Note: We installed lama-cleaner in the SAME venv as yolo
        python_bin = os.path.join(BASE_DIR, "..", "yolo_engine", "venv", "bin", "python")
        
        print(f"🎨 Running Inpainting on {image_path}...")
        result = subprocess.run(
            [python_bin, script_path, image_path, temp_json_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("❌ Inpainting Script Error:", result.stderr)
            raise HTTPException(status_code=500, detail=f"Inpainting Error: {result.stderr}")

        # 3. Parse Output
        output_str = result.stdout.strip()
        print("Inpainting Output:", output_str)
        
        try:
            # Robust JSON extraction
            start_idx = output_str.find('{')
            end_idx = output_str.rfind('}')
            clean_json_str = output_str[start_idx:end_idx+1]
            data = json.loads(clean_json_str)
            
            clean_abs_path = data.get("cleaned_image")
            debug_mask_abs_path = data.get("debug_mask")
            
            response_data = {"status": "success"}

            if clean_abs_path:
                 filename = os.path.basename(clean_abs_path)
                 new_path = os.path.join(TEMP_DIR, filename)
                 shutil.copy(clean_abs_path, new_path)
                 response_data["clean_image_url"] = f"http://127.0.0.1:8000/temp/{filename}"
                 response_data["local_path"] = new_path
                 
            if debug_mask_abs_path:
                 mask_filename = os.path.basename(debug_mask_abs_path)
                 new_mask_path = os.path.join(TEMP_DIR, mask_filename)
                 shutil.copy(debug_mask_abs_path, new_mask_path)
                 response_data["debug_mask_url"] = f"http://127.0.0.1:8000/temp/{mask_filename}"
                 
            return response_data

        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Inpainting Failed: {e}")

    finally:
        if os.path.exists(temp_json_path):
             os.remove(temp_json_path)


@app.post("/ler-texto")
async def read_text(request: OCRRequest):
    """
    Receives image path and balloons.
    Executes HYBRID OCR: 
    - Detection was done (balloons passed in).
    - Recognition is done via Vertex AI (Gemini).
    """
    image_path = request.image_path
    
    # Resolve URL to local path if needed (Fix for "Image path not found")
    if image_path.startswith("http"):
         filename = image_path.split('/')[-1]
         image_path = os.path.join(TEMP_DIR, filename)

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail=f"Image path not found: {image_path}")

    # Use Vertex AI implementation
    updated_balloons = await read_text_from_crops_vertex(image_path, request.balloons)
    
    return {
        "status": "success",
        "balloons": updated_balloons
    }


# --- PERSISTENCE ---
DATA_FILE = os.path.join(BASE_DIR, "data.json")

class StoreRequest(BaseModel):
    data: dict

@app.get("/store")
def get_store():
    if not os.path.exists(DATA_FILE):
        return {"data": None}
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
        return {"data": data}
    except Exception as e:
        print(f"Error reading data.json: {e}")
        return {"data": None}

@app.post("/store")
def save_store(request: StoreRequest):
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(request.data, f, indent=2)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
