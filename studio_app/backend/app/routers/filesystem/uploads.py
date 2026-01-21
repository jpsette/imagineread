import os
import io
import uuid
import re
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image
from pdf2image import convert_from_bytes
from loguru import logger

from app.database import get_db
from app import crud
from app.config import LIBRARY_DIR, TEMP_DIR
from app.utils import resolve_local_path

router = APIRouter(tags=["Filesystem Uploads"])

@router.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...), parent_id: str = Form(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        contents = await file.read()
        images = convert_from_bytes(contents, fmt='jpeg')
        
        pdf_folder_id = f"folder-{uuid.uuid4().hex[:8]}"
        pdf_name = file.filename.replace(".pdf", "")
        
        # Create Folder
        crud.create_filesystem_entry(db, {
            "id": pdf_folder_id,
            "name": pdf_name,
            "type": "folder",
            "parentId": parent_id,
            "createdAt": datetime.now().isoformat()
        })
        
        base_url = "http://127.0.0.1:8000/library"
        new_pages_urls = []
        
        for i, image in enumerate(images):
            unique_id = uuid.uuid4().hex[:8]
            filename = f"page_{i + 1}_{unique_id}.jpg"
            save_path = os.path.join(LIBRARY_DIR, filename)
            image.save(save_path, "JPEG")
            
            full_url = f"{base_url}/{filename}"
            
            # Create File (Explicit Commit)
            from app.models_db import FileSystemEntry
            new_file = FileSystemEntry(
                id=f"file-{unique_id}",
                name=f"Page {i+1}",
                type="file",
                parent_id=pdf_folder_id,
                url=full_url,
                created_at=datetime.now().isoformat(),
                order=i
            )
            db.add(new_file)
            db.commit()
            db.refresh(new_file)

            new_pages_urls.append({"id": new_file.id, "url": full_url, "name": new_file.name})
            
        return {"status": "success", "page_count": len(images), "pages": new_pages_urls}
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_page")
async def upload_page(file: UploadFile = File(...), parent_id: str = Form(...), db: Session = Depends(get_db)):
    # Relaxed Validation: Check Content-Type OR Extension
    is_image_mime = file.content_type.startswith("image/")
    is_image_ext = file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif'))
    
    if not (is_image_mime or is_image_ext):
        logger.warning(f"⚠️ Rejected file upload: {file.filename} (Type: {file.content_type})")
        raise HTTPException(status_code=400, detail=f"File must be an image. Got: {file.filename}")
    
    try:
        unique_id = str(uuid.uuid4())[:8]
        entry_id = f"file-{unique_id}"
        sanitized_name = re.sub(r'[^a-zA-Z0-9]', '_', file.filename.split('.')[0])
        filename = f"{sanitized_name}_{unique_id}.jpg"
        file_path = os.path.join(LIBRARY_DIR, filename)
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image.save(file_path, "JPEG", quality=90)
        
        full_url = f"http://127.0.0.1:8000/library/{filename}"
        
        # Explicit DB Commit (Bypassing CRUD for safety)
        from app.models_db import FileSystemEntry
        # Check if ID collision (unlikely but good practice)
        
        new_entry = FileSystemEntry(
            id=entry_id,
            name=file.filename,
            type="file",
            parent_id=parent_id,
            url=full_url,
            created_at=datetime.now().isoformat()
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        logger.info(f"✅ Created File Entry in DB (Explicit v4): {entry_id} ({file.filename})")
        
        return {"status": "success", "url": full_url, "filename": filename, "id": entry_id}
        
    except Exception as e:
        logger.error(f"Error saving image: {e}")
        db.rollback() # Safety rollback
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_image")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Legacy alias"""
    return await upload_page(file, parent_id="root", db=db) 

@router.get("/thumbnail")
async def get_thumbnail(url: str, width: int = 300):
    # Thumbnail logic relies on file existence, no DB needed
    try:
        original_path = resolve_local_path(url)
        if not os.path.exists(original_path):
             raise HTTPException(status_code=404, detail="Image not found")

        thumbs_dir = os.path.join(TEMP_DIR, "thumbs")
        os.makedirs(thumbs_dir, exist_ok=True)
        
        filename = os.path.basename(original_path)
        thumb_filename = f"{width}_{filename}"
        thumb_path = os.path.join(thumbs_dir, thumb_filename)

        if os.path.exists(thumb_path):
            return FileResponse(thumb_path)

        with Image.open(original_path) as img:
            img = img.convert("RGB")
            aspect_ratio = img.height / img.width
            new_height = int(width * aspect_ratio)
            img.thumbnail((width, new_height))
            img.save(thumb_path, "JPEG", quality=85)

        return FileResponse(thumb_path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
    except Exception as e:
        logger.error(f"Thumbnail Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
