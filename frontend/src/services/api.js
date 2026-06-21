// ─────────────────────────────────────────────────────────────────────────────
// services/api.js — Camada de comunicação com o backend
//
// Este ficheiro centraliza todas as chamadas HTTP ao backend FastAPI.
// Usar um ficheiro dedicado para as chamadas à API (em vez de fazer fetch()
// diretamente nos componentes) tem várias vantagens:
//   - Mudanças de URL ou de configuração acontecem num único sítio
//   - Os componentes ficam desacoplados da lógica de rede
//   - É mais fácil adicionar headers de autenticação no futuro
//
// O Axios é a biblioteca usada para os pedidos HTTP. A base URL é '/api',
// que o proxy do Vite redireciona para http://127.0.0.1:8000/api.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'

// ── Instância base do Axios ───────────────────────────────────────────────────
// Esta instância é usada pela maioria das funções abaixo.
// Configurações partilhadas:
//   baseURL: '/api' — prefixo aplicado a todos os URLs relativos
//   timeout: 60000 — timeout de 60 segundos (1 minuto) por omissão
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// ── runScan ───────────────────────────────────────────────────────────────────
// Envia um pedido POST para iniciar um scan Nmap.
//
// Nota: Esta função usa o axios global em vez da instância 'api' acima,
// para poder definir um timeout específico de 300 segundos (5 minutos).
// Um scan Nmap completo pode demorar vários minutos dependendo do alvo e
// das flags — o timeout de 60 segundos da instância base seria insuficiente.
//
// Parâmetros:
//   target  (string): Endereço IP ou domínio alvo (ex: "192.168.1.1")
//   options (object): Objeto com campos opcionais: { ports, flags }
//
// Devolve: Promise com a resposta Axios (res.data contém os resultados)
export const runScan = (target, options = {}) =>
  axios.post('/api/scanner/scan', { target, ...options }, {
    timeout: 300000,  // 5 minutos — necessário para scans Nmap demorados
    headers: { 'Content-Type': 'application/json' },
  })

// ── runDNSRecon ───────────────────────────────────────────────────────────────
// Envia um pedido POST para iniciar a enumeração DNS de um domínio.
//
// Parâmetros:
//   domain              (string):  Domínio a analisar (ex: "google.com")
//   enumerate_subdomains (boolean): Se true, tenta os subdomínios da lista predefinida
//
// Devolve: Promise com a resposta Axios (res.data contém registos e subdomínios)
export const runDNSRecon = (domain, enumerate_subdomains = true) =>
  api.post('/dns/recon', { domain, enumerate_subdomains })

// ── analyzeOutput ─────────────────────────────────────────────────────────────
// Envia o output de uma ferramenta para análise pela API Gemini no backend.
//
// Parâmetros:
//   tool   (string): Nome da ferramenta (ex: "nmap", "gobuster", "hydra")
//   output (string): Output bruto da ferramenta, tal como apareceria no terminal
//
// Devolve: Promise com a resposta Axios (res.data.analysis contém a análise de IA)
export const analyzeOutput = (tool, output) =>
  api.post('/ai/analyze', { tool, output })

// ── generateReport ────────────────────────────────────────────────────────────
// Envia os dados dos módulos para geração de um relatório PDF no backend.
//
// Nota: responseType: 'blob' é essencial para receber o ficheiro PDF como
// dados binários. Sem esta opção, o Axios tentaria interpretar o PDF como
// texto JSON e o ficheiro ficaria corrompido.
//
// Parâmetros:
//   data (object): Objeto com os dados do relatório:
//     { alvo, auditor, data, descricao, scanner, dns, ai_analysis }
//
// Devolve: Promise com a resposta Axios (res.data é um Blob com o PDF binário)
export const generateReport = (data) =>
  api.post('/reports/generate', data, { responseType: 'blob' })

// ── checkHeaders ──────────────────────────────────────────────────────────────
// Avalia os cabeçalhos de segurança HTTP de um URL.
//
// Parâmetros:
//   url (string): URL alvo (tem de começar por http:// ou https://)
//
// Devolve: Promise com a resposta Axios (res.data contém a avaliação e a nota)
export const checkHeaders = (url) =>
  api.post('/headers/check', { url })

// Exportação da instância base para uso direto nos componentes se necessário
export default api
