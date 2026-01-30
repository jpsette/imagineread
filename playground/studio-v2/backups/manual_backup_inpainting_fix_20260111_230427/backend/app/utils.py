import os
from app.config import LIBRARY_DIR, TEMP_DIR, logger

def resolve_local_path(image_url_or_path: str) -> str:
    """Resolves local file path from URL/Path (Library > Temp)."""
    if not image_url_or_path:
        return ""
    filename = image_url_or_path.split('/')[-1]
    
    # Priority 1: URL points to library
    if "/library/" in image_url_or_path:
        return os.path.join(LIBRARY_DIR, filename)
    
    # Priority 2: File exists in LIBRARY_DIR
    lib_path = os.path.join(LIBRARY_DIR, filename)
    if os.path.exists(lib_path):
        return lib_path
    
    # Priority 3: Default to TEMP_DIR
    return os.path.join(TEMP_DIR, filename)
