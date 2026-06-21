# ─────────────────────────────────────────────────────────────────────────────
# modules/tls_check.py — Inspetor de Certificados TLS
#
# Liga-se ao host:porta por TLS e extrai os detalhes do certificado: sujeito,
# emissor, validade, dias até expirar, SANs, número de série, algoritmo de
# assinatura, versão de TLS e cipher negociados.
#
# Estratégia (dois handshakes):
#   1. SEM verificação — obtém o certificado de qualquer site (mesmo inválido)
#      para mostrar sempre os detalhes (ex.: certificados expirados/self-signed).
#   2. COM verificação — determina se a cadeia/hostname são confiáveis.
#
# O trabalho de rede (bloqueante) corre em asyncio.to_thread para não bloquear
# o event loop do FastAPI.
# ─────────────────────────────────────────────────────────────────────────────

import re
import ssl
import socket
import asyncio
from datetime import datetime, timezone

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID

# Host válido: letras, dígitos, pontos e hífens (sem esquema/caminho)
_HOST_RE = re.compile(r"^[a-zA-Z0-9.\-]+$")


def _clean_host(target: str):
    """Extrai (host, porta) de inputs como 'https://x.com/path' ou 'x.com:8443'."""
    t = target.strip()
    t = re.sub(r"^https?://", "", t, flags=re.I)  # remove esquema
    t = t.split("/")[0]                            # remove caminho
    port = 443
    if ":" in t:
        host, _, p = t.partition(":")
        if p.isdigit():
            port = int(p)
        t = host
    return t, port


def _conn_and_der(host: str, port: int):
    """Handshake SEM verificação → devolve (DER do cert, versão TLS, cipher)."""
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with socket.create_connection((host, port), timeout=10) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as ssock:
            der = ssock.getpeercert(binary_form=True)
            cipher = ssock.cipher()
            return der, ssock.version(), (cipher[0] if cipher else "")


def _verify(host: str, port: int):
    """Handshake COM verificação → (confiável: bool, motivo se não)."""
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((host, port), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname=host):
                return True, ""
    except ssl.SSLCertVerificationError as e:
        return False, (getattr(e, "verify_message", None) or str(e))
    except Exception as e:
        return False, str(e)


def _name_attr(name, oid):
    try:
        return name.get_attributes_for_oid(oid)[0].value
    except Exception:
        return ""


def _inspect(target: str) -> dict:
    host, port = _clean_host(target)
    if not _HOST_RE.match(host):
        return {"status": "error", "message": "Host inválido. Usa um domínio (ex.: exemplo.com)."}

    try:
        der, tls_version, cipher = _conn_and_der(host, port)
    except socket.gaierror:
        return {"status": "error", "message": f"Não foi possível resolver o host '{host}'."}
    except (socket.timeout, ConnectionRefusedError):
        return {"status": "error", "message": f"Não foi possível ligar a {host}:{port} (timeout/recusado)."}
    except Exception as e:
        return {"status": "error", "message": f"Falha na ligação TLS: {e.__class__.__name__}"}

    cert = x509.load_der_x509_certificate(der)

    not_before = cert.not_valid_before_utc
    not_after  = cert.not_valid_after_utc
    now = datetime.now(timezone.utc)

    try:
        sig_algo = cert.signature_hash_algorithm.name if cert.signature_hash_algorithm else ""
    except Exception:
        sig_algo = ""

    sans = []
    try:
        ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
        sans = ext.value.get_values_for_type(x509.DNSName)
    except Exception:
        pass

    trusted, trust_error = _verify(host, port)

    return {
        "status":              "success",
        "host":                host,
        "port":                port,
        "tls_version":         tls_version,
        "cipher":              cipher,
        "subject_cn":          _name_attr(cert.subject, NameOID.COMMON_NAME),
        "issuer_cn":           _name_attr(cert.issuer, NameOID.COMMON_NAME),
        "issuer_org":          _name_attr(cert.issuer, NameOID.ORGANIZATION_NAME),
        "valid_from":          not_before.strftime("%Y-%m-%d"),
        "valid_until":         not_after.strftime("%Y-%m-%d"),
        "days_left":           (not_after - now).days,
        "expired":             now > not_after,
        "not_yet_valid":       now < not_before,
        "trusted":             trusted,
        "trust_error":         "" if trusted else trust_error,
        "serial":              format(cert.serial_number, "x"),
        "signature_algorithm": sig_algo,
        "san":                 sans,
        "san_count":           len(sans),
        "timestamp":           now.isoformat(),
    }


async def inspect_certificate(target: str) -> dict:
    """Wrapper assíncrono — corre a inspeção (bloqueante) numa thread."""
    return await asyncio.to_thread(_inspect, target)
