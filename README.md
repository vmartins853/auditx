# AuditX 🛡️

**Plataforma Modular de Testes de Segurança e Auditoria**

AuditX é uma aplicação web full-stack que integra ferramentas de pentesting com análise por Inteligência Artificial, desenvolvida no âmbito do projeto académico PIEI-22 (IPLuso, 2025–2026).

Versão atual: **v0.1.2**

---

## 🧩 Módulos

| Módulo | Descrição |
|---|---|
| Port Scanner | Executa Nmap no backend e apresenta as portas abertas com classificação de risco por porta |
| DNS Recon | Enumera registos DNS (A, AAAA, MX, NS, TXT, CNAME) e subdomínios, com análise automática de SPF e DMARC |
| Security Headers | Avalia 7 cabeçalhos de segurança HTTP (HSTS, CSP, X-Frame-Options, …) e atribui uma nota de A a F |
| TLS Inspector | Inspeciona o certificado TLS de um host — emissor, validade, SANs, cipher e estado de confiança |
| Command Builder | Construtor de comandos para 7 ferramentas: Nmap, Gobuster, Hydra, FFuF, Netcat, Hashcat e Reverse Shell |
| AI Analyzer | Análise de outputs de ferramentas com a API Gemini (riscos por severidade, recomendações e próximos passos) |
| Reports | Relatório PDF consolidado dos módulos executados, com escape de HTML anti-injeção |
| Histórico | Registo local das últimas 50 execuções (persiste entre sessões) |

---

## 🛠️ Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + Axios
- **Backend**: Python + FastAPI + Uvicorn (ASGI) + Pydantic
- **Rede / Segurança**: Nmap (via subprocess), dnspython, httpx, ssl + cryptography
- **IA**: Google Gemini API (`gemini-2.5-flash`)
- **Relatórios**: WeasyPrint
- **Ambiente de referência**: Kali Linux

---

## 🚀 Instalação

### Arranque rápido (recomendado)

```bash
./setup.sh        # instala dependências do frontend e backend, cria backend/.env a partir do .env.example
# editar backend/.env com a chave Gemini
./start.sh        # arranca frontend e backend com um único comando
```

- Frontend → http://localhost:5173
- Backend → http://localhost:8000
- API docs (Swagger) → http://localhost:8000/docs

### Manual

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # preencher com a chave Gemini
uvicorn main:app --reload
```

> A chave da API Gemini fica em `backend/.env` (não versionado). Sem chave, o backend arranca à mesma — apenas o módulo AI Analyzer fica indisponível.

---

## ⚠️ Aviso Legal

Esta ferramenta destina-se exclusivamente a fins educativos e a testes em ambientes autorizados.
