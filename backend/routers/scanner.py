# ─────────────────────────────────────────────────────────────────────────────
# routers/scanner.py — Router do módulo Port Scanner
#
# Define os endpoints HTTP do módulo Port Scanner. Um router no FastAPI é um
# componente que agrupa endpoints relacionados, neste caso todos os endpoints
# relativos ao scanning de portas.
#
# Endpoint disponível:
#   POST /api/scanner/scan — recebe as opções de scan e devolve os resultados
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel             # Validação automática dos dados de entrada
from modules.scanner import run_nmap_scan  # Função que invoca o Nmap

router = APIRouter()


# ── Modelo de dados do pedido de scan ────────────────────────────────────────
# O Pydantic valida automaticamente os dados recebidos no corpo do pedido HTTP.
# Se o frontend enviar um campo com tipo incorreto, o FastAPI devolve um erro
# 422 (Unprocessable Entity) automaticamente, sem chegar à lógica do scan.
class ScanRequest(BaseModel):
    target: str            # Endereço IP ou domínio alvo (obrigatório)
    ports:  str = "1-1000" # Range de portas a analisar (por omissão: top 1000)
    flags:  list[str] = [] # Flags Nmap adicionais (por omissão: nenhuma)


@router.post("/scan")
async def scan(req: ScanRequest):
    """
    Endpoint que executa um scan Nmap e devolve os resultados estruturados.

    O FastAPI desserializa automaticamente o corpo JSON do pedido para o
    objeto ScanRequest e valida os tipos de dados antes de chegar aqui.

    Devolve:
        dict: Resultados do scan com estado, target, timestamp, comando, raw e parsed
    """

    # Validação adicional — o target não pode ser uma string vazia
    # (o Pydantic valida o tipo mas não o conteúdo mínimo)
    if not req.target:
        raise HTTPException(status_code=400, detail="Target obrigatório")

    # Delega a execução ao módulo scanner.py e devolve o resultado diretamente
    result = run_nmap_scan(req.target, req.ports, req.flags)
    return result
