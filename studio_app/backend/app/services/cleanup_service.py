import os
from sqlalchemy.orm import Session
from app.config import LIBRARY_DIR
from app.crud import get_all_filesystem_entries
from loguru import logger

def cleanup_orphans(db: Session, dry_run: bool = False) -> int:
    """
    Scans LIBRARY_DIR and removes files that are not referenced in the Database.
    Returns the count of deleted files.
    """
    if not os.path.exists(LIBRARY_DIR):
        return 0

    # 1. Get Set of Active Files from DB
    # Assumption: The 'url' field contains the filename at the end
    # Format: http://.../library/filename.jpg
    db_entries = get_all_filesystem_entries(db)
    active_filenames = set()
    
    for entry in db_entries:
        if entry.url:
            filename = entry.url.split('/')[-1]
            active_filenames.add(filename)

    # 2. Get Set of Files on Disk
    disk_files = set(os.listdir(LIBRARY_DIR))
    
    # 3. Calculate Orphans
    orphans = disk_files - active_filenames
    
    # Filter out system files like .DS_Store
    orphans = {f for f in orphans if not f.startswith('.')}

    if not orphans:
        logger.info("🧹 Garbage Collector: No orphans found. System is clean.")
        return 0

    count = 0
    for orphan in orphans:
        file_path = os.path.join(LIBRARY_DIR, orphan)
        try:
            if not dry_run:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    count += 1
            else:
                logger.info(f"DRY RUN: Would delete {orphan}")
                count += 1
        except Exception as e:
            logger.error(f"Failed to delete orphan {orphan}: {e}")

    if not dry_run:
        logger.success(f"🧹 Garbage Collector: Removed {count} orphan files.")
    
    return count
