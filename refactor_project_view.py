#!/usr/bin/env python3
"""
Script para refatorar App.tsx - Substituir project view pelo componente ProjectView.
"""

import re

# Ler o arquivo
with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar import do ProjectView
if 'import { ProjectView }' not in content:
    content = content.replace(
        "import { ProjectManager } from './components/ProjectManager'",
        "import { ProjectManager } from './components/ProjectManager'\nimport { ProjectView } from './components/ProjectView'"
    )
    print("✅ Import do ProjectView adicionado")

# 2. Substituir o conteúdo da project view
# Padrão: desde // PROJECT / FOLDER CONTENTS até o fechamento do fragmento
pattern = r'// PROJECT / FOLDER CONTENTS\s*<>\s*{loading && \(.*?</>\s*\)'

replacement = '''// PROJECT / FOLDER CONTENTS
                                    <ProjectView
                                        loading={loading}
                                        error={error}
                                        isCreatingFolder={isCreatingFolder}
                                        setIsCreatingFolder={setIsCreatingFolder}
                                        newItemName={newItemName}
                                        setNewItemName={setNewItemName}
                                        newItemColor={newItemColor}
                                        setNewItemColor={setNewItemColor}
                                        editingFolder={editingFolder}
                                        setEditingFolder={setEditingFolder}
                                        editName={editName}
                                        setEditName={setEditName}
                                        editColor={editColor}
                                        setEditColor={setEditColor}
                                        PROJECT_THEMES={PROJECT_THEMES}
                                        currentItems={getCurrentItems()}
                                        fileSystem={fileSystem}
                                        searchTerm={searchTerm}
                                        sortOrder={sortOrder}
                                        onCreateFolder={handleCreateFolder}
                                        onUpdateFolder={handleUpdateFolder}
                                        onDeleteFolder={handleDeleteFolder}
                                        onOpenComic={(id) => setOpenedComicId(id)}
                                        onOpenItem={openItem}
                                        onTogglePin={(id) => {
                                            setFileSystem(prev => prev.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
                                        }}
                                        onDeleteItem={(id) => {
                                            setFileSystem(prev => prev.filter(f => f.id !== id && f.parentId !== id));
                                        }}
                                    />
                                )'''

content_modified, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)

if count > 0:
    # Salvar
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content_modified)
    print(f"✅ Project view substituída pelo ProjectView!")
    print(f"   - {count} bloco(s) substituído(s)")
else:
    print("❌ Padrão não encontrado.")
    print("Tentando encontrar o trecho...")
    if '// PROJECT / FOLDER CONTENTS' in content:
        print("✅ Comentário encontrado!")
        idx = content.find('// PROJECT / FOLDER CONTENTS')
        print(f"Trecho: {content[idx:idx+200]}")
    else:
        print("❌ Comentário não encontrado")
