# Auto Backup - 2026-01-07 17:16:05

Backup automático criado pelo sistema.

## Conteúdo
- frontend_src/ - Código frontend
- main.py - Backend API
- data.json - Estado da aplicação
- requirements.txt - Dependências Python

## Restaurar
```bash
# Frontend
cp -r backups/auto_backup_20260107_171605/frontend_src/* frontend/src/

# Backend
cp backups/auto_backup_20260107_171605/main.py backend/
cp backups/auto_backup_20260107_171605/data.json backend/
```
