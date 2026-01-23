from sqlalchemy.orm import Session
from loguru import logger
from app.models import FileUpdateData, Balloon
from app.crud.filesystem import get_filesystem_entry
from typing import List, Dict, Any

class PersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def save_file_data(self, file_id: str, data: FileUpdateData) -> bool:
        """
        Unified save function for File Data (Balloons + Clean Status).
        Explicitly handles Pydantic -> Dict conversion for JSON serialization.
        """
        try:
            logger.info(f"💾 PersistenceService: Attempting to save file {file_id}")
            entry = get_filesystem_entry(self.db, file_id)
            if not entry:
                logger.error(f"❌ PersistenceService: File {file_id} not found.")
                return False

            updates_made = False

            # 1. Handle Balloons (Convert Pydantic List[Balloon] -> List[Dict])
            if data.balloons is not None:
                logger.info(f"   -> Processing {len(data.balloons)} balloons...")
                try:
                    # CRITICAL: Debugging Serialization
                    sample = data.balloons[0] if data.balloons else "Empty"
                    logger.debug(f"   -> Sample Balloon Type: {type(sample)}")
                    
                    # CRITICAL FIX: Explicitly convert Pydantic models to dicts
                    # SQLAlchemy JSON columns cannot serialize Pydantic models automatically.
                    serialized_balloons = [b.dict() if hasattr(b, 'dict') else b for b in data.balloons]
                    
                    logger.debug(f"   -> Serialized Sample: {serialized_balloons[0] if serialized_balloons else 'Empty'}")
                    
                    entry.balloons = serialized_balloons
                    updates_made = True
                    logger.info(f"   -> Assigned balloons to entry. Updates Made = True")
                except Exception as e:
                    logger.error(f"   -> Error processing balloons: {e}")
                    raise e
            
            # 1.5 Handle Panels (Added)
            if data.panels is not None:
                 entry.panels = data.panels
                 updates_made = True
                 logger.debug(f"   -> Assigned {len(data.panels)} panels to entry.")

            # 2. Handle Clean Status
            if data.cleanUrl is not None:
                entry.clean_url = data.cleanUrl
                updates_made = True
                logger.debug(f"   -> Updated clean_url: {data.cleanUrl}")

            if data.isCleaned is not None:
                entry.is_cleaned = data.isCleaned
                updates_made = True
                logger.debug(f"   -> Updated is_cleaned: {data.isCleaned}")

            # 3. Commit
            if updates_made:
                logger.info(f"   -> Committing changes to DB...")
                self.db.commit()
                self.db.refresh(entry)
                
                # Verify immediately
                logger.info(f"   -> Re-read from DB. Balloons count: {len(entry.balloons) if entry.balloons else 0}")
                
                logger.info(f"✅ PersistenceService: Successfully saved {file_id}")
                return True
            else:
                logger.info(f"ℹ️ PersistenceService: No changes detected/requested for {file_id}")
                return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"🔥 PersistenceService CRITICAL ERROR: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
