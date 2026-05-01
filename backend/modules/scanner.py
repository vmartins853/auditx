import subprocess
import re
from datetime import datetime

def run_nmap_scan(target: str, ports: str = "1-1000", flags: list = []) -> dict:
    """
    Executa um scan Nmap contra o alvo e devolve os resultados estruturados.
    Requer Nmap instalado no sistema (padrão no Kali Linux).
    """
    cmd = ["nmap", f"-p{ports}", "--open"] + flags + [target]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        raw_output = result.stdout
        parsed = parse_nmap_output(raw_output)

        return {
            "status": "success",
            "target": target,
            "timestamp": datetime.now().isoformat(),
            "command": " ".join(cmd),
            "raw": raw_output,
            "parsed": parsed
        }

    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Timeout — scan demorou demasiado"}
    except FileNotFoundError:
        return {"status": "error", "message": "Nmap não encontrado. Instala com: apt install nmap"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def parse_nmap_output(output: str) -> list:
    """Extrai portas abertas do output do Nmap."""
    ports = []
    pattern = re.compile(r"(\d+)/(tcp|udp)\s+open\s+(\S+)(?:\s+(.*))?")

    for line in output.splitlines():
        match = pattern.search(line)
        if match:
            ports.append({
                "port":     int(match.group(1)),
                "protocol": match.group(2),
                "state":    "open",
                "service":  match.group(3),
                "version":  match.group(4).strip() if match.group(4) else ""
            })
    return ports
