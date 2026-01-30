#!/usr/bin/env python3
"""
Script para refatorar App.tsx - Substituir dashboard pelo componente ProjectManager.
"""

import re

# Ler o arquivo
with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar import do ProjectManager
if 'import { ProjectManager }' not in content:
    content = content.replace(
        "import { Explorer } from './components/Explorer'",
        "import { Explorer } from './components/Explorer'\nimport { ProjectManager } from './components/ProjectManager'"
    )
    print("✅ Import do ProjectManager adicionado")

# 2. Substituir o conteúdo da dashboard
# Padrão: desde o header da dashboard até o final do grid de projetos
pattern = r'{view === \'dashboard\' \? \(\s*// PROJECTS GRID\s*<div className="grid grid-cols-\[repeat\(auto-fill,280px\)\] gap-6 content-start justify-start">.*?</div>\s*\) : \('

replacement = '''{view === 'dashboard' ? (
                                    <ProjectManager
                                        projects={projects}
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        sortOrder={sortOrder}
                                        setSortOrder={setSortOrder}
                                        isCreatingProject={isCreatingProject}
                                        setIsCreatingProject={setIsCreatingProject}
                                        newItemName={newItemName}
                                        setNewItemName={setNewItemName}
                                        newItemColor={newItemColor}
                                        setNewItemColor={setNewItemColor}
                                        editingProject={editingProject}
                                        setEditingProject={setEditingProject}
                                        editName={editName}
                                        setEditName={setEditName}
                                        editColor={editColor}
                                        setEditColor={setEditColor}
                                        PROJECT_THEMES={PROJECT_THEMES}
                                        onCreateProject={handleCreateProject}
                                        onUpdateProject={handleUpdateProject}
                                        onDeleteProject={handleDeleteProject}
                                        onSelectProject={(id) => {
                                            setCurrentProjectId(id);
                                            setCurrentFolderId(null);
                                            setView('project');
                                        }}
                                        onTogglePin={(id) => {
                                            setProjects(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
                                        }}
                                    />
                                ) : ('''

content_modified, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)

if count > 0:
    # Salvar
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content_modified)
    print(f"✅ Dashboard substituída pelo ProjectManager!")
    print(f"   - {count} bloco(s) substituído(s)")
else:
    print("❌ Padrão não encontrado. Tentando abordagem alternativa...")
    
    # Tentar padrão mais simples
    # Procurar do início do header da dashboard até antes do ') : ('
    pattern2 = r'\{view === \'dashboard\' \? \(\s*<header className="flex flex-col gap-6 mb-8">.*?</div>\s*\) : \('
    
    content_modified2, count2 = re.subn(pattern2, replacement, content, count=1, flags=re.DOTALL)
    
    if count2 > 0:
        with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content_modified2)
        print(f"✅ Dashboard substituída (abordagem alternativa)!")
    else:
        print("❌ Não encontrado. Mostrando trecho para debug:")
        lines = content.split('\n')
        for i, line in enumerate(lines[975:985], start=976):
            print(f"Linha {i}: {line[:100]}")
