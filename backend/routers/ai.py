from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.ai_analyzer import analyze_with_ai

router = APIRouter()

class AnalyzeRequest(BaseModel):
    tool: str       # ex: "nmap", "gobuster", "hydra"
    output: str     # output bruto da ferramenta

@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if not req.output:
        raise HTTPException(status_code=400, detail="Output obrigatório")
    result = await analyze_with_ai(req.tool, req.output)
    return result
