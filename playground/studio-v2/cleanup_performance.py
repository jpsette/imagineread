#!/usr/bin/env python3
"""
Script para limpar código problemático de Drag&Drop e Zoom do Imagine Read
que está causando "tile memory limits exceeded" no Electron.
"""

import re

def clean_app_tsx():
    """Remove drag&drop handlers e referências do App.tsx"""
    
    file_path = "/Users/jp/Documents/APP/Imagine Read/frontend/src/App.tsx"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remover funções de drag handlers (4 funções grandes)
    # Encontrar e remover desde "// Page Drag & Drop" até antes de "// Add Page"
    pattern_handlers = r'    // Page Drag & Drop Handlers.*?(?=    // Add Page)'
    replacement = '''
    // NOTE: Drag & Drop handlers removed to prevent "tile memory limits exceeded" errors
    // Pages can still be selected via click. Reordering can be added later with CSS Transform.

'''
    content = re.sub(pattern_handlers, replacement, content, flags=re.DOTALL)
    
    # 2. Remover props de drag dos elementos (draggable, onDragStart, etc)
    # Remover linhas com draggable
    content = re.sub(r'\s+draggable\n', '', content)
    
    # Remover onDragStart
    content = re.sub(r'\s+onDragStart=\{[^}]+\}\n', '', content)
    
    # Remover onDragEnter  
    content = re.sub(r'\s+onDragEnter=\{[^}]+\}\n', '', content)
    
    # Remover onDragOver
    content = re.sub(r'\s+onDragOver=\{[^}]+\}\n', '', content)
    
    # Remover onDrop
    content = re.sub(r'\s+onDrop=\{[^}]+\}\n', '', content)
    
    # 3. Remover referências a draggedPageId nas classNames
    # Substituir clauses com draggedPageId === page.id ? 'opacity-0' : ''
    content = re.sub(r' \$\{draggedPageId === page\.id \? \'opacity-0\' : \'\'\}', '', content)
    
    # 4. Remover props layout e layoutId do motion.div (causam reflow)
    content = re.sub(r'\s+layout\n', '', content)
    content = re.sub(r'\s+layoutId=\{[^}]+\}\n', '', content)
    
    # Salvar
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ App.tsx cleaned: Drag handlers and heavy Motion props removed")


def clean_editor_view_tsx():
    """Simplifica zoom no EditorView.tsx para evitar reflow"""
    
    file_path = "/Users/jp/Documents/APP/Imagine Read/frontend/src/components/EditorView.tsx"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Fixar zoom em 1 (remover estado dinâmico temporariamente)
    content = re.sub(
        r'const \[zoom, setZoom\] = useState\(1\);',
        'const zoom = 1; // Fixed zoom - dynamic zoom causes reflow issues',
        content
    )
    
    # 2. Comentar/remover o controle de zoom slider (temporariamente)
    # Encontrar a seção do slider e comentar
    slider_pattern = r'(<span className="px-3 py-1.*?{Math\.round\(zoom \* 100\)}%</span>)'
    content = re.sub(
        slider_pattern,
        r'{/* \1 */}',
        content,
        flags=re.DOTALL
    )
    
    # 3. Mudar width/height do container para usar max-width CSS ao invés de cálculo dinâmico
    # Remover width: imgNaturalSize.w * zoom e height: imgNaturalSize.h * zoom
    content = re.sub(
        r'width: imgNaturalSize\.w \* zoom,\s*\n\s*height: imgNaturalSize\.h \* zoom,',
        'maxWidth: "100%", // Use CSS max-width instead of calculated dimensions\n                            maxHeight: "100%",',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ EditorView.tsx cleaned: Zoom fixed, reflow-causing dimensions removed")


if __name__ == "__main__":
    print("🧹 Starting cleanup...")
    clean_app_tsx()
    clean_editor_view_tsx()
    print("\n🎉 Cleanup complete! Restart the app to see the improvements.")
