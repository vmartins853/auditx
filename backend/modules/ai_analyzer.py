import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

async def analyze_with_ai(tool: str, output: str) -> dict:
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
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Remove marcadores markdown caso existam
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        data = json.loads(text)
        return {"status": "success", "analysis": data}
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "message": f"Erro ao processar resposta da IA: {str(e)}",
            "raw": response.text if 'response' in dir() else ""
        }
    except Exception as e:
        msg = str(e)
        if '429' in msg or 'quota' in msg.lower():
            return {
                "status": "error",
                "message": "Limite da API Gemini atingido. Aguarda alguns minutos e tenta novamente."
            }
        return {
            "status": "error",
            "message": msg
        }
