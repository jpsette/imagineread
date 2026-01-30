import sys
import os
import json
import logging

# Ensure we can import from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models_db import Project, FileSystemEntry

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DB_MIGRATION")

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data.json")

def load_json_data():
    if not os.path.exists(DATA_FILE):
        logger.error(f"Data file not found: {DATA_FILE}")
        return None
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def migrate():
    logger.info("🚀 Starting Database Migration...")
    
    # 1. Create Tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tables Created.")

    # 2. Load JSON
    data = load_json_data()
    if not data:
        return

    session = SessionLocal()
    
    try:
        # 3. Migrate Projects
        projects = data.get("projects", [])
        for p in projects:
            db_project = Project(
                id=p.get("id"),
                name=p.get("name"),
                color=p.get("color"),
                root_folder_id=p.get("rootFolderId"),
                created_at=p.get("createdAt"),
                last_modified=p.get("lastModified"),
                is_pinned=p.get("isPinned", False),
                type="project"
            )
            session.merge(db_project) # use merge to avoid duplicates if re-run
        
        logger.info(f"✅ Migrated {len(projects)} Projects.")

        # 4. Migrate FileSystem
        fs_entries = data.get("fileSystem", [])
        for i, f in enumerate(fs_entries):
            # Parse Balloons (ensure it's stored as JSON-compatible object/list, SQLAlchemy handles serialization)
            balloons = f.get("balloons")
            
            db_entry = FileSystemEntry(
                id=f.get("id"),
                parent_id=f.get("parentId"),
                name=f.get("name"),
                type=f.get("type"),
                url=f.get("url"),
                created_at=f.get("createdAt"),
                is_pinned=f.get("isPinned", False),
                order=f.get("order", i), # Fallback to index if no order
                
                # New Fields
                clean_url=f.get("cleanUrl"),
                is_cleaned=f.get("isCleaned", False),
                balloons=balloons
            )
            session.merge(db_entry)
            
        logger.info(f"✅ Migrated {len(fs_entries)} Files/Folders.")
        
        session.commit()
        logger.info("🎉 MIGRATION COMPLETE SUCCESSFULLY!")
        
    except Exception as e:
        logger.error(f"❌ Migration Failed: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
