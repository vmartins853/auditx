#!/bin/bash

echo "🛡️  AuditX — Setup Automático"
echo "================================"

# Frontend
echo ""
echo "📦 A instalar dependências do frontend..."
cd frontend
npm install
echo "✅ Frontend pronto"

# Backend
echo ""
echo "🐍 A configurar o backend Python..."
cd ../backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "✅ Backend pronto"

echo ""
echo "================================"
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "  1. Edita backend/.env com a tua chave Gemini"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. Backend:  cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo ""
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8000"
echo "  API docs → http://localhost:8000/docs"
