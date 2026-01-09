# 🔄 Sistema de Backup Automático - Imagine Read

## ✅ Instalado

1. **Script de Backup**: `backups/auto_backup.sh`
2. **LaunchAgent**: `backups/com.imagineread.autobackup.plist`

## 🚀 Como Ativar (1 comando)

```bash
cd "/Users/jp/Documents/APP/Imagine Read" && \
cp backups/com.imagineread.autobackup.plist ~/Library/LaunchAgents/ && \
launchctl load ~/Library/LaunchAgents/com.imagineread.autobackup.plist
```

## ⚙️ Configuração

### Frequência
- **A cada 1 hora** (3600 segundos)
- Roda automaticamente ao fazer login (`RunAtLoad: true`)

### O que é Backupado
- ✅ `frontend/src/` (todo código frontend)
- ✅ `backend/main.py` (API)
- ✅ `backend/data.json` (estado completo)
- ✅ `backend/requirements.txt` (dependências)

### Rotação de Backups
- **Mantém últimos 24 backups** (24 horas)
- Backups antigos são automaticamente deletados

### Nomenclatura
```
backups/auto_backup_YYYYMMDD_HHMMSS/
```
Exemplo: `auto_backup_20260107_170000/`

## 📊 Monitoramento

### Ver Log
```bash
tail -f backups/auto_backup.log
```

### Ver Backups Criados
```bash
ls -lht backups/auto_backup_*/ | head -10
```

### Tamanho Total
```bash
du -sh backups/
```

## 🛑 Como Desativar

```bash
launchctl unload ~/Library/LaunchAgents/com.imagineread.autobackup.plist
rm ~/Library/LaunchAgents/com.imagineread.autobackup.plist
```

## 🔧 Testar Manualmente

```bash
./backups/auto_backup.sh
```

## 📝 Logs

Os logs são salvos em:
- `backups/auto_backup.log` - Histórico de backups
- `backups/auto_backup_stdout.log` - Output do script
- `backups/auto_backup_stderr.log` - Erros (se houver)

## 🔄 Restaurar Backup

```bash
# Listar backups disponíveis
ls -lt backups/auto_backup_*/

# Restaurar frontend
cp -r backups/auto_backup_TIMESTAMP/frontend_src/* frontend/src/

# Restaurar backend
cp backups/auto_backup_TIMESTAMP/main.py backend/
cp backups/auto_backup_TIMESTAMP/data.json backend/
```

## ✨ Vantagens

- ✅ **Silencioso** - Roda em background
- ✅ **Automático** - Sem intervenção manual
- ✅ **Leve** - ~364 KB por backup
- ✅ **Seguro** - 24 pontos de restauração (24h)
- ✅ **Não interfere** - Apenas copia arquivos

---

**Status**: Pronto para ativar! Execute o comando acima para começar os backups automáticos.
