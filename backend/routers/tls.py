# ─────────────────────────────────────────────────────────────────────────────
# routers/tls.py — Router do módulo TLS Inspector
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.tls_check import inspect_certificate

router = APIRouter()


class TLSRequest(BaseModel):
    target: str  # Domínio (ex.: exemplo.com) ou host:porta


@router.post("/inspect")
async def inspect(req: TLSRequest):
    """Inspeciona o certificado TLS do host fornecido."""
    if not req.target or not req.target.strip():
        raise HTTPException(status_code=400, detail="Alvo obrigatório")
    return await inspect_certificate(req.target)
