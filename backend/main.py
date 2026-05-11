# ─────────────────────────────────────────────────────────────────────────────
# main.py — Ponto de entrada do backend do AuditX
#
# Este ficheiro inicializa a aplicação FastAPI, configura o middleware de CORS
# (Cross-Origin Resource Sharing — permite que o frontend React comunique com
# o backend sem ser bloqueado pelo browser) e regista todos os routers dos
# módulos disponíveis.
#
# Para arrancar o servidor:
#   uvicorn main:app --reload --host 127.0.0.1 --port 8000
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importação dos routers de cada módulo da aplicação
from routers import scanner, dns, ai, reports

# ── Inicialização da aplicação FastAPI ────────────────────────────────────────
# O FastAPI gera automaticamente documentação interativa em:
#   http://localhost:8000/docs  (Swagger UI)
#   http://localhost:8000/redoc (ReDoc)
app = FastAPI(
    title="AuditX API",
    description="Backend da plataforma AuditX — Ferramenta de Testes de Segurança",
    version="0.1.1"
)

# ── Configuração do CORS ──────────────────────────────────────────────────────
# O CORS (Cross-Origin Resource Sharing) é um mecanismo de segurança do browser
# que bloqueia pedidos feitos de uma origem (ex: localhost:5173) para outra
# (ex: localhost:8000). O middleware abaixo autoriza explicitamente o frontend
# React a comunicar com este backend.
#
# Nota: Em produção, substituir "http://localhost:5173" pelo domínio real
# do frontend para evitar aceitar pedidos de origens não autorizadas.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Origem autorizada — frontend React
    allow_credentials=True,                   # Permite envio de cookies e headers de autenticação
    allow_methods=["*"],                      # Permite todos os métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],                      # Permite todos os headers HTTP
)

# ── Registo dos routers ───────────────────────────────────────────────────────
# Cada router corresponde a um módulo da aplicação e define os endpoints
# (endereços HTTP) disponíveis para o frontend. O prefixo define o caminho
# base de cada grupo de endpoints.
#
# Exemplo de endpoints gerados:
#   POST /api/scanner/scan    — executa um scan Nmap
#   POST /api/dns/recon       — executa reconhecimento DNS
#   POST /api/ai/analyze      — envia output para análise pela IA
#   POST /api/reports/generate — gera um relatório PDF
app.include_router(scanner.router, prefix="/api/scanner", tags=["Scanner"])
app.include_router(dns.router,     prefix="/api/dns",     tags=["DNS Recon"])
app.include_router(ai.router,      prefix="/api/ai",      tags=["AI Analyzer"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


# ── Endpoint de verificação de estado ─────────────────────────────────────────
# Endpoint raiz usado para confirmar que o backend está online.
# Aceder a http://localhost:8000/ devolve:
#   {"status": "AuditX API online", "version": "0.1.0"}
@app.get("/")
def root():
    return {"status": "AuditX API online", "version": "0.1.0"}
