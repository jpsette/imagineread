import os
import re
import zipfile
import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image
from loguru import logger

from app.database import get_db
from app import crud
from app.config import TEMP_DIR
from app.utils import resolve_local_path
from app.models import ExportRequest

router = APIRouter(tags=["Filesystem Exports"])

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
