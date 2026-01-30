import os
import shutil
import json
import uuid

# Config
BASE_DIR = "/Users/jp/Documents/app/imagine read/playground/studio-v2"
LIBRARY_DIR = os.path.join(BASE_DIR, "backend/library")
DATA_DIR = os.path.join(BASE_DIR, "backend/data")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
FILESYSTEM_FILE = os.path.join(DATA_DIR, "filesystem.json")

SEED_IMAGE = "page_10_1217f6c2.jpg"
MONSTER_COUNT = 1000
PROJECT_NAME = "MONSTRO 1000 TESTE"

def create_monster():
    print(f"🦖 Criando Monstro de {MONSTER_COUNT} páginas...")

    # 1. Create Project
    project_id = f"project-{uuid.uuid4()}"
    project = {
        "id": project_id,
        "name": PROJECT_NAME,
        "createdAt": "2026-01-29T14:00:00Z",
        "updatedAt": "2026-01-29T14:00:00Z",
        "color": "#FF0000",
        "isPinned": True
    }

    # 2. Create Folder for Project
    folder_id = f"folder-{uuid.uuid4()}"
    folder_entry = {
        "id": folder_id,
        "name": PROJECT_NAME,
        "type": "folder",
        "parentId": "root",
        "projectId": project_id,
        "createdAt": "2026-01-29T14:00:00Z"
    }

    # 3. Duplicate Images & Entries
    files_entries = [folder_entry]
    
    src_path = os.path.join(LIBRARY_DIR, SEED_IMAGE)
    if not os.path.exists(src_path):
        print(f"❌ Imagem semente não encontrada: {src_path}")
        return

    print("   📸 Duplicando imagens...")
    for i in range(1, MONSTER_COUNT + 1):
        new_filename = f"monster_{i:04d}_{uuid.uuid4().hex[:8]}.jpg"
        dst_path = os.path.join(LIBRARY_DIR, new_filename)
        shutil.copy(src_path, dst_path)

        file_entry = {
            "id": f"file-{uuid.uuid4()}",
            "name": f"Página {i}",
            "type": "file",
            "parentId": folder_id,
            "projectId": project_id,
            "url": f"http://127.0.0.1:8000/library/{new_filename}",
            "createdAt": "2026-01-29T14:00:00Z",
            "order": i
        }
        files_entries.append(file_entry)
        
        if i % 100 == 0:
            print(f"   ... {i} criadas")

    # 4. Save JSONs
    print("   💾 Salvando banco de dados...")
    
    # Load existing or create new
    projects = []
    if os.path.exists(PROJECTS_FILE):
        with open(PROJECTS_FILE, 'r') as f:
            projects = json.load(f)
    projects.append(project)
    
    filesystem = []
    if os.path.exists(FILESYSTEM_FILE):
        with open(FILESYSTEM_FILE, 'r') as f:
            filesystem = json.load(f)
    filesystem.extend(files_entries)

    with open(PROJECTS_FILE, 'w') as f:
        json.dump(projects, f, indent=2)
        
    with open(FILESYSTEM_FILE, 'w') as f:
        json.dump(filesystem, f, indent=2)

    print("✅ Monstro Criado! Atualize a página.")

if __name__ == "__main__":
    create_monster()
