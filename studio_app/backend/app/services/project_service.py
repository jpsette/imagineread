from sqlalchemy.orm import Session
from fastapi import HTTPException
import os
from app import crud
from app.models_db import FileSystemEntry
from app.config import LIBRARY_DIR

def delete_project_and_files(db: Session, project_id: str):
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
