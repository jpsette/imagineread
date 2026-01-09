import os
import io
import uuid
import re
import zipfile
import json
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image

from app.config import LIBRARY_DIR, TEMP_DIR, logger
from app.utils import resolve_local_path
from app.models import StoreRequest, ExportRequest, FileUpdateData
from app.database import get_db
from app import crud
from pdf2image import convert_from_bytes

router = APIRouter(tags=["Filesystem"])

@router.get("/filesystem")
def get_filesystem(db: Session = Depends(get_db)):
    entries = crud.get_all_filesystem_entries(db)
    # Map back to camelCase for frontend
    return [
        {
            "id": e.id,
            "name": e.name,
            "type": e.type,
            "parentId": e.parent_id,
            "url": e.url,
            "cleanUrl": e.clean_url,
            "isCleaned": e.is_cleaned,
            "createdAt": e.created_at,
            "isPinned": e.is_pinned,
            "balloons": e.balloons,
            "order": e.order
        }
        for e in entries
    ]

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
            new_pages_urls.append(full_url)
            
            # Create File
            crud.create_filesystem_entry(db, {
                "id": f"file-{unique_id}",
                "name": f"Page {i+1}",
                "type": "file",
                "parentId": pdf_folder_id,
                "url": full_url,
                "createdAt": datetime.now().isoformat(),
                "order": i
            })
            
        return {"status": "success", "page_count": len(images), "pages": new_pages_urls}
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_page")
async def upload_page(file: UploadFile = File(...), parent_id: str = Form(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        unique_id = str(uuid.uuid4())[:8]
        sanitized_name = re.sub(r'[^a-zA-Z0-9]', '_', file.filename.split('.')[0])
        filename = f"{sanitized_name}_{unique_id}.jpg"
        file_path = os.path.join(LIBRARY_DIR, filename)
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image.save(file_path, "JPEG", quality=90)
        
        full_url = f"http://127.0.0.1:8000/library/{filename}"
        
        crud.create_filesystem_entry(db, {
            "id": f"file-{unique_id}",
            "name": file.filename,
            "type": "file",
            "parentId": parent_id,
            "url": full_url,
            "createdAt": datetime.now().isoformat()
        })
        
        return {"status": "success", "url": full_url, "filename": filename}
        
    except Exception as e:
        logger.error(f"Error saving image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload_image")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Legacy alias"""
    return await upload_page(file, parent_id="root", db=db) # assuming parent_id default to root if not provided in legacy

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

@router.get("/store")
def get_store(db: Session = Depends(get_db)):
    # Reconstruct the legacy store object
    projects = crud.get_projects(db)
    entries = crud.get_all_filesystem_entries(db)
    
    projects_list = [{
            "id": p.id,
            "name": p.name,
            "color": p.color,
            "rootFolderId": p.root_folder_id,
            "createdAt": p.created_at,
            "lastModified": p.last_modified,
            "isPinned": p.is_pinned
    } for p in projects]
    
    fs_list = [{
            "id": e.id,
            "name": e.name,
            "type": e.type,
            "parentId": e.parent_id,
            "url": e.url,
            "cleanUrl": e.clean_url,
            "isCleaned": e.is_cleaned,
            "createdAt": e.created_at,
            "isPinned": e.is_pinned,
            "balloons": e.balloons,
            "order": e.order
    } for e in entries]

    return {"data": {"projects": projects_list, "fileSystem": fs_list}}

@router.post("/store")
def save_store(request: StoreRequest):
    # Deprecated for DB mode
    logger.warning("Attempted to call /store with DB enabled. Operation ignored.")
    return {"status": "success", "message": "Ignored in DB mode"}

@router.post("/admin/reset_data")
def reset_application_data(db: Session = Depends(get_db)):
    try:
        # DB Reset: delete all rows
        from app.models_db import Project, FileSystemEntry
        db.query(FileSystemEntry).delete()
        db.query(Project).delete()
        db.commit()
        logger.warning("♻️ DATA RESET COMPLETE (DB Truncated).")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Reset failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/files/{file_id}/data")
def update_file_data(file_id: str, update_data: FileUpdateData, db: Session = Depends(get_db)):
    try:
        # Update fields if provided
        if update_data.balloons is not None:
            updated = crud.update_file_balloons(db, file_id, update_data.balloons)
            if not updated:
                raise HTTPException(status_code=404, detail="File not found")
            return {"status": "success", "message": "File data updated"}
            
        return {"status": "success", "message": "No data to update"}
        
    except Exception as e:
        logger.error(f"Update File Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{entity_id}/export")
def export_project(entity_id: str, request: ExportRequest, db: Session = Depends(get_db)):
    try:
        # Fetch all needed data
        projects = crud.get_projects(db)
        # Convert to dict access for compatibility with below logic or adjust logic
        projects_dict = [{ "id": p.id, "name": p.name, "rootFolderId": p.root_folder_id } for p in projects]
        
        all_entries = crud.get_all_filesystem_entries(db)
        fs_list = [{
            "id": e.id, "name": e.name, "type": e.type, 
            "parentId": e.parent_id, "url": e.url
        } for e in all_entries]
        
        # Identify Target
        project = next((p for p in projects_dict if p["id"] == entity_id), None)
        if project:
            target_id = project["rootFolderId"]
            name = project["name"]
        else:
            folder = next((f for f in fs_list if f["id"] == entity_id and f["type"] == "folder"), None)
            if folder:
                target_id = folder["id"]
                name = folder["name"]
            else:
                raise HTTPException(status_code=404, detail="Project/Folder not found")

        # Collect Files (Recursive in Python)
        def get_files(fid):
            files = [f for f in fs_list if f.get("parentId") == fid and f.get("type") == "file"]
            for sub in [f for f in fs_list if f.get("parentId") == fid and f.get("type") == "folder"]:
                files.extend(get_files(sub["id"]))
            return files

        files = get_files(target_id)
        files.sort(key=lambda f: int(re.findall(r'\d+', f["name"])[0]) if re.findall(r'\d+', f["name"]) else 0)
        
        if not files: raise HTTPException(status_code=400, detail="Empty folder")

        safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name)
        
        # Export Logic
        if request.format in ["clean_images", "raw_images"]:
            suffix = "clean" if request.format == "clean_images" else "raw"
            zip_name = f"{safe_name}_{suffix}.zip"
            zip_path = os.path.join(TEMP_DIR, zip_name)
            
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for p in files:
                    path = resolve_local_path(p["url"])
                    if os.path.exists(path):
                        fname = p["name"]
                        if not fname.lower().endswith(('.jpg', '.png')): fname += ".jpg"
                        zipf.write(path, arcname=fname)
            return FileResponse(zip_path, media_type="application/zip", filename=zip_name)
            
        elif request.format == "json_data":
            json_name = f"{safe_name}_data.json"
            json_path = os.path.join(TEMP_DIR, json_name)
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump({"source_id": entity_id, "name": name, "files": files}, f, indent=2, ensure_ascii=False)
            return FileResponse(json_path, media_type="application/json", filename=json_name)
            
        elif request.format == "pdf":
            pdf_name = f"{safe_name}.pdf"
            pdf_path = os.path.join(TEMP_DIR, pdf_name)
            imgs = []
            for p in files:
                path = resolve_local_path(p["url"])
                if os.path.exists(path):
                    try: imgs.append(Image.open(path).convert("RGB"))
                    except: pass
            
            if imgs:
                imgs[0].save(pdf_path, "PDF", save_all=True, append_images=imgs[1:])
                return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_name)
            else:
                 raise HTTPException(status_code=400, detail="No valid images for PDF")
                 
        else:
            raise HTTPException(status_code=400, detail="Invalid format")

    except Exception as e:
        logger.error(f"Export Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
