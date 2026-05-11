// ─────────────────────────────────────────────────────────────────────────────
// vite.config.js — Configuração do servidor de desenvolvimento Vite
//
// O Vite é a ferramenta de build e servidor de desenvolvimento do frontend.
// Esta configuração tem uma opção crítica para o funcionamento do AuditX:
// o proxy, que resolve o problema de CORS durante o desenvolvimento.
//
// Problema:
//   O browser bloqueia pedidos de "http://localhost:5173" (frontend) para
//   "http://localhost:8000" (backend) por serem origens diferentes, mesmo
//   sendo a mesma máquina (CORS — Cross-Origin Resource Sharing).
//
// Solução:
//   O proxy do Vite interceta todos os pedidos com prefixo "/api/" feitos
//   pelo frontend e reencaminha-os para o backend em localhost:8000.
//   Do ponto de vista do browser, os pedidos vão para a mesma origem
//   (localhost:5173) — o CORS não é ativado.
//
// Nota sobre host: '127.0.0.1':
//   Por omissão, o Vite faz bind em IPv6 (::1) quando se usa 'localhost'.
//   O FastAPI por omissão faz bind em IPv4 (127.0.0.1).
//   Forçar '127.0.0.1' em ambos garante que o proxy consegue ligar ao backend.
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],  // Plugin oficial do React para Vite (suporte a JSX e Fast Refresh)
  server: {
    port: 5173,           // Porta onde o servidor de desenvolvimento escuta
    host: '127.0.0.1',    // Força IPv4 para compatibilidade com o backend FastAPI

    proxy: {
      // Redireciona todos os pedidos que começam com '/api' para o backend
      // Exemplo: GET /api/scanner/scan → GET http://127.0.0.1:8000/api/scanner/scan
      '/api': {
        target:       'http://127.0.0.1:8000',  // Endereço do backend FastAPI
        changeOrigin: true,                      // Altera o header 'Host' para o target
      }
    }
  }
})
