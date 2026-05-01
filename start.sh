#!/bin/bash

echo "🛡️  A iniciar AuditX..."

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Backend em background
echo "🐍 A iniciar backend..."
cd "$ROOT/backend"
"$ROOT/backend/venv/bin/python" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend a correr (PID: $BACKEND_PID)"

sleep 2

# Frontend em background
echo "⚛️  A iniciar frontend..."
cd "$ROOT/frontend"
/usr/bin/npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend a correr (PID: $FRONTEND_PID)"

echo ""
echo "================================"
echo "🛡️  AuditX está a correr!"
echo "   Frontend → http://127.0.0.1:5173"
echo "   Backend  → http://127.0.0.1:8000"
echo "   API Docs → http://127.0.0.1:8000/docs"
echo "================================"
echo ""
echo "Prima CTRL+C para parar tudo."

trap "echo ''; echo '🛑 A parar AuditX...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
