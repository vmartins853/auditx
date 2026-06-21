# ─────────────────────────────────────────────────────────────────────────────
# routers/headers.py — Router do módulo Security Headers
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.headers_check import check_security_headers

router = APIRouter()


class HeadersRequest(BaseModel):
    url: str  # URL alvo (tem de começar por http:// ou https://)


@router.post("/check")
async def check(req: HeadersRequest):
    """Avalia os cabeçalhos de segurança HTTP do URL fornecido."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL obrigatório")
    return await check_security_headers(req.url)
