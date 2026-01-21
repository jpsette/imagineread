from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud
from app.models import StoreRequest, MoveItemRequest, ReorderItemsRequest, FileRenameRequest, CreateFolderRequest, FileUpdateData
from app.models_db import FileSystemEntry
from loguru import logger

router = APIRouter(tags=["Filesystem Core"])

@router.get("/filesystem")
def get_filesystem(parentId: str = None, db: Session = Depends(get_db)):
    if parentId is not None:
        # Lazy Load: Get only children of this parent
        # If parentId is "root" string from frontend, we treat it as None DB-wise if that's the convention,
        # or if frontend passes actual null? 
        # API convention: ?parentId=xyz. If omitted, parentId=None.
        # But if omitted, we want ALL (Legacy).
        # So we check if it IS NOT NONE.
        if parentId == "null": parentId = None # Handle "null" string if passed
        entries = crud.get_filesystem_by_parent(db, parentId)
    else:
        # Eager Load (Legacy / Default): Get EVERYTHING
        entries = crud.get_all_filesystem_entries(db)
        
    # Map back to camelCase for frontend
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
            "order": e.order,
            "color": e.color
        }

        for e in entries
    ]

@router.post("/folders")
def create_folder(request: CreateFolderRequest, db: Session = Depends(get_db)):
    import uuid
    from datetime import datetime
    f_id = f"folder-{uuid.uuid4().hex[:8]}"
    crud.create_filesystem_entry(db, {
        "id": f_id,
        "name": request.name,
        "type": "folder",
        "parentId": request.parentId,
        "createdAt": datetime.now().isoformat(),
        "color": request.color
    })
    return {"status": "success", "id": f_id, "name": request.name, "color": request.color}

@router.put("/files/{file_id}/data")
def update_file_data(file_id: str, update_data: FileUpdateData, db: Session = Depends(get_db)):
    from app.services.persistence_service import PersistenceService
    
    service = PersistenceService(db)
    success = service.save_file_data(file_id, update_data)
    
    if not success:
         # Check if it was a 404 or a 500 inside the service? 
         # The service logs errors. We assume if it returned False, something went wrong.
         # For now, generic 500 or 404. Let's assume 404 for missing file is common.
         # Ideally service returns a status/enum.
         # But based on logs, if file missing -> logs error.
         # We will return 400 or 404.
         logger.warning(f"PersistenceService returned failure for {file_id}")
         raise HTTPException(status_code=400, detail="Failed to save data. Check server logs.")

    return {"status": "success", "message": "File data updated via PersistenceService"}


@router.delete("/files/{item_id}")
def delete_item(item_id: str, db: Session = Depends(get_db)):
    import os
    from app.config import LIBRARY_DIR
    
    # 1. Get Item
    item = db.query(FileSystemEntry).filter(FileSystemEntry.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 2. Define Recursive Deletion Helper
    def get_all_descendant_ids(root_id):
        ids = []
        children = db.query(FileSystemEntry).filter(FileSystemEntry.parent_id == root_id).all()
        for child in children:
            ids.append(child.id)
            if child.type == 'folder':
                ids.extend(get_all_descendant_ids(child.id))
        return ids

    # 3. Collect all IDs to delete (Self + Descendants)
    target_ids = [item.id]
    if item.type == 'folder':
        target_ids.extend(get_all_descendant_ids(item.id))

    # 4. Physical Deletion of FILES
    deleted_files_count = 0
    items_to_delete = db.query(FileSystemEntry).filter(FileSystemEntry.id.in_(target_ids)).all()
    
    for entry in items_to_delete:
        if entry.type == 'file' and entry.url:
            try:
                # Extract filename from URL or use stored name if consistent
                # URL format: http://.../library/filename.jpg
                filename = entry.url.split('/')[-1]
                file_path = os.path.join(LIBRARY_DIR, filename)
                
                if os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_files_count += 1
            except Exception as e:
                logger.error(f"Failed to delete physical file {entry.id}: {e}")

    # 5. DB Deletion
    try:
        # Delete in bulk
        db.query(FileSystemEntry).filter(FileSystemEntry.id.in_(target_ids)).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "deleted_count": len(target_ids), "physical_files_removed": deleted_files_count}


@router.put("/files/{item_id}")
def rename_item(item_id: str, request: FileRenameRequest, db: Session = Depends(get_db)):
    updated = crud.update_filesystem_entry(db, item_id, {
        "name": request.name,
        "color": request.color
    })
    
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
        
    return {"status": "success", "id": item_id, "name": request.name, "color": request.color}

@router.post("/files/{item_id}/move")
def move_item(item_id: str, request: MoveItemRequest, db: Session = Depends(get_db)):
    item = db.query(FileSystemEntry).filter(FileSystemEntry.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Prevent self-containment loop
    if request.targetParentId == item.id:
        raise HTTPException(status_code=400, detail="Cannot move folder into itself")
    
    # If moving a folder, check if target is a descendant (Cycle Detection)
    if item.type == 'folder':
        # Simple BFS or recursive check could work, but for now simple check:
        # A robust solution would recursively check parents of targetParentId
        # checking if any matches item.id
        current = db.query(FileSystemEntry).filter(FileSystemEntry.id == request.targetParentId).first()
        while current:
            if current.id == item.id:
                raise HTTPException(status_code=400, detail="Cannot move folder into its own child")
            current = db.query(FileSystemEntry).filter(FileSystemEntry.id == current.parent_id).first()

    item.parent_id = request.targetParentId
    db.commit()
    return {"status": "success", "message": "Item moved"}

@router.post("/files/reorder")
def reorder_items(request: ReorderItemsRequest, db: Session = Depends(get_db)):
    # Update order for each item in list
    for index, item_id in enumerate(request.orderedIds):
        db.query(FileSystemEntry).filter(FileSystemEntry.id == item_id).update({"order": index})
    
    db.commit()
    return {"status": "success", "message": "Items reordered"}

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
