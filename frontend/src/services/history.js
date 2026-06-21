// ─────────────────────────────────────────────────────────────────────────────
// services/history.js — Histórico persistente de execuções dos módulos
//
// Ao contrário do useTemporaryStorage (sessionStorage, expira em 30 min), o
// histórico usa localStorage, por isso persiste entre sessões/reinícios do
// browser. Cada módulo chama addHistoryEntry() quando produz um resultado.
//
// Guarda no máximo MAX entradas (as mais recentes), para não encher o
// localStorage (limite ~5 MB).
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'auditx_history'
const MAX = 50

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// entry: { type, target, summary, data }
export function addHistoryEntry(entry) {
  try {
    const list = getHistory()
    const item = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    }
    list.unshift(item)                                  // mais recente primeiro
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
    return item
  } catch {
    return null  // localStorage indisponível/cheio — falha silenciosamente
  }
}

export function removeHistoryEntry(id) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getHistory().filter(e => e.id !== id)))
  } catch { /* ignora */ }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch { /* ignora */ }
}
