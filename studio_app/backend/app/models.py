from pydantic import BaseModel
from typing import List, Optional

class Project(BaseModel):
    id: str
    name: str
    color: str
    createdAt: str
    lastModified: str
    rootFolderId: Optional[str] = None
    isPinned: bool = False

class ProjectCreate(BaseModel):
    name: str
    color: Optional[str] = "bg-blue-500"
    isPinned: Optional[bool] = False

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    isPinned: Optional[bool] = None
    lastModified: Optional[str] = None

class AnalyzeRequest(BaseModel):
    image_url: str

class CleanRequest(BaseModel):
    image_url: str
    file_id: Optional[str] = None
    bubbles: List[dict]

class YOLOAnalyzeRequest(BaseModel):
    image_path: str

class OCRRequest(BaseModel):
    image_path: str
    balloons: list

class StoreRequest(BaseModel):
    data: dict

class ExportRequest(BaseModel):
    format: str

from typing import Union, Dict

class Balloon(BaseModel):
    id: Optional[str] = None
    text: Optional[Union[str, Dict[str, str]]] = None
    # We allow other fields loosely for now, or we can be strict.
    # Given the dynamic nature of the editor, strict typing all balloon props might be overkill right now,
    # but defining 'text' explicitly solves the i18n requirement.
    class Config:
        extra = "allow" 

class FileUpdateData(BaseModel):
    # balloons: Optional[List[dict]] = None
    balloons: Optional[List[Balloon]] = None
    panels: Optional[List[dict]] = None # Added panels
    cleanUrl: Optional[str] = None
    isCleaned: Optional[bool] = None

class CreateFolderRequest(BaseModel):
    name: str
    parentId: str
    color: Optional[str] = None

class MoveItemRequest(BaseModel):
    targetParentId: str

class ReorderItemsRequest(BaseModel):
    orderedIds: List[str]

class FileRenameRequest(BaseModel):
    name: str
    color: Optional[str] = None
