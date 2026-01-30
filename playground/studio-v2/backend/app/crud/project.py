from sqlalchemy.orm import Session
from app.models_db import Project

def get_projects(db: Session):
    return db.query(Project).all()

def get_project(db: Session, project_id: str):
    return db.query(Project).filter(Project.id == project_id).first()

def create_project(db: Session, project_data: dict):
    db_project = Project(
        id=project_data.get("id"),
        name=project_data.get("name"),
        color=project_data.get("color"),
        root_folder_id=project_data.get("rootFolderId"),
        created_at=project_data.get("createdAt"),
        last_modified=project_data.get("lastModified"),
        is_pinned=project_data.get("isPinned", False),
        type="project"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: str, updates: dict):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
        
    for key, value in updates.items():
        setattr(db_project, key, value)
    
    # Map camelCase to snake_case if necessary, checking keys manually
    if "isPinned" in updates: db_project.is_pinned = updates["isPinned"]
    if "lastModified" in updates: db_project.last_modified = updates["lastModified"]
    # name and color map directly
    
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: str):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False
