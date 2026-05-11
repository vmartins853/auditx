# ─────────────────────────────────────────────────────────────────────────────
# routers/dns.py — Router do módulo DNS Recon
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.dns_recon import run_dns_recon

router = APIRouter()


class DNSRequest(BaseModel):
    domain:               str   # Domínio alvo (ex: "google.com") — obrigatório
    enumerate_subdomains: bool = True  # Se True, tenta os subdomínios da lista COMMON_SUBDOMAINS


@router.post("/recon")
async def recon(req: DNSRequest):
    """
    Endpoint que executa o reconhecimento DNS e devolve os resultados estruturados.

    Valida que o domínio não está vazio antes de invocar o módulo dns_recon.
    """

    # Validação: o domínio não pode ser vazio ou conter apenas espaços
    if not req.domain or not req.domain.strip():
        raise HTTPException(status_code=400, detail="Domínio obrigatório")

    # Delega a execução ao módulo dns_recon.py
    result = run_dns_recon(req.domain, req.enumerate_subdomains)
    return result
