from fastapi import APIRouter
from fastapi.responses import FileResponse
from modules.report_generator import generate_pdf_report
import os

router = APIRouter()

@router.post("/generate")
async def generate_report(data: dict):
    path = generate_pdf_report(data)
    ext = "pdf" if path.endswith(".pdf") else "html"
    media = "application/pdf" if ext == "pdf" else "text/html"
    return FileResponse(
        path,
        media_type=media,
        filename=f"auditx_report.{ext}"
    )
