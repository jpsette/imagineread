import os
import math
from PIL import Image
from loguru import logger
from app.config import TEMP_DIR, LIBRARY_DIR
from app.utils import resolve_local_path

class TileService:
    """
    Handles generation and retrieval of Image Tiles for Deep Zoom.
    Path Structure: temp/tiles/{image_id}/{zoom_level}/{x}_{y}.jpg
    tileSize: 256px (Standard)
    """
    TILE_SIZE = 256
    
    def get_tile_path(self, image_id: str, zoom: int, x: int, y: int, db=None) -> str | None:
        """
        Returns the absolute path to a requested tile.
        Generates it if it doesn't exist.
        """
        tile_dir = os.path.join(TEMP_DIR, "tiles", image_id, str(zoom))
        tile_name = f"{x}_{y}.jpg"
        tile_path = os.path.join(tile_dir, tile_name)
        
        if os.path.exists(tile_path):
            return tile_path
            
        source_path = self._find_source_image(image_id, db)
        if not source_path:
            logger.error(f"Tile Generation Failed: Source not found for {image_id}")
            return None
            
        return self._generate_tile(source_path, tile_dir, zoom, x, y)

    def get_tile_for_local_path(self, source_path: str, zoom: int, x: int, y: int) -> str | None:
        """
        Generates tiles for LOCAL files (not in database).
        Uses MD5 hash of path as cache key.
        """
        import hashlib
        
        # Create unique cache key from file path
        path_hash = hashlib.md5(source_path.encode()).hexdigest()
        
        tile_dir = os.path.join(TEMP_DIR, "tiles", f"local_{path_hash}", str(zoom))
        tile_name = f"{x}_{y}.jpg"
        tile_path = os.path.join(tile_dir, tile_name)
        
        # Return cached tile if exists
        if os.path.exists(tile_path):
            return tile_path
        
        # Generate new tile
        return self._generate_tile(source_path, tile_dir, zoom, x, y)


    def _find_source_image(self, image_id: str, db=None) -> str | None:
        # STRATEGY 1: Database Lookup (For File IDs)
        if db:
            from app.models_db import FileSystemEntry
            entry = db.query(FileSystemEntry).filter(FileSystemEntry.id == image_id).first()
            
            if entry and entry.url:
                # Debug Log
                # logger.debug(f"TileService: Resolving DB Entry {image_id} -> URL: {entry.url}")
                
                # Resolve URL to Local Path
                # Standard: /library/...
                if "/library/" in entry.url.lower():
                    # Handle case-insensitive split? No, paths are case sensitive often. 
                    # But URL schema usually lowercase prefix.
                    # Use standard split.
                    try:
                        rel_path = entry.url.split("/library/")[-1] 
                        import urllib.parse
                        rel_path = urllib.parse.unquote(rel_path)
                        full_path = os.path.join(LIBRARY_DIR, rel_path)
                        if os.path.exists(full_path): return full_path
                        else: logger.warning(f"TileService: File missing at expected path {full_path}")
                    except Exception as e:
                        logger.error(f"TileService: URL Parse Error {e}")

                if "/temp/" in entry.url.lower():
                     rel_path = entry.url.split("/temp/")[-1]
                     full_path = os.path.join(TEMP_DIR, rel_path)
                     if os.path.exists(full_path): return full_path

                # STRATEGY 1.1: Fallback - Filename from URL (if schema unknown)
                # Example: http://.../something/random/file.jpg -> file.jpg
                try:
                    filename = entry.url.split('/')[-1]
                    # Check Library Root
                    fallback_lib = os.path.join(LIBRARY_DIR, filename)
                    if os.path.exists(fallback_lib): return fallback_lib
                    
                    # Check Temp Root
                    fallback_temp = os.path.join(TEMP_DIR, filename)
                    if os.path.exists(fallback_temp): return fallback_temp
                except:
                    pass
                
                # STRATEGY 1.2: Fallback - Entry Name (if URL is completely virtual)
                if entry.name:
                    fallback_name_lib = os.path.join(LIBRARY_DIR, entry.name)
                    if os.path.exists(fallback_name_lib): return fallback_name_lib

        # STRATEGY 2: Direct Filename Lookup (For Clean Images in Temp)
        # Check Temp Root
        temp_path = os.path.join(TEMP_DIR, image_id)
        if os.path.exists(temp_path): return temp_path
        
        # Check Library Root
        lib_path = os.path.join(LIBRARY_DIR, image_id) 
        if os.path.exists(lib_path): return lib_path
        
        # Extension fallback
        for ext in ['.jpg', '.png', '.jpeg']:
            if os.path.exists(lib_path + ext): return lib_path + ext
            if os.path.exists(temp_path + ext): return temp_path + ext
            
        return None

    def _generate_tile(self, source_path: str, tile_dir: str, zoom: int, x: int, y: int) -> str | None:
        try:
            os.makedirs(tile_dir, exist_ok=True)
            tile_path = os.path.join(tile_dir, f"{x}_{y}.jpg")
            
            # This is "On-Demand" generation (slow for first user).
            # Efficient implementation would generate WHOLE pyramid on import.
            # But for "Safe Implementation", we do lazily to avoid breaking import flow.
            
            with Image.open(source_path) as img:
                w, h = img.size
                
                # Calculate scale for this zoom level
                # Deep Zoom logic: Level 0 = 1px? No, usually Level 0 = 1 tile fits whole image.
                # Let's standardize: 
                # Level 0 = Original Size?
                # Usually standard mapping is: 
                # - Level 0: 1 tile (thumbnail)
                # - ...
                # - Level N: Original Resolution
                
                # IMPLEMENTATION CHOICE: "Inverse Pyramid" relative to Original
                # Level 0 = 100% (Original)
                # Level 1 = 50%
                # Level 2 = 25%
                
                # Wait, "Leaflet/Google Maps" style is:
                # Zoom 0 world map. Zoom 20 house.
                # Let's stick to simple scaling factor:
                # scale = 1 / (2^zoom_level)  <-- DOWNsampling
                
                scale_factor = 1 / (2 ** zoom) 
                
                # Optimization: Don't load full image if we just want a small crop?
                # PIL loads lazily, but resizing requires full process usually.
                # Ideally, we resize the WHOLE image to the target zoom level ONCE, 
                # then crop. Doing this per tile is inefficient (repeats resize).
                
                # BETTER STRATEGY for Lazy:
                # Resize whole image to target scale -> Cache it as "layer_{zoom}.jpg" -> Crop from that.
                
                # Implement Atomic Write to prevent race conditions
                # 1. Resize Layer (Critical Section)
                layer_cache_path = os.path.join(os.path.dirname(tile_dir), f"layer_full_{zoom}.jpg")
                
                # Check existance AGAIN to avoid redundant work if race lost
                if not os.path.exists(layer_cache_path):
                    target_w = int(w * scale_factor)
                    target_h = int(h * scale_factor)
                    if target_w < 1 or target_h < 1: return None
                    
                    logger.info(f"generating layer cache for zoom {zoom} ({target_w}x{target_h})")
                    resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    resized = resized.convert('RGB')
                    
                    # Atomic Write: Save to UNIQUE temp, then rename
                    import uuid
                    temp_layer_path = layer_cache_path + f".{uuid.uuid4().hex}.tmp"
                    resized.save(temp_layer_path, format='JPEG', quality=90)
                    os.rename(temp_layer_path, layer_cache_path)
                
                # 2. Crop Tile
                # We retry opening logic slightly if race condition hits?
                with Image.open(layer_cache_path) as layer_img:
                    left = x * self.TILE_SIZE
                    top = y * self.TILE_SIZE
                    right = left + self.TILE_SIZE
                    bottom = top + self.TILE_SIZE
                    
                    if left >= layer_img.width or top >= layer_img.height:
                        return None
                        
                    tile = layer_img.crop((left, top, right, bottom))
                    
                    # Atomic Write for Tile
                    import uuid
                    temp_tile_path = tile_path + f".{uuid.uuid4().hex}.tmp"
                    tile.save(temp_tile_path, format='JPEG', quality=85)
                    os.rename(temp_tile_path, tile_path)
                        
                return tile_path

        except Exception as e:
            logger.error(f"Tile Generation Error: {e}")
            return None

tile_service = TileService()
