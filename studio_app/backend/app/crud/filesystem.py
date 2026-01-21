from sqlalchemy.orm import Session
from app.models_db import FileSystemEntry

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

# update_file_extended_data REMOVED - Use PersistenceService
# This prevents Pydantic vs SQLAlchemy serialization issues.

def update_file_clean_status(db: Session, file_id: str, clean_url: str):
    db_entry = get_filesystem_entry(db, file_id)
    if db_entry:
        db_entry.clean_url = clean_url
        db_entry.is_cleaned = True
        db.commit()
        db.refresh(db_entry)
        return db_entry
    return None

def update_filesystem_entry(db: Session, entry_id: str, updates: dict):
    db_entry = get_filesystem_entry(db, entry_id)
    if not db_entry:
        return None
    
    # Map frontend camelCase to snake_case if strictly needed, 
    # but here we pass 'name' and 'color' which match.
    for key, value in updates.items():
        if value is not None:
             setattr(db_entry, key, value)
             
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_filesystem_entry(db: Session, entry_id: str):
    # This is a simple delete. Recursive deletion of children is handled by app logic or further calls if needed.
    # Ideally should cascade but for now following existing logic.
    db_entry = get_filesystem_entry(db, entry_id)
    if db_entry:
        db.delete(db_entry)
        db.commit()
        return True
    return False
