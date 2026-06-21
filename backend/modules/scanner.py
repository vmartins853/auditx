# ─────────────────────────────────────────────────────────────────────────────
# modules/scanner.py — Módulo de Port Scanning via Nmap
#
# Este módulo é responsável por invocar o Nmap (Network Mapper — ferramenta
# de análise de redes e descoberta de serviços) através do subprocess do Python,
# capturar o output produzido, e transformá-lo numa estrutura de dados
# organizada que o frontend consegue renderizar.
#
# O Nmap é executado como um processo externo do sistema operativo. O módulo
# não implementa nenhuma lógica de scanning — delega completamente essa
# responsabilidade ao Nmap instalado no Kali Linux.
# ─────────────────────────────────────────────────────────────────────────────

import subprocess   # Permite executar processos do sistema operativo a partir do Python
import re           # Expressões regulares — usadas para extrair dados do output do Nmap
from datetime import datetime  # Para registar o timestamp do scan


# Padrões aceites para validação server-side (não confiar só no frontend)
_IPV4_RE   = re.compile(r"^(\d{1,3}\.){3}\d{1,3}(/\d{1,2})?$")  # IPv4 com CIDR opcional (ex.: 192.168.1.0/24)
_IPV6_RE   = re.compile(r"^[0-9a-fA-F:]+(/\d{1,3})?$")          # IPv6 simplificado (tem de conter ':')
_DOMAIN_RE = re.compile(r"^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$")
_PORTS_RE  = re.compile(r"^[0-9,\-]+$")  # só dígitos, vírgulas e hífens (ex.: "-", "1-1000", "80,443")


def is_valid_target(target: str) -> bool:
    """
    Valida o alvo no backend para impedir 'argument injection' (ex.: um target
    a começar por '-' seria interpretado pelo Nmap como uma opção, não um alvo).
    Aceita: localhost, IPv4 (com CIDR opcional), IPv6, ou um nome de domínio.
    """
    target = target.strip()
    if not target or target.startswith("-"):
        return False
    if target == "localhost":
        return True
    if _IPV4_RE.match(target):
        ip = target.split("/")[0]
        if not all(0 <= int(octeto) <= 255 for octeto in ip.split(".")):
            return False
        if "/" in target and not (0 <= int(target.split("/")[1]) <= 32):
            return False
        return True
    if ":" in target and _IPV6_RE.match(target):
        return True
    return bool(_DOMAIN_RE.match(target))


def run_nmap_scan(target: str, ports: str = "1-1000", flags: list = []) -> dict:
    """
    Executa um scan Nmap contra o alvo e devolve os resultados estruturados.
    Requer Nmap instalado no sistema (instalado por omissão no Kali Linux).

    Parâmetros:
        target (str): Endereço IP ou domínio alvo do scan (ex: "192.168.1.1")
        ports  (str): Range de portas a analisar (ex: "1-1000" ou "80,443,8080")
        flags  (list): Lista de flags Nmap adicionais (ex: ["-sV", "-T4"])

    Devolve:
        dict: Dicionário com o estado, o alvo, o timestamp, o comando executado,
              o output bruto do Nmap, e a lista de portas abertas estruturada.
    """

    # Validação server-side: nunca confiar apenas na validação do frontend
    if not is_valid_target(target):
        return {"status": "error", "message": "Alvo inválido (deve ser um IPv4 ou domínio, sem começar por '-')."}
    if not _PORTS_RE.match(ports):
        return {"status": "error", "message": "Especificação de portas inválida (usa dígitos, vírgulas e hífens, ex.: 1-1000 ou 80,443)."}

    # Construção do comando Nmap a executar
    # "--open" instrui o Nmap a mostrar apenas as portas em estado "open"
    # As flags adicionais são inseridas entre as opções base e o alvo
    cmd = ["nmap", f"-p{ports}", "--open"] + flags + [target]

    try:
        # subprocess.run executa o comando como se fosse escrito no terminal
        # capture_output=True redireciona stdout e stderr para variáveis Python
        # text=True devolve o output como string em vez de bytes
        # timeout=300 cancela o processo após 5 minutos se não terminar
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )

        # Output bruto produzido pelo Nmap (texto igual ao que apareceria no terminal)
        raw_output = result.stdout

        # Se o Nmap saiu com erro, NÃO podemos ignorar o stderr (caso contrário um
        # erro — alvo em baixo, flag inválida, falta de privilégios — apareceria
        # como "0 portas abertas"). Devolvemos a causa real ao utilizador.
        if result.returncode != 0:
            erro = (result.stderr or raw_output).strip() or "Nmap terminou com erro."
            # Pista útil: vários tipos de scan (-sS, -sU, -O) exigem privilégios de root
            if "requires root" in erro.lower() or "QUITTING" in erro:
                erro += "\n(Sugestão: scans como -sS, -sU e -O exigem privilégios de root.)"
            return {"status": "error", "message": erro, "command": " ".join(cmd)}

        # Transforma o output bruto numa lista de dicionários estruturados
        parsed = parse_nmap_output(raw_output)

        return {
            "status":    "success",
            "target":    target,
            "timestamp": datetime.now().isoformat(),  # Data e hora do scan em formato ISO 8601
            "command":   " ".join(cmd),               # Comando exato que foi executado
            "raw":       raw_output,                  # Output bruto do Nmap (para o painel colapsável)
            "parsed":    parsed                       # Lista de portas abertas estruturada
        }

    except subprocess.TimeoutExpired:
        # O scan ultrapassou o limite de 5 minutos — devolve erro descritivo
        return {"status": "error", "message": "Timeout — scan demorou demasiado"}

    except FileNotFoundError:
        # O Nmap não está instalado no sistema — indica como instalar
        return {"status": "error", "message": "Nmap não encontrado. Instala com: apt install nmap"}

    except Exception as e:
        # Qualquer outro erro inesperado — devolve a mensagem de erro original
        return {"status": "error", "message": str(e)}


def parse_nmap_output(output: str) -> list:
    """
    Extrai as portas abertas do output de texto produzido pelo Nmap.

    O Nmap produz linhas no formato:
        PORT      STATE  SERVICE  VERSION
        80/tcp    open   http     Apache httpd 2.4.41

    Esta função usa uma expressão regular para identificar e extrair
    essas linhas, transformando cada uma num dicionário com os campos
    separados.

    Parâmetros:
        output (str): Output bruto do Nmap em formato texto

    Devolve:
        list: Lista de dicionários, um por porta aberta encontrada
    """

    ports = []

    # Expressão regular que captura as linhas de portas abertas do Nmap
    # Grupo 1: número da porta (ex: "80")
    # Grupo 2: protocolo (ex: "tcp" ou "udp")
    # Grupo 3: nome do serviço (ex: "http")
    # Grupo 4: versão do serviço, opcional (ex: "Apache httpd 2.4.41")
    # O estado pode ser "open" (TCP) ou "open|filtered" (típico em UDP) — aceitamos ambos
    pattern = re.compile(r"(\d+)/(tcp|udp)\s+(open(?:\|filtered)?)\s+(\S+)(?:\s+(.*))?")

    for line in output.splitlines():
        match = pattern.search(line)
        if match:
            ports.append({
                "port":     int(match.group(1)),                              # Número da porta como inteiro
                "protocol": match.group(2),                                   # Protocolo: "tcp" ou "udp"
                "state":    match.group(3),                                   # Estado: "open" ou "open|filtered"
                "service":  match.group(4),                                   # Nome do serviço (ex: "http", "ssh")
                "version":  match.group(5).strip() if match.group(5) else ""  # Versão do serviço, ou string vazia
            })

    return ports
