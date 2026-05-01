from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.scanner import run_nmap_scan

router = APIRouter()

class ScanRequest(BaseModel):
    target: str
    ports: str = "1-1000"
    flags: list[str] = []

@router.post("/scan")
async def scan(req: ScanRequest):
    if not req.target:
        raise HTTPException(status_code=400, detail="Target obrigatório")
    result = run_nmap_scan(req.target, req.ports, req.flags)
    return result
