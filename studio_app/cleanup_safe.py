#!/usr/bin/env python3
"""
🧹 IMAGINE READ - SCRIPT DE LIMPEZA SEGURA
Autor: Antigravity AI Assistant
Data: 2026-01-06

Este script move arquivos seguros para uma pasta temporária antes de deletar,
permitindo fácil reversão caso algo dê errado.
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime
import argparse

# Configurações
PROJECT_ROOT = Path(__file__).parent
TRASH_DIR = PROJECT_ROOT / "_lixo_temp"
MANIFEST_FILE = TRASH_DIR / "manifest.json"

# Categorias de limpeza
CLEANUP_TARGETS = {
    "cache": {
        "description": "Cache Python e arquivos de sistema",
        "patterns": [
            "**/__pycache__",
            "**/*.pyc",
            "**/*.pyo",
            "**/*.pyd",
            "**/.DS_Store"
        ],
        "risk": "zero"
    },
    "temp_images": {
        "description": "Imagens temporárias antigas (backend/temp)",
        "paths": ["backend/temp"],
        "exclude": [".gitkeep"],
        "risk": "zero"
    },
    "yolo_output": {
        "description": "Outputs de teste do YOLO",
        "paths": ["yolo_engine/output"],
        "exclude": [".gitkeep"],
        "risk": "low"
    },
    "debug_scripts": {
        "description": "Scripts de debug/teste na raiz",
        "files": [
            "check_edit_config.py",
            "check_edit_fields.py",
            "check_img_attrs.py",
            "check_mask_mode.py",
            "inspect_sdk.py",
            "inspect_types.py",
            "list_models.py",
            "test_sdk.py",
            "verify_image_save.py",
            "verify_sdk_deep.py"
        ],
        "risk": "low"
    }
}


def get_size(path):
    """Retorna tamanho de arquivo ou diretório em bytes."""
    if path.is_file():
        return path.stat().st_size
    
    total = 0
    for item in path.rglob("*"):
        if item.is_file():
            try:
                total += item.stat().st_size
            except:
                pass
    return total


def format_size(bytes_size):
    """Formata bytes em formato legível."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} TB"


def collect_cleanup_items():
    """Coleta todos os itens que serão limpos."""
    items = []
    
    # Cache files
    for pattern in CLEANUP_TARGETS["cache"]["patterns"]:
        for path in PROJECT_ROOT.glob(pattern):
            if path.exists():
                items.append({
                    "path": str(path.relative_to(PROJECT_ROOT)),
                    "absolute": str(path),
                    "size": get_size(path),
                    "type": "cache",
                    "is_dir": path.is_dir()
                })
    
    # Temp images
    temp_dir = PROJECT_ROOT / "backend/temp"
    if temp_dir.exists():
        for item in temp_dir.iterdir():
            if item.name not in CLEANUP_TARGETS["temp_images"]["exclude"]:
                items.append({
                    "path": str(item.relative_to(PROJECT_ROOT)),
                    "absolute": str(item),
                    "size": get_size(item),
                    "type": "temp_images",
                    "is_dir": item.is_dir()
                })
    
    # YOLO outputs
    output_dir = PROJECT_ROOT / "yolo_engine/output"
    if output_dir.exists():
        for item in output_dir.iterdir():
            if item.name not in CLEANUP_TARGETS["yolo_output"]["exclude"]:
                items.append({
                    "path": str(item.relative_to(PROJECT_ROOT)),
                    "absolute": str(item),
                    "size": get_size(item),
                    "type": "yolo_output",
                    "is_dir": item.is_dir()
                })
    
    # Debug scripts
    for script in CLEANUP_TARGETS["debug_scripts"]["files"]:
        script_path = PROJECT_ROOT / script
        if script_path.exists():
            items.append({
                "path": script,
                "absolute": str(script_path),
                "size": get_size(script_path),
                "type": "debug_scripts",
                "is_dir": False
            })
    
    return items


def preview_cleanup():
    """Mostra preview do que seria limpo."""
    items = collect_cleanup_items()
    
    if not items:
        print("✅ Nenhum arquivo para limpar encontrado!")
        return
    
    print("\n" + "="*70)
    print("🔍 PREVIEW DE LIMPEZA")
    print("="*70 + "\n")
    
    # Group by type
    by_type = {}
    total_size = 0
    
    for item in items:
        item_type = item["type"]
        if item_type not in by_type:
            by_type[item_type] = []
        by_type[item_type].append(item)
        total_size += item["size"]
    
    # Display grouped
    for category, category_items in by_type.items():
        category_size = sum(i["size"] for i in category_items)
        print(f"\n📦 {CLEANUP_TARGETS[category]['description']}")
        print(f"   Arquivos: {len(category_items)} | Espaço: {format_size(category_size)}")
        print(f"   Risco: {CLEANUP_TARGETS[category]['risk'].upper()}")
        print("   " + "-"*60)
        
        # Show first 5 items
        for item in category_items[:5]:
            icon = "📁" if item["is_dir"] else "📄"
            print(f"   {icon} {item['path']} ({format_size(item['size'])})")
        
        if len(category_items) > 5:
            print(f"   ... e mais {len(category_items) - 5} itens")
    
    print("\n" + "="*70)
    print(f"💾 ECONOMIA TOTAL: {format_size(total_size)}")
    print("="*70 + "\n")


def execute_cleanup():
    """Move arquivos para pasta de lixo temporária."""
    items = collect_cleanup_items()
    
    if not items:
        print("✅ Nenhum arquivo para limpar!")
        return
    
    # Create trash directory
    TRASH_DIR.mkdir(exist_ok=True)
    
    moved_items = []
    errors = []
    total_size = 0
    
    print("\n🚀 Executando limpeza...")
    print("="*70 + "\n")
    
    for item in items:
        src = Path(item["absolute"])
        
        # Preserve directory structure in trash
        rel_path = Path(item["path"])
        dest = TRASH_DIR / rel_path
        
        try:
            # Create parent directories
            dest.parent.mkdir(parents=True, exist_ok=True)
            
            # Move file/directory
            if src.exists():
                shutil.move(str(src), str(dest))
                icon = "📁" if item["is_dir"] else "📄"
                print(f"✅ {icon} {item['path']}")
                
                moved_items.append(item)
                total_size += item["size"]
        except Exception as e:
            errors.append({"path": item["path"], "error": str(e)})
            print(f"❌ Erro ao mover {item['path']}: {e}")
    
    # Save manifest
    manifest = {
        "timestamp": datetime.now().isoformat(),
        "total_items": len(moved_items),
        "total_size": total_size,
        "items": moved_items,
        "errors": errors
    }
    
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
    
    print("\n" + "="*70)
    print(f"✅ Movidos {len(moved_items)} itens para: {TRASH_DIR}")
    print(f"💾 Espaço liberado: {format_size(total_size)}")
    if errors:
        print(f"⚠️  Erros: {len(errors)}")
    print("="*70 + "\n")
    print(f"📋 Manifest salvo em: {MANIFEST_FILE}")
    print("\n💡 Para reverter: python cleanup_safe.py --restore")
    print("💡 Para deletar definitivamente: python cleanup_safe.py --commit\n")


def restore_cleanup():
    """Restaura arquivos movidos."""
    if not MANIFEST_FILE.exists():
        print("❌ Nenhum manifest encontrado. Nada para restaurar.")
        return
    
    with open(MANIFEST_FILE, "r") as f:
        manifest = json.load(f)
    
    print(f"\n🔄 Restaurando {manifest['total_items']} itens...")
    print("="*70 + "\n")
    
    restored = 0
    errors = []
    
    for item in manifest["items"]:
        src = TRASH_DIR / item["path"]
        dest = PROJECT_ROOT / item["path"]
        
        try:
            if src.exists():
                # Create parent if needed
                dest.parent.mkdir(parents=True, exist_ok=True)
                
                # Move back
                shutil.move(str(src), str(dest))
                print(f"✅ Restaurado: {item['path']}")
                restored += 1
        except Exception as e:
            errors.append({"path": item["path"], "error": str(e)})
            print(f"❌ Erro ao restaurar {item['path']}: {e}")
    
    print("\n" + "="*70)
    print(f"✅ Restaurados {restored} itens")
    if errors:
        print(f"⚠️  Erros: {len(errors)}")
    print("="*70 + "\n")
    
    # Remove trash dir if empty
    if not any(TRASH_DIR.iterdir()):
        shutil.rmtree(TRASH_DIR)
        print("🗑️  Pasta de lixo removida.\n")


def commit_cleanup():
    """Deleta definitivamente os arquivos movidos."""
    if not TRASH_DIR.exists():
        print("❌ Pasta de lixo não encontrada.")
        return
    
    if not MANIFEST_FILE.exists():
        print("❌ Manifest não encontrado.")
        return
    
    with open(MANIFEST_FILE, "r") as f:
        manifest = json.load(f)
    
    print("\n" + "="*70)
    print("⚠️  ATENÇÃO: DELETAR DEFINITIVAMENTE")
    print("="*70)
    print(f"\nItens: {manifest['total_items']}")
    print(f"Espaço: {format_size(manifest['total_size'])}")
    print(f"\nEsta ação NÃO pode ser desfeita!\n")
    
    confirm = input("Digite 'CONFIRMAR' para deletar: ")
    
    if confirm != "CONFIRMAR":
        print("\n❌ Operação cancelada.\n")
        return
    
    print("\n🗑️  Deletando arquivos...")
    shutil.rmtree(TRASH_DIR)
    print("✅ Arquivos deletados definitivamente.\n")


def main():
    parser = argparse.ArgumentParser(
        description="Script de limpeza segura para Imagine Read"
    )
    
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Mostrar preview do que seria limpo"
    )
    
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Executar limpeza (move para _lixo_temp)"
    )
    
    parser.add_argument(
        "--restore",
        action="store_true",
        help="Restaurar arquivos movidos"
    )
    
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Deletar definitivamente arquivos movidos (irreversível)"
    )
    
    args = parser.parse_args()
    
    if args.preview:
        preview_cleanup()
    elif args.execute:
        execute_cleanup()
    elif args.restore:
        restore_cleanup()
    elif args.commit:
        commit_cleanup()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
