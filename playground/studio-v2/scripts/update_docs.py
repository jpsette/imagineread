import os
import datetime
import re
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_FILE = PROJECT_ROOT / "PROJECT_DOCS.md"
EXCLUDED_DIRS = {'.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist-electron', '.DS_Store', 'temp', 'backups'}
EXCLUDED_FILES = {'.DS_Store', 'package-lock.json', 'yarn.lock'}

def generate_tree(dir_path: Path, prefix: str = ""):
    """Generates a string representation of the file tree."""
    output = ""
    try:
        entries = sorted([e for e in os.listdir(dir_path) if e not in EXCLUDED_DIRS and e not in EXCLUDED_FILES])
        entries = [e for e in entries if not (dir_path / e).is_file() or (dir_path / e).name not in EXCLUDED_FILES]
        
        for i, entry in enumerate(entries):
            is_last = i == len(entries) - 1
            connector = "└── " if is_last else "├── "
            entry_path = dir_path / entry
            
            output += f"{prefix}{connector}{entry}\n"
            
            if entry_path.is_dir():
                extension = "    " if is_last else "│   "
                output += generate_tree(entry_path, prefix + extension)
    except PermissionError:
        pass
    return output

def count_lines_of_code(dir_path: Path):
    """Counts lines of code in key files."""
    stats = {
        "Python": {"lines": 0, "files": 0},
        "TypeScript/TSX": {"lines": 0, "files": 0},
        "CSS": {"lines": 0, "files": 0},
    }
    
    for root, dirs, files in os.walk(dir_path):
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            if file in EXCLUDED_FILES:
                continue
                
            file_path = Path(root) / file
            ext = file_path.suffix.lower()
            
            category = None
            if ext == '.py': category = "Python"
            elif ext in ['.ts', '.tsx']: category = "TypeScript/TSX"
            elif ext == '.css': category = "CSS"
            
            if category:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = sum(1 for line in f if line.strip())
                        stats[category]["lines"] += lines
                        stats[category]["files"] += 1
                except Exception:
                    pass
                    
    return stats

def extract_api_endpoints(main_py_path: Path):
    """Extracts FastAPI endpoints from main.py."""
    endpoints = []
    if not main_py_path.exists():
        return ["*Backend main.py not found.*"]

    try:
        with open(main_py_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Regex to find @app.get/post/put/delete("path")
            matches = re.finditer(r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', content)
            for match in matches:
                method = match.group(1).upper()
                path = match.group(2)
                endpoints.append(f"`{method}` **{path}**")
    except Exception as e:
        return [f"Error parsing API endpoints: {e}"]
    
    return sorted(endpoints) if endpoints else ["*No endpoints found (check regex parser).*"]

def update_docs():
    """Main function to update the documentation file."""
    if not DOCS_FILE.exists():
        print(f"Error: {DOCS_FILE} not found.")
        return

    print("Generating project stats...")
    stats = count_lines_of_code(PROJECT_ROOT)
    
    print("Generating file tree...")
    tree_str = f"```text\n.\n{generate_tree(PROJECT_ROOT)}```"

    print("Extracting API endpoints...")
    endpoints = extract_api_endpoints(PROJECT_ROOT / "backend" / "main.py")
    api_str = "\n".join([f"* {ep}" for ep in endpoints])

    stats_str = "| Language | Files | Lines (Approx) |\n|---|---|---|\n"
    for lang, data in stats.items():
        stats_str += f"| {lang} | {data['files']} | {data['lines']} |\n"

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(DOCS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update Timestamp
    content = re.sub(r'(> \*\*Last Updated:\*\* ).*', f'\\1{timestamp}', content)

    # Update Stats
    content = re.sub(
        r'(<!-- AUTO_GENERATED_STATS_START -->)(.*?)(<!-- AUTO_GENERATED_STATS_END -->)',
        f'\\1\n{stats_str}\n\\3',
        content, flags=re.DOTALL
    )

    # Update Structure
    content = re.sub(
        r'(<!-- AUTO_GENERATED_STRUCTURE_START -->)(.*?)(<!-- AUTO_GENERATED_STRUCTURE_END -->)',
        f'\\1\n{tree_str}\n\\3',
        content, flags=re.DOTALL
    )

    # Update API
    content = re.sub(
        r'(<!-- AUTO_GENERATED_API_START -->)(.*?)(<!-- AUTO_GENERATED_API_END -->)',
        f'\\1\n{api_str}\n\\3',
        content, flags=re.DOTALL
    )

    with open(DOCS_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Successfully updated {DOCS_FILE}")

def get_project_stats():
    """Returns project statistics for the dashboard."""
    return count_lines_of_code(PROJECT_ROOT)

def get_project_tree():
    """Returns project tree string for the dashboard."""
    return generate_tree(PROJECT_ROOT)

if __name__ == "__main__":
    update_docs()
