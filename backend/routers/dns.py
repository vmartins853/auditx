from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.dns_recon import run_dns_recon

router = APIRouter()

class DNSRequest(BaseModel):
    domain: str
    enumerate_subdomains: bool = True

@router.post("/recon")
async def recon(req: DNSRequest):
    if not req.domain or not req.domain.strip():
        raise HTTPException(status_code=400, detail="Domínio obrigatório")

    result = run_dns_recon(req.domain, req.enumerate_subdomains)
    return result
