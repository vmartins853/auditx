# AuditX 🛡️

**Plataforma Modular de Testes de Segurança e Auditoria**

AuditX é uma aplicação web full-stack que integra ferramentas de pentesting com análise por Inteligência Artificial, desenvolvida no âmbito do projeto académico PIEI-22 (IPLuso, 2025–2026).

---

## 🧩 Módulos

| Módulo | Descrição |
|---|---|
| Port Scanner | Executa Nmap e apresenta resultados estruturados |
| DNS Recon | Enumeração de registos DNS e subdomínios |
| Command Builder | Construtor assistido de comandos para Nmap, Hydra, Gobuster |
| AI Analyzer | Análise de outputs com Gemini API |
| Reports | Geração de relatórios PDF de auditoria |

---

## 🛠️ Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python + FastAPI
- **IA**: Google Gemini API
- **Ferramentas**: Nmap, dnspython
- **Relatórios**: WeasyPrint

---

## 🚀 Instalação

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # preencher com a chave Gemini
uvicorn main:app --reload
```

---

## ⚠️ Aviso Legal

Esta ferramenta destina-se exclusivamente a fins educativos e a testes em ambientes autorizados.
