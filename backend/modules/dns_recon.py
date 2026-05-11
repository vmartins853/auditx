# ─────────────────────────────────────────────────────────────────────────────
# modules/dns_recon.py — Módulo de Reconhecimento DNS
#
# Este módulo realiza enumeração completa de registos DNS (Domain Name System —
# sistema que traduz nomes de domínio em endereços IP e armazena configurações
# de rede) de um domínio alvo, usando a biblioteca dnspython.
#
# Funcionalidades:
#   1. Resolução paralela de todos os tipos de registo DNS relevantes
#      (A, AAAA, MX, NS, TXT, CNAME)
#   2. Enumeração paralela de subdomínios comuns (ex: www, mail, api, admin)
#
# O paralelismo é implementado com ThreadPoolExecutor, o que permite executar
# múltiplas consultas DNS em simultâneo em vez de sequencialmente, reduzindo
# significativamente o tempo total de enumeração.
# ─────────────────────────────────────────────────────────────────────────────

import dns.resolver  # Biblioteca dnspython — consultas DNS programáticas em Python
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
# ThreadPoolExecutor — gere um conjunto de threads para execução paralela
# as_completed — iterador que devolve os resultados à medida que cada thread termina


# Tipos de registo DNS a consultar em cada domínio
# A     — Endereço IPv4 do domínio
# AAAA  — Endereço IPv6 do domínio
# MX    — Servidores de correio eletrónico (Mail eXchanger)
# NS    — Servidores de nomes DNS (Name Server)
# TXT   — Registos de texto (usados para SPF, DKIM, DMARC, verificações de domínio)
# CNAME — Alias de domínio (Canonical Name — aponta para outro nome de domínio)
RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]

# Lista de prefixos de subdomínios comuns para tentar durante a enumeração
# Esta lista cobre os subdomínios mais frequentemente encontrados em infraestruturas web
COMMON_SUBDOMAINS = [
    "www", "mail", "ftp", "admin", "api", "dev", "staging", "test",
    "blog", "shop", "app", "portal", "vpn", "remote", "webmail",
    "smtp", "pop", "imap", "ns1", "ns2", "cdn", "static", "assets",
    "m", "mobile", "secure", "login", "support", "help", "docs",
]


def resolve_record(domain: str, rtype: str) -> tuple[str, list]:
    """
    Resolve um tipo específico de registo DNS para um domínio.

    Parâmetros:
        domain (str): Nome de domínio a consultar (ex: "google.com")
        rtype  (str): Tipo de registo DNS a resolver (ex: "A", "MX", "TXT")

    Devolve:
        tuple: Par (tipo_de_registo, lista_de_valores)
               - Se o registo não existir, devolve lista vazia
               - Se o domínio não existir (NXDOMAIN), devolve None como lista
    """
    try:
        # lifetime=5 define o timeout máximo de 5 segundos por consulta DNS
        answers = dns.resolver.resolve(domain, rtype, lifetime=5)
        # Converte os objetos de resposta DNS para strings legíveis
        return rtype, [str(r) for r in answers]

    except dns.resolver.NoAnswer:
        # O servidor DNS respondeu mas não tem registo deste tipo para este domínio
        return rtype, []

    except dns.resolver.NXDOMAIN:
        # Non-Existent Domain — o domínio não existe no DNS
        # Devolver None sinaliza ao chamador que deve abortar (domínio inválido)
        return rtype, None

    except Exception:
        # Timeout, falha de rede, ou outro erro — ignora e devolve lista vazia
        return rtype, []


def check_subdomain(subdomain: str, domain: str) -> dict | None:
    """
    Verifica se um subdomínio existe tentando resolver o seu registo A ou CNAME.

    A estratégia é:
      1. Tentar resolver o registo A (endereço IPv4) do subdomínio
      2. Se não existir registo A, tentar resolver o CNAME (alias para outro domínio)
      3. Se nenhum existir, o subdomínio não está ativo

    Parâmetros:
        subdomain (str): Prefixo do subdomínio (ex: "www", "mail")
        domain    (str): Domínio base (ex: "google.com")

    Devolve:
        dict | None: Dicionário com os dados do subdomínio se existir, None caso contrário
    """
    # Constrói o nome de domínio completo (FQDN — Fully Qualified Domain Name)
    fqdn = f"{subdomain}.{domain}"

    try:
        # Tenta primeiro o registo A (o mais comum)
        answers = dns.resolver.resolve(fqdn, "A", lifetime=3)
        return {
            "subdomain": fqdn,
            "type":      "A",
            "records":   [str(r) for r in answers]
        }

    except dns.resolver.NXDOMAIN:
        # O subdomínio não existe — não vale a pena tentar CNAME
        return None

    except dns.resolver.NoAnswer:
        # Não há registo A — tenta CNAME como alternativa
        try:
            answers = dns.resolver.resolve(fqdn, "CNAME", lifetime=3)
            return {
                "subdomain": fqdn,
                "type":      "CNAME",
                "records":   [str(r) for r in answers]
            }
        except Exception:
            # Nem A nem CNAME — subdomínio não existe ou não responde
            return None

    except Exception:
        # Timeout ou outro erro de rede — considera o subdomínio inativo
        return None


def run_dns_recon(domain: str, enumerate_subdomains: bool = True) -> dict:
    """
    Realiza enumeração completa de DNS para um domínio alvo.

    O processo tem duas fases:
      1. Resolução paralela dos tipos de registo DNS principais
         (A, AAAA, MX, NS, TXT, CNAME) — executada com 6 threads em simultâneo
      2. Enumeração paralela dos subdomínios comuns
         (verificados na lista COMMON_SUBDOMAINS) — executada com 20 threads

    O paralelismo reduz o tempo de enumeração de vários minutos para segundos,
    pois as consultas DNS são independentes entre si e aguardam respostas de rede.

    Parâmetros:
        domain              (str):  Domínio alvo (ex: "google.com")
        enumerate_subdomains (bool): Se True, tenta os subdomínios da lista COMMON_SUBDOMAINS

    Devolve:
        dict: Dicionário com registos DNS, subdomínios encontrados e estatísticas
    """
    # Normaliza o domínio — remove espaços e converte para minúsculas
    domain = domain.strip().lower()
    records = {}

    # ── Fase 1: Resolução paralela dos tipos de registo principais ────────────
    # max_workers=6 corresponde ao número de tipos de registo (RECORD_TYPES)
    # Cada thread resolve um tipo de registo em paralelo com os outros
    with ThreadPoolExecutor(max_workers=6) as executor:
        # Submete uma tarefa por tipo de registo
        futures = {
            executor.submit(resolve_record, domain, rtype): rtype
            for rtype in RECORD_TYPES
        }
        # Processa os resultados à medida que cada consulta termina
        for future in as_completed(futures):
            rtype, result = future.result()
            if result is None:
                # NXDOMAIN — o domínio não existe; interrompe imediatamente
                return {
                    "status":  "error",
                    "message": f"Domínio '{domain}' não encontrado (NXDOMAIN)"
                }
            records[rtype] = result

    # ── Fase 2: Enumeração paralela de subdomínios ────────────────────────────
    found_subdomains = []
    if enumerate_subdomains:
        # max_workers=20 permite verificar 20 subdomínios em paralelo
        # Um valor alto é seguro aqui porque as operações são I/O-bound (aguardam rede)
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = {
                executor.submit(check_subdomain, sub, domain): sub
                for sub in COMMON_SUBDOMAINS
            }
            for future in as_completed(futures):
                result = future.result()
                if result:
                    # Subdomínio ativo — adiciona à lista de resultados
                    found_subdomains.append(result)

        # Ordena os subdomínios encontrados por nome para apresentação consistente
        found_subdomains.sort(key=lambda x: x["subdomain"])

    return {
        "status":     "success",
        "domain":     domain,
        "timestamp":  datetime.now().isoformat(),
        "records":    records,          # Dicionário com todos os registos por tipo
        "subdomains": found_subdomains, # Lista de subdomínios ativos encontrados
        "stats": {
            "total_records":      sum(len(v) for v in records.values()),  # Total de registos encontrados
            "subdomains_found":   len(found_subdomains),                  # Subdomínios ativos encontrados
            "subdomains_checked": len(COMMON_SUBDOMAINS),                 # Total de subdomínios verificados
        }
    }
