from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.config import logger
from app.database import get_db
from app.services.cleanup_service import cleanup_orphans
import os

router = APIRouter(tags=["System"])

@router.get("/version")
def get_version():
    """
    Returns the current version and status of the backend.
    Used for health checks and diagnostics.
    """
    logger.info("Health check requested")
    return {
        "version": "1.0.0",
        "status": "running",
        "component": "studio_backend"
    }

@router.post("/cleanup")
def run_cleanup(db: Session = Depends(get_db)):
    """
    Manually triggers the Garbage Collector to remove orphan files.
    """
    count = cleanup_orphans(db)
    return {"status": "success", "deleted_files": count}


# === LOCAL PDF EXTRACTION ===
class ExtractPDFRequest(BaseModel):
    pdf_path: str  # Absolute path to PDF file
    output_dir: str  # Directory to save extracted pages (usually next to PDF)

@router.post("/extract_pdf_pages")
async def extract_pdf_pages(request: ExtractPDFRequest):
    """
    Extracts pages from a local PDF file and saves them as JPEG images.
    Used for opening local PDF comics in the Workstation.
    Saves to .origin/ folder (hidden from user).
    """
    from pdf2image import convert_from_path
    from app.services.local_storage_service import local_storage_service
    from app.config import LOCAL_PROJECT_FOLDERS
    
    pdf_path = request.pdf_path
    output_dir = request.output_dir
    
    logger.info(f"📄 Extracting PDF: {pdf_path} -> {output_dir}")
    
    # Validate PDF exists
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF not found: {pdf_path}")
    
    # Create .origin directory (hidden folder for original pages)
    origin_folder = LOCAL_PROJECT_FOLDERS["origin"]
    origin_dir = os.path.join(output_dir, origin_folder)
    os.makedirs(origin_dir, exist_ok=True)
    
    try:
        # Extract pages from PDF
        images = convert_from_path(pdf_path, fmt='jpeg', dpi=150)
        
        extracted_pages = []
        for i, image in enumerate(images):
            page_num = i + 1
            filename = f"page_{page_num:03d}.jpg"
            save_path = os.path.join(origin_dir, filename)
            
            # Save the image
            image.save(save_path, "JPEG", quality=90)
            extracted_pages.append({
                "page": page_num,
                "path": save_path,
                "filename": filename,
                "relativePath": f"{origin_folder}/{filename}"  # For project.irproject
            })
            logger.info(f"  ✅ Saved page {page_num}: {filename}")
        
        logger.info(f"📄 Extraction complete: {len(extracted_pages)} pages")
        
        return {
            "status": "success",
            "page_count": len(extracted_pages),
            "origin_dir": origin_dir,  # Renamed from assets_dir
            "pages": extracted_pages
        }
        
    except Exception as e:
        logger.error(f"❌ PDF extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === COMIC IMPORT (NEW STRUCTURE) ===
class ImportComicRequest(BaseModel):
    source_path: str   # Absolute path to PDF/CBR/images
    project_path: str  # Absolute path to the project folder
    comic_name: str | None = None  # Optional custom name (defaults to filename)

@router.post("/import_comic")
async def import_comic(request: ImportComicRequest):
    """
    Import a comic (PDF/CBR) into a project with proper folder structure.
    Creates: {project}/{comic_name}/.origin/, .cleaned/, .exports/
    Extracts pages into .origin/ and creates comic.json metadata.
    """
    from pdf2image import convert_from_path
    from app.services.local_storage_service import LocalStorageService
    from app.config import LOCAL_PROJECT_FOLDERS
    import json
    import uuid
    from datetime import datetime
    
    source_path = request.source_path
    project_path = request.project_path
    
    # Derive comic name from filename if not provided
    comic_name = request.comic_name or os.path.splitext(os.path.basename(source_path))[0]
    
    logger.info(f"📚 Importing comic: {comic_name}")
    logger.info(f"   Source: {source_path}")
    logger.info(f"   Project: {project_path}")
    
    # Validate source exists
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail=f"Source file not found: {source_path}")
    
    # Validate project folder exists
    if not os.path.exists(project_path):
        raise HTTPException(status_code=404, detail=f"Project folder not found: {project_path}")
    
    try:
        # 1. Create comic folder structure
        paths = LocalStorageService.create_comic_structure(project_path, comic_name)
        comic_folder = paths["comic_folder"]
        origin_dir = paths["origin_folder"]
        
        # Get the sanitized folder name
        comic_folder_name = os.path.basename(comic_folder)
        
        # 2. Determine file type and extract
        file_ext = os.path.splitext(source_path)[1].lower()
        extracted_pages = []
        
        if file_ext == '.pdf':
            # Extract PDF pages
            images = convert_from_path(source_path, fmt='jpeg', dpi=150)
            
            for i, image in enumerate(images):
                page_num = i + 1
                filename = f"page_{page_num:03d}.jpg"
                save_path = os.path.join(origin_dir, filename)
                
                image.save(save_path, "JPEG", quality=90)
                extracted_pages.append({
                    "id": f"page_{page_num:03d}",
                    "order": i,
                    "filename": filename,
                    "originPath": f"{LOCAL_PROJECT_FOLDERS['origin']}/{filename}",
                    "balloons": [],
                    "panels": []
                })
                logger.info(f"  ✅ Page {page_num}: {filename}")
        
        elif file_ext in ['.jpg', '.jpeg', '.png', '.webp']:
            # Single image import
            import shutil
            filename = os.path.basename(source_path)
            dest_path = os.path.join(origin_dir, filename)
            shutil.copy2(source_path, dest_path)
            
            extracted_pages.append({
                "id": os.path.splitext(filename)[0],
                "order": 0,
                "filename": filename,
                "originPath": f"{LOCAL_PROJECT_FOLDERS['origin']}/{filename}",
                "balloons": [],
                "panels": []
            })
            logger.info(f"  ✅ Copied image: {filename}")
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        # 3. Create comic.json metadata
        comic_id = str(uuid.uuid4())
        comic_metadata = {
            "id": comic_id,
            "name": comic_name,
            "folderName": comic_folder_name,
            "sourceFile": os.path.basename(source_path),
            "createdAt": datetime.now().isoformat(),
            "pageCount": len(extracted_pages),
            "pages": extracted_pages
        }
        
        comic_json_path = os.path.join(comic_folder, "comic.json")
        with open(comic_json_path, "w", encoding="utf-8") as f:
            json.dump(comic_metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📝 Created comic.json: {comic_json_path}")
        logger.info(f"📚 Import complete: {len(extracted_pages)} pages")
        
        return {
            "status": "success",
            "comic_id": comic_id,
            "comic_name": comic_name,
            "comic_folder": comic_folder_name,
            "page_count": len(extracted_pages),
            "paths": paths,
            "pages": extracted_pages
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Comic import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
