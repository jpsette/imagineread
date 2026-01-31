"""
Local Storage Service
Handles file operations within local project folders.
This service manages the hidden folder structure for local projects.
"""

import os
import shutil
from loguru import logger
from app.config import LOCAL_PROJECT_FOLDERS


class LocalStorageService:
    """
    Service for managing file storage within local project directories.
    All internal folders (.origin, .cleaned, .exports) are hidden from users.
    """
    
    @staticmethod
    def get_folder_path(project_path: str, folder_type: str) -> str:
        """
        Get the full path to a hidden folder within a project.
        
        Args:
            project_path: Absolute path to the project directory
            folder_type: One of 'origin', 'cleaned', 'exports'
            
        Returns:
            Full path to the folder (e.g., /path/to/project/.origin)
        """
        folder_name = LOCAL_PROJECT_FOLDERS.get(folder_type)
        if not folder_name:
            raise ValueError(f"Unknown folder type: {folder_type}")
        return os.path.join(project_path, folder_name)
    
    @staticmethod
    def ensure_project_structure(project_path: str) -> None:
        """
        Create all hidden folders for a local project.
        Should be called when creating a new project.
        
        Args:
            project_path: Absolute path to the project directory
        """
        for folder_type, folder_name in LOCAL_PROJECT_FOLDERS.items():
            folder_path = os.path.join(project_path, folder_name)
            os.makedirs(folder_path, exist_ok=True)
            logger.debug(f"📁 Ensured folder: {folder_path}")
    
    @staticmethod
    def get_asset_path(project_path: str, folder_type: str, filename: str) -> str:
        """
        Get the full path to an asset within a project folder.
        
        Args:
            project_path: Absolute path to the project directory
            folder_type: One of 'origin', 'cleaned', 'exports'
            filename: Name of the file
            
        Returns:
            Full path to the asset
        """
        folder_path = LocalStorageService.get_folder_path(project_path, folder_type)
        return os.path.join(folder_path, filename)
    
    @staticmethod
    def save_extracted_page(project_path: str, source_data: bytes, page_number: int, extension: str = "jpg") -> str:
        """
        Save an extracted page (from PDF/CBR) to the .origin folder.
        
        Args:
            project_path: Absolute path to the project directory
            source_data: Raw image bytes
            page_number: Page number (used for naming)
            extension: File extension (default: jpg)
            
        Returns:
            Relative path to the saved file (e.g., .origin/page_001.jpg)
        """
        origin_folder = LocalStorageService.get_folder_path(project_path, "origin")
        os.makedirs(origin_folder, exist_ok=True)
        
        filename = f"page_{page_number:03d}.{extension}"
        file_path = os.path.join(origin_folder, filename)
        
        with open(file_path, "wb") as f:
            f.write(source_data)
        
        logger.info(f"💾 Saved extracted page: {file_path}")
        
        # Return relative path for storage in project.irproject
        return os.path.join(LOCAL_PROJECT_FOLDERS["origin"], filename)
    
    @staticmethod
    def save_cleaned_page(project_path: str, source_path: str, page_id: str) -> str:
        """
        Copy a cleaned page from temp to the .cleaned folder.
        
        Args:
            project_path: Absolute path to the project directory
            source_path: Absolute path to the cleaned image (usually in temp/)
            page_id: Identifier for the page (used for naming)
            
        Returns:
            Relative path to the saved file (e.g., .cleaned/page_001_clean.jpg)
        """
        cleaned_folder = LocalStorageService.get_folder_path(project_path, "cleaned")
        os.makedirs(cleaned_folder, exist_ok=True)
        
        # Extract extension from source
        _, ext = os.path.splitext(source_path)
        ext = ext or ".jpg"
        
        filename = f"{page_id}_clean{ext}"
        dest_path = os.path.join(cleaned_folder, filename)
        
        # Copy file
        shutil.copy2(source_path, dest_path)
        logger.info(f"💾 Saved cleaned page: {dest_path}")
        
        # Return relative path
        return os.path.join(LOCAL_PROJECT_FOLDERS["cleaned"], filename)
    
    @staticmethod
    def is_hidden_folder(folder_name: str) -> bool:
        """
        Check if a folder name is one of the hidden internal folders.
        
        Args:
            folder_name: Name of the folder to check
            
        Returns:
            True if the folder should be hidden from the user
        """
        hidden_folders = set(LOCAL_PROJECT_FOLDERS.values())
        return folder_name in hidden_folders or folder_name.startswith('.')
    
    @staticmethod
    def list_visible_contents(project_path: str) -> list:
        """
        List only user-visible contents of a project folder.
        Excludes hidden folders (.origin, .cleaned, .exports) and dotfiles.
        
        Args:
            project_path: Absolute path to the project directory
            
        Returns:
            List of visible file/folder names
        """
        if not os.path.exists(project_path):
            return []
        
        contents = os.listdir(project_path)
        visible = [
            item for item in contents 
            if not LocalStorageService.is_hidden_folder(item)
        ]
        return visible
    
    @staticmethod
    def sanitize_folder_name(name: str) -> str:
        """
        Sanitize a name for use as a folder name.
        Removes/replaces special characters that are not allowed in folder names.
        
        Args:
            name: Original name (e.g., comic title or filename)
            
        Returns:
            Sanitized folder name safe for filesystem
        """
        import re
        # Remove file extension if present
        name = os.path.splitext(name)[0]
        # Replace problematic characters with underscore
        name = re.sub(r'[<>:"/\\|?*]', '_', name)
        # Remove leading/trailing whitespace and dots
        name = name.strip(' .')
        # Collapse multiple underscores/spaces
        name = re.sub(r'[_\s]+', ' ', name)
        return name or "Untitled"
    
    @staticmethod
    def create_comic_structure(project_path: str, comic_name: str) -> dict:
        """
        Create a new comic folder with hidden subdirectories inside a project.
        
        Args:
            project_path: Absolute path to the project directory
            comic_name: Name of the comic (will be sanitized)
            
        Returns:
            Dictionary with paths to the created structure:
            {
                "comic_folder": "/path/to/project/Comic Name",
                "origin_folder": "/path/to/project/Comic Name/.origin",
                "cleaned_folder": "/path/to/project/Comic Name/.cleaned",
                "exports_folder": "/path/to/project/Comic Name/.exports"
            }
        """
        # Sanitize comic name for folder
        safe_name = LocalStorageService.sanitize_folder_name(comic_name)
        comic_folder = os.path.join(project_path, safe_name)
        
        # Create comic folder
        os.makedirs(comic_folder, exist_ok=True)
        logger.info(f"📚 Created comic folder: {comic_folder}")
        
        # Create hidden subdirectories
        paths = {
            "comic_folder": comic_folder,
            "origin_folder": os.path.join(comic_folder, LOCAL_PROJECT_FOLDERS["origin"]),
            "cleaned_folder": os.path.join(comic_folder, LOCAL_PROJECT_FOLDERS["cleaned"]),
            "exports_folder": os.path.join(comic_folder, LOCAL_PROJECT_FOLDERS["exports"]),
        }
        
        for folder_type, folder_path in paths.items():
            if folder_type != "comic_folder":
                os.makedirs(folder_path, exist_ok=True)
                logger.debug(f"📁 Created: {folder_path}")
        
        return paths
    
    @staticmethod
    def get_comic_folder_path(project_path: str, comic_name: str, folder_type: str) -> str:
        """
        Get the full path to a hidden folder within a comic folder.
        
        Args:
            project_path: Absolute path to the project directory
            comic_name: Name of the comic folder
            folder_type: One of 'origin', 'cleaned', 'exports'
            
        Returns:
            Full path to the folder (e.g., /project/Comic Name/.origin)
        """
        folder_name = LOCAL_PROJECT_FOLDERS.get(folder_type)
        if not folder_name:
            raise ValueError(f"Unknown folder type: {folder_type}")
        return os.path.join(project_path, comic_name, folder_name)


# Singleton instance for easy import
local_storage_service = LocalStorageService()

