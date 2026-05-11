# ─────────────────────────────────────────────────────────────────────────────
# routers/ai.py — Router do módulo AI Analyzer
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.ai_analyzer import analyze_with_ai

router = APIRouter()


class AnalyzeRequest(BaseModel):
    tool:   str  # Nome da ferramenta cujo output vai ser analisado (ex: "nmap", "gobuster")
    output: str  # Output bruto da ferramenta, tal como apareceria no terminal


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Endpoint que envia o output de uma ferramenta para análise pela API Gemini.

    Este endpoint é assíncrono (async) porque a chamada à API Gemini envolve
    uma operação de I/O de rede (pedido HTTPS), e o async permite que o
    servidor continue a processar outros pedidos enquanto aguarda a resposta.
    """

    # Validação: o output não pode estar vazio
    # Não faz sentido enviar um pedido vazio à API Gemini
    if not req.output:
        raise HTTPException(status_code=400, detail="Output obrigatório")

    # Delega a análise ao módulo ai_analyzer.py (função também assíncrona)
    result = await analyze_with_ai(req.tool, req.output)
    return result
