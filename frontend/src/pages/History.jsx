import { useState } from 'react'
import { History as HistoryIcon, Trash2, ChevronDown, ChevronUp, Scan, Globe, ShieldCheck, Lock, Brain } from 'lucide-react'
import { getHistory, removeHistoryEntry, clearHistory } from '../services/history'

// Metadados de apresentação por tipo de entrada
const TYPE_META = {
  scanner: { label: 'Port Scanner',    icon: Scan,        color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  dns:     { label: 'DNS Recon',       icon: Globe,       color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  headers: { label: 'Security Headers', icon: ShieldCheck, color: 'text-cyan-400',   bg: 'bg-cyan-400/10 border-cyan-400/20' },
  tls:     { label: 'TLS Inspector',   icon: Lock,        color: 'text-teal-400',   bg: 'bg-teal-400/10 border-teal-400/20' },
  ai:      { label: 'AI Analyzer',     icon: Brain,       color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
}

export default function History() {
  const [entries, setEntries] = useState(() => getHistory())
  const [expanded, setExpanded] = useState(null)

  function remove(id) {
    removeHistoryEntry(id)
    setEntries(getHistory())
  }

  function clearAll() {
    clearHistory()
    setEntries([])
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <HistoryIcon className="text-primary w-6 h-6" />
            <h1 className="text-2xl font-mono font-bold text-white">
              Histórico
            </h1>
          </div>
          <p className="text-slate-400 font-mono text-sm">
            Execuções guardadas localmente (persistem entre sessões). Máx. 50 entradas.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border border-dark-700
                       text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar tudo
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="terminal p-10 text-center">
          <HistoryIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="font-mono text-sm text-slate-500">Ainda não há execuções guardadas.</p>
          <p className="font-mono text-xs text-slate-600 mt-1">
            Corre um módulo (Scanner, DNS, Headers, TLS ou AI) e o resultado aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => {
            const meta = TYPE_META[e.type] || TYPE_META.scanner
            const Icon = meta.icon
            const open = expanded === e.id
            return (
              <div key={e.id} className={`terminal overflow-hidden border ${meta.bg}`}>
                <div className="flex items-center gap-3 p-4">
                  <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      <span className="font-mono text-sm text-white truncate">{e.target}</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                      {e.summary} · {new Date(e.timestamp).toLocaleString('pt-PT')}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(open ? null : e.id)}
                    className="text-slate-500 hover:text-white transition-colors shrink-0"
                    title="Ver dados"
                  >
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {open && (
                  <pre className="px-4 pb-4 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap border-t border-dark-700 pt-3">
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
