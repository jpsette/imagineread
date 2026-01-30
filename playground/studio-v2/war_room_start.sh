#!/bin/bash

# WAR ROOM STARTUP SCRIPT
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🏰 WAR ROOM: Starting Disney Demo Environment..."

# 1. Kill potential zombies
pkill -f "uvicorn" || true
pkill -f "vite" || true

# 2. Start Backend (Background)
echo "🐍 Starting Backend (Port 8000)..."
source "$PROJECT_ROOT/backend/venv/bin/activate"
cd "$PROJECT_ROOT/backend"
# Force 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 3. Wait for Backend Healthcheck
echo "⏳ Waiting for Backend..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null; then
        echo "   ✅ Backend is UP!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "   ❌ Backend failed to start. Check logs."
        kill $BACKEND_PID
        exit 1
    fi
done

# 4. Start Frontend
echo "⚛️ Starting Frontend..."
cd "$PROJECT_ROOT/frontend"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
