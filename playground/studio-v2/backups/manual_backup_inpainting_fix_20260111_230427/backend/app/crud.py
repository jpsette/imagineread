from sqlalchemy.orm import Session
from app.models_db import Project, FileSystemEntry
from datetime import datetime

# --- PROJECTS ---

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

# --- FILESYSTEM ---

def get_all_filesystem_entries(db: Session):
    return db.query(FileSystemEntry).all()

def get_filesystem_entry(db: Session, entry_id: str):
    return db.query(FileSystemEntry).filter(FileSystemEntry.id == entry_id).first()

def create_filesystem_entry(db: Session, entry_data: dict):
    # Map dictionary keys (often camelCase from frontend/legacy) to model fields (snake_case)
    db_entry = FileSystemEntry(
        id=entry_data.get("id"),
        parent_id=entry_data.get("parentId"),
        project_id=entry_data.get("projectId"), # May not always be present
        name=entry_data.get("name"),
        type=entry_data.get("type"),
        url=entry_data.get("url"),
        created_at=entry_data.get("createdAt"),
        is_pinned=entry_data.get("isPinned", False),
        order=entry_data.get("order", 0),
        
        clean_url=entry_data.get("cleanUrl"),
        is_cleaned=entry_data.get("isCleaned", False),
        balloons=entry_data.get("balloons")
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_file_balloons(db: Session, file_id: str, balloons: list):
    db_entry = get_filesystem_entry(db, file_id)
    if db_entry:
        db_entry.balloons = balloons
        db.commit()
        db.refresh(db_entry)
        return db_entry
    return None

def update_file_clean_status(db: Session, file_id: str, clean_url: str):
    db_entry = get_filesystem_entry(db, file_id)
    if db_entry:
        db_entry.clean_url = clean_url
        db_entry.is_cleaned = True
        db.commit()
        db.refresh(db_entry)
        return db_entry
    return None

def delete_filesystem_entry(db: Session, entry_id: str):
    # This is a simple delete. Recursive deletion of children is handled by app logic or further calls if needed.
    # Ideally should cascade but for now following existing logic.
    db_entry = get_filesystem_entry(db, entry_id)
    if db_entry:
        db.delete(db_entry)
        db.commit()
        return True
    return False
