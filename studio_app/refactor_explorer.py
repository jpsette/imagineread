#!/usr/bin/env python3
"""
Script para refatorar App.tsx - Substituir conteúdo da Sidebar pelo componente Explorer.
"""

import re

# Ler o arquivo
with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Definir o novo componente Explorer (substituição)
explorer_component = """                    <Explorer
                        projects={projects}
                        fileSystem={fileSystem}
                        currentProjectId={currentProjectId}
                        currentFolderId={currentFolderId}
                        expandedProjects={expandedProjects}
                        expandedFolders={expandedFolders}
                        PROJECT_THEMES={PROJECT_THEMES}
                        onSelectProject={(id) => {
                            setCurrentProjectId(id);
                            setCurrentFolderId(null);
                            setView('project');
                        }}
                        onSelectFolder={(id) => {
                            setCurrentFolderId(id);
                            setView('project');
                        }}
                        onToggleProjectExpand={(id) => {
                            setExpandedProjects(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(id)) newSet.delete(id);
                                else newSet.add(id);
                                return newSet;
                            });
                        }}
                        onToggleFolderExpand={(id) => {
                            setExpandedFolders(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(id)) newSet.delete(id);
                                else newSet.add(id);
                                return newSet;
                            });
                        }}
                        onEditProject={handleUpdateProject}
                        onDeleteProject={handleDeleteProject}
                        onEditFolder={handleUpdateFolder}
                        onDeleteFolder={handleDeleteFolder}
                    />"""

# Padrão para encontrar todo o conteúdo da Sidebar
# Procura desde <div className="w-full h-full até o fechamento </div> antes de </DraggableWindow>
pattern = r'(<div className="w-full h-full p-4 flex flex-col gap-4 min-w-\[250px\]">.*?)\n(\s*)</div>\s*\n\s*</DraggableWindow>'

# Função para substituir
def replace_sidebar(match):
    indent = match.group(2)  # Captura a indentação
    return explorer_component + '\n' + indent + '</DraggableWindow>'

# Fazer a substituição
content_modified, count = re.subn(pattern, replace_sidebar, content, count=1, flags=re.DOTALL)

if count > 0:
    # Salvar o arquivo modificado
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content_modified)
    print(f"✅ Substituição realizada com sucesso!")
    print(f"   - {count} bloco(s) substituído(s)")
    print(f"   - Conteúdo da Sidebar substituído pelo componente Explorer")
else:
    print("❌ Padrão não encontrado. Tentando abordagem alternativa...")
    
    # Abordagem alternativa: buscar pela estrutura específica da nav
    pattern2 = r'<div className="w-full h-full p-4 flex flex-col gap-4 min-w-\[250px\]">.*?</nav>\s*\n\s*\n\s*</div>'
    
    content_modified2, count2 = re.subn(pattern2, explorer_component, content, count=1, flags=re.DOTALL)
    
    if count2 > 0:
        with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content_modified2)
        print(f"✅ Substituição realizada (abordagem alternativa)!")
        print(f"   - {count2} bloco(s) substituído(s)")
    else:
        print("❌ Não foi possível encontrar o padrão. Verifique manualmente.")
        # Mostrar um trecho para debug
        lines = content.split('\n')
        for i, line in enumerate(lines[640:650], start=641):
            print(f"Linha {i}: {line[:80]}")
