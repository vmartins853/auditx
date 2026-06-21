# ─────────────────────────────────────────────────────────────────────────────
# modules/ai_analyzer.py — Módulo de Análise por Inteligência Artificial
#
# Este módulo integra a API Gemini da Google para analisar outputs de
# ferramentas de segurança. Recebe texto bruto produzido por ferramentas como
# o Nmap, Gobuster ou Hydra, constrói um prompt em PT-PT com instruções
# específicas para análise de segurança, envia o pedido à API, e processa
# a resposta JSON devolvida pelo modelo.
#
# A chave da API é carregada do ficheiro .env para garantir que nunca é
# exposta no repositório ou no browser do utilizador.
#
# Modelo usado: gemini-2.5-flash (modelo rápido e eficiente da Google)
# ─────────────────────────────────────────────────────────────────────────────

import os    # Acesso a variáveis de ambiente do sistema operativo
import json  # Parsing (interpretação) de JSON devolvido pela API
import google.generativeai as genai  # Biblioteca oficial da Google para a API Gemini
from dotenv import load_dotenv       # Carrega variáveis do ficheiro .env para o ambiente

# Carrega as variáveis definidas no ficheiro .env para os.environ
# O ficheiro .env contém a chave da API Gemini e não está no repositório (.gitignore)
load_dotenv()

# Lê a chave da API a partir da variável de ambiente GEMINI_API_KEY
# Esta chave é configurada no ficheiro .env (ex: GEMINI_API_KEY=AIzaSy...)
api_key = os.getenv("GEMINI_API_KEY")

# response_mime_type="application/json" instrui o modelo a devolver JSON puro
# (sem markdown), tornando o parsing fiável.
_GENERATION_CONFIG = {"response_mime_type": "application/json"}

# Esta ferramenta analisa output de segurança ofensiva (legítimo, em ambiente
# autorizado). Sem baixar os filtros, o Gemini recusa frequentemente este tipo
# de conteúdo ("vetores de ataque"), fazendo a análise falhar.
_SAFETY_SETTINGS = {
    "HARM_CATEGORY_HARASSMENT":        "BLOCK_NONE",
    "HARM_CATEGORY_HATE_SPEECH":       "BLOCK_NONE",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
}

# O modelo é instanciado de forma LAZY (só no primeiro pedido). Assim, a ausência
# da chave NÃO impede o backend de arrancar — apenas a aba AI Analyzer fica
# indisponível, com um erro claro (o Scanner, DNS e Reports continuam a funcionar).
_model = None


def _get_model():
    """Configura e instancia o modelo Gemini na primeira utilização (cache em _model)."""
    global _model
    if _model is None:
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config=_GENERATION_CONFIG,
            safety_settings=_SAFETY_SETTINGS,
        )
    return _model


async def analyze_with_ai(tool: str, output: str) -> dict:
    """
    Envia o output de uma ferramenta de segurança para análise pela API Gemini.

    O prompt instrui o modelo a agir como especialista em cibersegurança e a
    responder exclusivamente em JSON estruturado com quatro campos:
      - resumo: descrição do que foi encontrado
      - riscos: lista de vulnerabilidades identificadas com título, severidade e descrição
      - recomendacoes: lista de ações corretivas sugeridas
      - proximos_passos: comandos ou vetores de ataque a explorar a seguir

    Parâmetros:
        tool   (str): Nome da ferramenta cujo output está a ser analisado
                      (ex: "nmap", "gobuster", "hydra")
        output (str): Output bruto da ferramenta, tal como apareceria no terminal

    Devolve:
        dict: Dicionário com o estado da análise e os dados estruturados devolvidos pela IA
    """

    # Sem chave configurada → não rebenta o arranque; devolve erro apenas nesta aba
    if not api_key:
        return {
            "status":  "error",
            "message": "GEMINI_API_KEY não definida. Preenche backend/.env com a tua chave Gemini.",
        }

    # ── Construção do prompt ──────────────────────────────────────────────────
    # O prompt define o papel do modelo (especialista em cibersegurança),
    # fornece o contexto (nome da ferramenta e output), e especifica o formato
    # exato da resposta esperada (JSON com campos predefinidos).
    #
    # A instrução "Responde APENAS com o JSON" é crítica para evitar que o modelo
    # adicione texto introdutório ou blocos de código markdown à resposta,
    # o que dificultaria o parsing JSON subsequente.
    prompt = f"""
És um especialista em cibersegurança ofensiva. Analisa o seguinte output da ferramenta '{tool}':

---
{output}
---

Responde em português (PT-PT) com a seguinte estrutura JSON:
{{
  "resumo": "resumo do que foi encontrado",
  "riscos": [
    {{ "titulo": "...", "severidade": "Alta/Média/Baixa", "descricao": "..." }}
  ],
  "recomendacoes": ["..."],
  "proximos_passos": ["comandos ou vetores de ataque sugeridos"]
}}

Responde APENAS com o JSON, sem markdown, sem ```json, sem texto extra.
"""

    try:
        # Envia o prompt ao modelo Gemini e aguarda a resposta.
        # generate_content_async é não-bloqueante — usar a versão síncrona aqui
        # bloquearia o event loop do FastAPI durante toda a chamada de rede.
        response = await _get_model().generate_content_async(prompt)

        # Extrai o texto da resposta e remove espaços em branco desnecessários
        text = response.text.strip()

        # ── Limpeza defensiva de markdown ─────────────────────────────────────
        # Mesmo com a instrução explícita, o modelo por vezes envolve a resposta
        # em blocos de código markdown (```json ... ```).
        # Este bloco remove esses marcadores caso existam.
        if text.startswith("```"):
            text = text.split("```")[1]  # Remove o bloco de abertura
            if text.startswith("json"):
                text = text[4:]          # Remove o indicador de linguagem "json"
            text = text.strip()

        # Converte o JSON em string para um dicionário Python
        data = json.loads(text)

        return {"status": "success", "analysis": data}

    except json.JSONDecodeError as e:
        # O modelo não devolveu JSON válido — devolve o texto bruto para diagnóstico
        return {
            "status":  "error",
            "message": f"Erro ao processar resposta da IA: {str(e)}",
            "raw":     response.text if 'response' in dir() else ""
        }

    except Exception as e:
        msg = str(e)

        # Verificação específica para erros de quota da API Gemini
        # O código 429 (Too Many Requests) indica que o limite de pedidos foi atingido
        if '429' in msg or 'quota' in msg.lower():
            return {
                "status":  "error",
                "message": "Limite da API Gemini atingido. Aguarda alguns minutos e tenta novamente."
            }

        # Qualquer outro erro (rede, autenticação, etc.) — devolve mensagem descritiva
        return {
            "status":  "error",
            "message": msg
        }
