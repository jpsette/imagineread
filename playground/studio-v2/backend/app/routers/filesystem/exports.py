import re
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app import crud
from app.models import ExportRequest
from app.services.job_manager import job_manager
from app.services.export_service import export_service

router = APIRouter(tags=["Filesystem Exports"])

@router.post("/projects/{entity_id}/export")
def export_project(
    entity_id: str, 
    request: ExportRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    try:
        # Phase 1: FAST Data Gathering (Synchronous)
        # We still gather metadata synchronously to ensure validity before creating the job.
        # Ideally, we could move even this to background, but for now let's keep it safe.
        
        projects = crud.get_projects(db)
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

        # Collect Files Recursive
        def get_files(fid):
            files = [f for f in fs_list if f.get("parentId") == fid and f.get("type") == "file"]
            for sub in [f for f in fs_list if f.get("parentId") == fid and f.get("type") == "folder"]:
                files.extend(get_files(sub["id"]))
            return files

        files = get_files(target_id)
        # Sort by number in filename
        files.sort(key=lambda f: int(re.findall(r'\d+', f["name"])[0]) if re.findall(r'\d+', f["name"]) else 0)
        
        if not files: raise HTTPException(status_code=400, detail="Empty folder")

        # Phase 2: Create Job
        job_type = f"EXPORT_{request.format.upper()}"
        job_id = job_manager.create_job(job_type)
        
        # Payload for the worker
        payload = {
            "source_id": entity_id,
            "name": name,
            "format": request.format,
            "files": files
        }
        
        # Dispatch to Background
        background_tasks.add_task(export_service.process_export_job, job_id, payload)
        
        return {
            "status": "queued",
            "jobId": job_id,
            "message": f"Export {job_type} started in background."
        }

    except Exception as e:
        logger.error(f"Export Dispatch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
