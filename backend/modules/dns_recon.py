import dns.resolver
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]

# Lista de subdomínios comuns para enumeração
COMMON_SUBDOMAINS = [
    "www", "mail", "ftp", "admin", "api", "dev", "staging", "test",
    "blog", "shop", "app", "portal", "vpn", "remote", "webmail",
    "smtp", "pop", "imap", "ns1", "ns2", "cdn", "static", "assets",
    "m", "mobile", "secure", "login", "support", "help", "docs",
]


def resolve_record(domain: str, rtype: str) -> tuple[str, list]:
    """Resolve um tipo de registo DNS para um domínio."""
    try:
        answers = dns.resolver.resolve(domain, rtype, lifetime=5)
        return rtype, [str(r) for r in answers]
    except dns.resolver.NoAnswer:
        return rtype, []
    except dns.resolver.NXDOMAIN:
        return rtype, None  # None indica domínio não existe
    except Exception:
        return rtype, []


def check_subdomain(subdomain: str, domain: str) -> dict | None:
    """Verifica se um subdomínio existe e resolve para A ou CNAME."""
    fqdn = f"{subdomain}.{domain}"
    try:
        answers = dns.resolver.resolve(fqdn, "A", lifetime=3)
        return {
            "subdomain": fqdn,
            "type": "A",
            "records": [str(r) for r in answers]
        }
    except dns.resolver.NXDOMAIN:
        return None
    except dns.resolver.NoAnswer:
        # Tenta CNAME se A falhar
        try:
            answers = dns.resolver.resolve(fqdn, "CNAME", lifetime=3)
            return {
                "subdomain": fqdn,
                "type": "CNAME",
                "records": [str(r) for r in answers]
            }
        except Exception:
            return None
    except Exception:
        return None


def run_dns_recon(domain: str, enumerate_subdomains: bool = True) -> dict:
    """
    Realiza enumeração completa de DNS:
    - Registos A, AAAA, MX, NS, TXT, CNAME
    - Enumeração de subdomínios comuns (paralela)
    """
    domain = domain.strip().lower()
    records = {}

    # Resolver os tipos de registo em paralelo
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(resolve_record, domain, rtype): rtype
            for rtype in RECORD_TYPES
        }
        for future in as_completed(futures):
            rtype, result = future.result()
            if result is None:
                return {
                    "status": "error",
                    "message": f"Domínio '{domain}' não encontrado (NXDOMAIN)"
                }
            records[rtype] = result

    # Enumeração de subdomínios
    found_subdomains = []
    if enumerate_subdomains:
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {
                executor.submit(check_subdomain, sub, domain): sub
                for sub in COMMON_SUBDOMAINS
            }
            for future in as_completed(futures):
                result = future.result()
                if result:
                    found_subdomains.append(result)

        # Ordenar por subdomínio
        found_subdomains.sort(key=lambda x: x["subdomain"])

    return {
        "status": "success",
        "domain": domain,
        "timestamp": datetime.now().isoformat(),
        "records": records,
        "subdomains": found_subdomains,
        "stats": {
            "total_records": sum(len(v) for v in records.values()),
            "subdomains_found": len(found_subdomains),
            "subdomains_checked": len(COMMON_SUBDOMAINS),
        }
    }
