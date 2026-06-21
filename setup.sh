#!/bin/bash

echo "🛡️  AuditX — Setup Automático"
echo "================================"

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Verifica dependências de sistema
command -v npm >/dev/null     || { echo "❌ npm não encontrado no PATH."; exit 1; }
command -v python3 >/dev/null || { echo "❌ python3 não encontrado no PATH."; exit 1; }

# Frontend
echo ""
echo "📦 A instalar dependências do frontend..."
cd "$ROOT/frontend"
npm install
echo "✅ Frontend pronto"

# Backend
echo ""
echo "🐍 A configurar o backend Python..."
cd "$ROOT/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env: nunca sobrescrever um ficheiro existente (pode ter a chave real)
if [ -f .env ]; then
  echo "ℹ️  backend/.env já existe — mantido (não sobrescrito)"
elif [ -f .env.example ]; then
  cp .env.example .env
  echo "📝 backend/.env criado a partir de .env.example — edita com a tua chave Gemini"
else
  echo "⚠️  backend/.env.example não existe; cria backend/.env manualmente com GEMINI_API_KEY="
fi
echo "✅ Backend pronto"

echo ""
echo "================================"
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "  1. Edita backend/.env com a tua chave Gemini"
echo "  2. Arranca tudo com:  ./start.sh"
echo ""
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8000"
echo "  API docs → http://localhost:8000/docs"
