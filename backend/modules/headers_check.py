# ─────────────────────────────────────────────────────────────────────────────
# modules/headers_check.py — Módulo de Verificação de Cabeçalhos de Segurança HTTP
#
# Faz um pedido GET ao URL alvo e avalia a presença (e ausência) dos principais
# cabeçalhos de segurança HTTP, atribuindo uma classificação (A–F). Também
# sinaliza cabeçalhos que revelam informação sobre o stack tecnológico.
#
# A chamada de rede é assíncrona (httpx.AsyncClient) para não bloquear o event
# loop do FastAPI.
#
# Nota de segurança: este módulo faz um pedido do lado do servidor para um URL
# fornecido pelo utilizador (potencial SSRF). Destina-se a testes autorizados em
# ambiente controlado.
# ─────────────────────────────────────────────────────────────────────────────

import re
import httpx
from datetime import datetime

# O URL tem de começar explicitamente por http:// ou https://
_URL_RE = re.compile(r"^https?://", re.I)

# Cabeçalhos de segurança esperados.
# key      — nome do cabeçalho (minúsculas, para comparação case-insensitive)
# label    — nome legível
# desc     — para que serve
# severity — gravidade quando AUSENTE
# rec      — recomendação de remediação
SECURITY_HEADERS = [
    {"key": "strict-transport-security", "label": "Strict-Transport-Security (HSTS)",
     "desc": "Força o browser a comunicar sempre por HTTPS.", "severity": "Alta",
     "rec": "Strict-Transport-Security: max-age=31536000; includeSubDomains"},
    {"key": "content-security-policy", "label": "Content-Security-Policy (CSP)",
     "desc": "Mitiga XSS e injeção ao restringir as fontes de conteúdo.", "severity": "Alta",
     "rec": "Define uma CSP restritiva, ex.: default-src 'self'"},
    {"key": "x-frame-options", "label": "X-Frame-Options",
     "desc": "Previne clickjacking ao impedir embedding em frames.", "severity": "Média",
     "rec": "X-Frame-Options: DENY (ou CSP frame-ancestors 'none')"},
    {"key": "x-content-type-options", "label": "X-Content-Type-Options",
     "desc": "Impede MIME-sniffing pelo browser.", "severity": "Média",
     "rec": "X-Content-Type-Options: nosniff"},
    {"key": "referrer-policy", "label": "Referrer-Policy",
     "desc": "Controla a informação enviada no header Referer.", "severity": "Baixa",
     "rec": "Referrer-Policy: strict-origin-when-cross-origin"},
    {"key": "permissions-policy", "label": "Permissions-Policy",
     "desc": "Restringe APIs do browser (câmara, geolocalização, etc.).", "severity": "Baixa",
     "rec": "Define uma Permissions-Policy adequada ao site"},
    {"key": "cross-origin-opener-policy", "label": "Cross-Origin-Opener-Policy (COOP)",
     "desc": "Isola o contexto de navegação contra ataques cross-origin.", "severity": "Baixa",
     "rec": "Cross-Origin-Opener-Policy: same-origin"},
]

# Cabeçalhos que expõem informação do stack — a sua PRESENÇA é um ponto fraco
INFO_LEAK_HEADERS = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"]


def _grade(score: int) -> str:
    """Converte a pontuação (0–100) numa classificação A–F."""
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 50:
        return "C"
    if score >= 30:
        return "D"
    return "F"


async def check_security_headers(url: str) -> dict:
    """
    Avalia os cabeçalhos de segurança HTTP do URL fornecido.

    Devolve:
        dict: estado, URL final (após redirects), código HTTP, lista de cabeçalhos
              avaliados, fugas de informação, pontuação e classificação.
    """
    url = url.strip()
    if not _URL_RE.match(url):
        return {"status": "error", "message": "URL inválido. Tem de começar por http:// ou https://"}

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            resp = await client.get(url, headers={"User-Agent": "AuditX/0.1 SecurityHeadersChecker"})
    except httpx.RequestError as e:
        return {"status": "error", "message": f"Não foi possível alcançar o alvo: {e.__class__.__name__}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

    # Normaliza os nomes dos cabeçalhos para minúsculas (HTTP é case-insensitive)
    headers = {k.lower(): v for k, v in resp.headers.items()}

    checked = []
    present_count = 0
    for h in SECURITY_HEADERS:
        present = h["key"] in headers
        if present:
            present_count += 1
        checked.append({
            "header":         h["label"],
            "present":        present,
            "value":          headers.get(h["key"], ""),
            "severity":       h["severity"],
            "desc":           h["desc"],
            "recommendation": "" if present else h["rec"],
        })

    info_leaks = [{"header": k, "value": headers[k]} for k in INFO_LEAK_HEADERS if k in headers]

    total = len(SECURITY_HEADERS)
    score = round(present_count / total * 100)

    return {
        "status":      "success",
        "url":         url,
        "final_url":   str(resp.url),
        "status_code": resp.status_code,
        "timestamp":   datetime.now().isoformat(),
        "checked":     checked,
        "info_leaks":  info_leaks,
        "present":     present_count,
        "total":       total,
        "score":       score,
        "grade":       _grade(score),
    }
