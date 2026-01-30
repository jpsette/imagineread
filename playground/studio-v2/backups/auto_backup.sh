#!/bin/bash

# Auto Backup Script - Imagine Read
# Roda automaticamente a cada hora via launchd

PROJECT_DIR="/Users/jp/Documents/APP/Imagine Read"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="auto_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Criar diretório de backup
mkdir -p "$BACKUP_PATH"

# Backup Frontend (src apenas)
cp -r "$PROJECT_DIR/frontend/src" "$BACKUP_PATH/frontend_src" 2>/dev/null

# Backup Backend (arquivos essenciais)
cp "$PROJECT_DIR/backend/main.py" "$BACKUP_PATH/" 2>/dev/null
cp "$PROJECT_DIR/backend/data.json" "$BACKUP_PATH/" 2>/dev/null
cp "$PROJECT_DIR/backend/requirements.txt" "$BACKUP_PATH/" 2>/dev/null

# Criar README
cat > "$BACKUP_PATH/README.md" << EOF
# Auto Backup - $(date +"%Y-%m-%d %H:%M:%S")

Backup automático criado pelo sistema.

## Conteúdo
- frontend_src/ - Código frontend
- main.py - Backend API
- data.json - Estado da aplicação
- requirements.txt - Dependências Python

## Restaurar
\`\`\`bash
# Frontend
cp -r backups/$BACKUP_NAME/frontend_src/* frontend/src/

# Backend
cp backups/$BACKUP_NAME/main.py backend/
cp backups/$BACKUP_NAME/data.json backend/
\`\`\`
EOF

# Limpar backups antigos (manter apenas últimos 24 = 24 horas)
cd "$BACKUP_DIR" || exit
ls -dt auto_backup_* 2>/dev/null | tail -n +25 | xargs rm -rf 2>/dev/null

# Log silencioso
echo "$(date +"%Y-%m-%d %H:%M:%S") - Backup criado: $BACKUP_NAME" >> "$BACKUP_DIR/auto_backup.log"

exit 0
