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

class FileUpdateData(BaseModel):
    balloons: Optional[List[dict]] = None

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
