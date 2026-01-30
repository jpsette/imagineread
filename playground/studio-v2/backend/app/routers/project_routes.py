from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app import crud

from app.services import project_service

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

from app.models import ProjectCreate, ProjectUpdate

@router.post("/projects")
def create_project(item: ProjectCreate, db: Session = Depends(get_db)):
    timestamp = int(datetime.now().timestamp() * 1000)
    
    # We construct the project data here similar to before
    new_project_data = {
        "id": f"proj-{timestamp}",
        "name": item.name,
        "color": item.color or "bg-blue-500",
        "rootFolderId": f"folder-{timestamp}-root",
        "createdAt": datetime.now().isoformat(),
        "lastModified": datetime.now().isoformat(),
        "isPinned": item.isPinned or False
    }
    
    # Create Project in DB
    crud.create_project(db, new_project_data)
    
    return new_project_data

@router.put("/projects/{project_id}")
def update_project(project_id: str, item: ProjectUpdate, db: Session = Depends(get_db)):
    # Convert Pydantic model to dict, excluding unset/null values
    updates = item.model_dump(exclude_unset=True)
    
    updated_project = crud.update_project(db, project_id, updates)
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
    return project_service.delete_project_and_files(db, project_id)
