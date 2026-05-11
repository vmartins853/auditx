# ─────────────────────────────────────────────────────────────────────────────
# routers/reports.py — Router do módulo Reports
#
# Este router é diferente dos outros: em vez de devolver JSON, devolve um
# ficheiro binário (PDF ou HTML) usando o FileResponse do FastAPI.
# O frontend recebe este ficheiro e desencadeia o download automático
# no browser do utilizador.
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter
from fastapi.responses import FileResponse      # Resposta HTTP que envia um ficheiro
from modules.report_generator import generate_pdf_report
import os

router = APIRouter()


@router.post("/generate")
async def generate_report(data: dict):
    """
    Endpoint que gera um relatório de auditoria e devolve o ficheiro para download.

    Recebe os dados do relatório como dicionário JSON e devolve o ficheiro PDF
    (ou HTML se o WeasyPrint não estiver disponível) como resposta HTTP.

    O frontend usa o responseType: 'blob' no Axios para receber o ficheiro
    binário e criar um URL de objeto local para o download automático.

    Parâmetros:
        data (dict): Dados do relatório incluindo alvo, auditor, resultados dos módulos

    Devolve:
        FileResponse: Ficheiro PDF ou HTML para download pelo browser
    """

    # Gera o relatório e obtém o caminho do ficheiro criado em /tmp/auditx_reports/
    path = generate_pdf_report(data)

    # Determina a extensão e o media type correto baseado no ficheiro gerado
    # Se o WeasyPrint gerou PDF usa application/pdf, senão usa text/html
    ext   = "pdf" if path.endswith(".pdf") else "html"
    media = "application/pdf" if ext == "pdf" else "text/html"

    # FileResponse envia o ficheiro como resposta HTTP com os headers corretos
    # O browser interpreta o Content-Type e desencadeia o download
    return FileResponse(
        path,
        media_type=media,
        filename=f"auditx_report.{ext}"  # Nome do ficheiro que aparece no download
    )
