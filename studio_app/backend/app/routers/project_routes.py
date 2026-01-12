from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app import crud

router = APIRouter(tags=["Projects"])

@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    # Convert DB objects to list of dicts/schemas if needed, 
    # but returning ORM objects usually works with FastAPI Pydantic parsing 
    # if attributes match. Our DB models match Pydantic keys mostly.
    # Note: DB models use snake_case (created_at), JSON used camelCase (createdAt).
    # We might need a translation layer or rely on Pydantic `orm_mode` / `from_attributes`.
    # For now, let's return a list where we map them manually to ensure frontend compatibility
    # without breaking changes.
    
    projects = crud.get_projects(db)
    return [
        {
            "id": p.id,
            "name": p.name,
            "color": p.color,
            "rootFolderId": p.root_folder_id,
            "createdAt": p.created_at,
            "lastModified": p.last_modified,
            "isPinned": p.is_pinned
        }
        for p in projects
    ]

@router.post("/projects")
def create_project(data_input: dict, db: Session = Depends(get_db)):
    timestamp = int(datetime.now().timestamp() * 1000)
    
    # We construct the project data here similar to before
    new_project_data = {
        "id": f"proj-{timestamp}",
        "name": data_input.get("name", "Novo Projeto"),
        "color": data_input.get("color", "bg-blue-500"),
        "rootFolderId": f"folder-{timestamp}-root",
        "createdAt": datetime.now().isoformat(),
        "lastModified": datetime.now().isoformat(),
        "isPinned": data_input.get("isPinned", False)
    }
    
    # Create Project in DB
    crud.create_project(db, new_project_data)
    
    # Also need to create the Root Folder for the project in the FileSystem?
    # Previous code didn't explicitly create a "folder" entry for the rootFolderId 
    # in the fileSystem list, it just assigned the ID. 
    # But for a proper FS structure, let's create it.
    # However, existing logic might rely on it just being an ID. 
    # Let's stick to strict replacement of logic: existing code just assigned ID.
    
    return new_project_data

@router.put("/projects/{project_id}")
def update_project(project_id: str, data_input: dict, db: Session = Depends(get_db)):
    updated_project = crud.update_project(db, project_id, data_input)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return {
        "id": updated_project.id,
        "name": updated_project.name,
        "color": updated_project.color,
        "rootFolderId": updated_project.root_folder_id,
        "createdAt": updated_project.created_at,
        "lastModified": updated_project.last_modified,
        "isPinned": updated_project.is_pinned
    }

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    # 1. Recuperar o projeto
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Deletar arquivos físicos associados ao projeto
    # Como LIBRARY_DIR é flat, precisamos achar os FileSystemEntry deste projeto
    # O projeto pode ter arquivos linked via fileSystem.project_id
    # OU via rootFolderId -> descendants.
    
    # Estrategia: Encontrar todos itens que pertencem a arvore deste projeto.
    # Mas o FileSystemEntry tem `project_id`?
    # O model tem `project_id = Column(String, nullable=True, index=True)`
    # Se os arquivos foram criados corretamente com project_id, podemos usar isso.
    # Caso contrario, navegar via rootFolderId.
    
    from app.models_db import FileSystemEntry
    from app.config import LIBRARY_DIR
    import os
    
    # A. Tentar via project_id
    items = db.query(FileSystemEntry).filter(FileSystemEntry.project_id == project_id).all()
    
    # B. Se nao tiver items (legacy?), tentar via rootFolderId
    if not items and project.root_folder_id:
        # Helper recursivo
        def get_all_descendant_ids(root_id):
            ids = []
            children = db.query(FileSystemEntry).filter(FileSystemEntry.parent_id == root_id).all()
            for child in children:
                ids.append(child.id)
                if child.type == 'folder':
                    ids.extend(get_all_descendant_ids(child.id))
            return ids
            
        descendants = get_all_descendant_ids(project.root_folder_id)
        # Incluir o root folder também
        all_ids = [project.root_folder_id] + descendants
        items = db.query(FileSystemEntry).filter(FileSystemEntry.id.in_(all_ids)).all()

    deleted_count = 0
    for item in items:
        if item.type == 'file' and item.url:
             try:
                filename = item.url.split('/')[-1]
                path = os.path.join(LIBRARY_DIR, filename)
                if os.path.exists(path):
                    os.remove(path)
                    deleted_count += 1
             except Exception as e:
                 print(f"Error deleting file {path}: {e}")

    # 3. Remover entradas do FileSystem (Cascata manual se DB nao tiver ON DELETE CASCADE)
    if items:
        item_ids = [i.id for i in items]
        db.query(FileSystemEntry).filter(FileSystemEntry.id.in_(item_ids)).delete(synchronize_session=False)

    # 4. Remover Projeto do DB
    crud.delete_project(db, project_id)
    
    return {
        "status": "deleted", 
        "id": project_id, 
        "files_removed": deleted_count
    }
