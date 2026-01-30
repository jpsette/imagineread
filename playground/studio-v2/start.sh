#!/bin/bash

# Define project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "   🚀 Imagine Read - Robust Startup v2    "
echo "=========================================="

# 1. Clean Port 8000
echo "🧹 Checking port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
echo "   ✅ Port 8000 cleared."

# 2. Activate Virtual Environment & Start Backend
echo "🐍 Starting Backend (Uvicorn)..."
source "$PROJECT_ROOT/backend/venv/bin/activate"
cd "$PROJECT_ROOT/backend"
# Run in background and save PID
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "   ✅ Backend started (PID: $BACKEND_PID)"

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready on port 8000..."
while ! nc -z localhost 8000; do   
  sleep 0.5
done
echo "   ✅ Backend is ready!"

# 3. Launch Frontend
echo "🚀 Starting Frontend (Electron + Vite)..."
cd "$PROJECT_ROOT/frontend"
# Run in background
npm run dev &
FRONTEND_PID=$!
echo "   ✅ Frontend started (PID: $FRONTEND_PID)"

# 4. Wait for processes to keep script alive
echo "⏳ Waiting for processes... (Press Ctrl+C to stop)"
wait $BACKEND_PID $FRONTEND_PID
