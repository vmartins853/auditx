from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scanner, dns, ai, reports

app = FastAPI(
    title="AuditX API",
    description="Backend da plataforma AuditX — Ferramenta de Testes de Segurança",
    version="0.1.0"
)

# CORS — permite o frontend React comunicar com o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registar routers
app.include_router(scanner.router, prefix="/api/scanner", tags=["Scanner"])
app.include_router(dns.router,     prefix="/api/dns",     tags=["DNS Recon"])
app.include_router(ai.router,      prefix="/api/ai",      tags=["AI Analyzer"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
def root():
    return {"status": "AuditX API online", "version": "0.1.0"}
