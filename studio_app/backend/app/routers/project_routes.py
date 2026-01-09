from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app import crud

router = APIRouter(tags=["Projects"])

@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    # Convert DB objects to list of dicts/schemas if needed, 
    # but returning ORM objects usually works with FastAPI Pydantic parsing 
    # if attributes match. Our DB models match Pydantic keys mostly.
    # Note: DB models use snake_case (created_at), JSON used camelCase (createdAt).
    # We might need a translation layer or rely on Pydantic `orm_mode` / `from_attributes`.
    # For now, let's return a list where we map them manually to ensure frontend compatibility
    # without breaking changes.
    
    projects = crud.get_projects(db)
    return [
        {
            "id": p.id,
            "name": p.name,
            "color": p.color,
            "rootFolderId": p.root_folder_id,
            "createdAt": p.created_at,
            "lastModified": p.last_modified,
            "isPinned": p.is_pinned
        }
        for p in projects
    ]

@router.post("/projects")
def create_project(data_input: dict, db: Session = Depends(get_db)):
    timestamp = int(datetime.now().timestamp() * 1000)
    
    # We construct the project data here similar to before
    new_project_data = {
        "id": f"proj-{timestamp}",
        "name": data_input.get("name", "Novo Projeto"),
        "color": data_input.get("color", "bg-blue-500"),
        "rootFolderId": f"folder-{timestamp}-root",
        "createdAt": datetime.now().isoformat(),
        "lastModified": datetime.now().isoformat(),
        "isPinned": data_input.get("isPinned", False)
    }
    
    # Create Project in DB
    crud.create_project(db, new_project_data)
    
    # Also need to create the Root Folder for the project in the FileSystem?
    # Previous code didn't explicitly create a "folder" entry for the rootFolderId 
    # in the fileSystem list, it just assigned the ID. 
    # But for a proper FS structure, let's create it.
    # However, existing logic might rely on it just being an ID. 
    # Let's stick to strict replacement of logic: existing code just assigned ID.
    
    return new_project_data

@router.put("/projects/{project_id}")
def update_project(project_id: str, data_input: dict, db: Session = Depends(get_db)):
    updated_project = crud.update_project(db, project_id, data_input)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return {
        "id": updated_project.id,
        "name": updated_project.name,
        "color": updated_project.color,
        "rootFolderId": updated_project.root_folder_id,
        "createdAt": updated_project.created_at,
        "lastModified": updated_project.last_modified,
        "isPinned": updated_project.is_pinned
    }

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    success = crud.delete_project(db, project_id)
    if not success:
         # It might be 404 or just failed.
         # For consistency with previous loop logic which just filtered:
         pass 
         
    return {"status": "deleted", "id": project_id}
