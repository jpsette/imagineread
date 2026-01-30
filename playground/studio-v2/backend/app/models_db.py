from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey, JSON
from .database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    color = Column(String)
    type = Column(String, default="project")
    root_folder_id = Column(String, nullable=True) # Maps to rootFolderId
    created_at = Column(String) # Storing as ISO String for consistency with JSON
    last_modified = Column(String)
    is_pinned = Column(Boolean, default=False)

class FileSystemEntry(Base):
    __tablename__ = "filesystem"

    id = Column(String, primary_key=True, index=True)
    parent_id = Column(String, index=True)
    project_id = Column(String, nullable=True, index=True) # Optional link to project
    name = Column(String)
    type = Column(String) # 'file', 'folder', 'comic'
    
    # File Specific
    url = Column(String, nullable=True)
    clean_url = Column(String, nullable=True)
    is_cleaned = Column(Boolean, default=False)
    
    # Balloons Data (Stored as JSON)
    balloons = Column(JSON, nullable=True)
    panels = Column(JSON, nullable=True) # Added panels support
    
    # Metadata
    created_at = Column(String)
    order = Column(Integer, default=0)

    is_pinned = Column(Boolean, default=False)
    color = Column(String, nullable=True)
