import { useState } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { ShieldCheck, Play, AlertTriangle, Loader2, Check, X, Info } from 'lucide-react'
import { checkHeaders } from '../services/api'
import { addHistoryEntry } from '../services/history'

const SEVERITY_COLOR = {
  'Alta':  'text-red-400 bg-red-400/10 border-red-400/20',
  'Média': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Baixa': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

const GRADE_COLOR = {
  A: 'text-green-400 border-green-400/30 bg-green-400/10',
  B: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  C: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  D: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  F: 'text-red-400 border-red-400/30 bg-red-400/10',
}

const EXAMPLES = ['https://github.com', 'https://example.com', 'http://localhost:5173']

export default function Headers() {
  const [url, setUrl]       = useTemporaryStorage('headers_url', '')
  const [result, setResult] = useTemporaryStorage('headers_result', null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleCheck() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await checkHeaders(url.trim())
      if (res.data.status === 'error') setError(res.data.message)
      else {
        setResult(res.data)
        addHistoryEntry({ type: 'headers', target: url.trim(), summary: `Nota ${res.data.grade} (${res.data.present}/${res.data.total})`, data: res.data })
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro de ligação ao backend. Verifica se o servidor está a correr em localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="text-cyan-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            Security <span className="text-cyan-400">Headers</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Avalia os cabeçalhos de segurança HTTP de um site e atribui uma classificação A–F.
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">URL ALVO</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="https://exemplo.com"
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 font-mono text-sm text-white
                         placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1
                         focus:ring-cyan-400/20 transition-all"
            />
            <button
              onClick={handleCheck}
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 border border-cyan-400/30 rounded-lg
                         font-mono text-sm font-semibold text-cyan-400 hover:bg-cyan-500/30 hover:border-cyan-400/50
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A verificar...</>
                : <><Play className="w-4 h-4" /> Verificar</>}
            </button>
          </div>
        </div>

        {/* Exemplos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-600">Exemplos:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setUrl(ex)}
              className="text-xs font-mono px-2.5 py-1 rounded border border-dark-700 text-slate-500
                         hover:border-cyan-400/30 hover:text-cyan-400 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5 mb-6">
          <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-sm text-red-400 font-semibold">Erro</p>
            <p className="font-mono text-xs text-slate-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="space-y-5">
          {/* Sumário com nota */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`terminal p-4 flex flex-col items-center justify-center border ${GRADE_COLOR[result.grade] || GRADE_COLOR.F}`}>
              <div className="text-4xl font-mono font-bold">{result.grade}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Classificação</div>
            </div>
            <div className="terminal p-4 text-center">
              <div className="text-2xl font-mono font-bold text-cyan-400">{result.present}/{result.total}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Cabeçalhos presentes</div>
            </div>
            <div className="terminal p-4 text-center">
              <div className="text-2xl font-mono font-bold text-white">{result.status_code}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Código HTTP</div>
            </div>
          </div>

          {result.final_url !== result.url && (
            <p className="text-xs font-mono text-slate-500">
              Redirecionado para <span className="text-cyan-400">{result.final_url}</span>
            </p>
          )}

          {/* Tabela de cabeçalhos */}
          <div className="terminal overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-dark-700">
              <ShieldCheck className="text-cyan-400 w-4 h-4" />
              <span className="font-mono text-sm text-white font-semibold">Cabeçalhos de Segurança</span>
            </div>
            <div className="divide-y divide-dark-700/50">
              {result.checked.map((c, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.present
                      ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                      : <X className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className="font-mono text-sm text-white">{c.header}</span>
                    {!c.present && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ml-auto ${SEVERITY_COLOR[c.severity]}`}>
                        {c.severity}
                      </span>
                    )}
                  </div>
                  {c.present
                    ? <p className="font-mono text-xs text-slate-500 mt-1 ml-7 break-all">{c.value}</p>
                    : <p className="font-mono text-xs text-slate-500 mt-1 ml-7">→ {c.recommendation}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Fugas de informação */}
          {result.info_leaks.length > 0 && (
            <div className="terminal overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-dark-700">
                <Info className="text-yellow-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">Fugas de Informação</span>
                <span className="text-xs font-mono text-slate-500">(cabeçalhos que expõem o stack)</span>
              </div>
              <div className="divide-y divide-dark-700/50">
                {result.info_leaks.map((l, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="font-mono text-xs text-yellow-400">{l.header}</span>
                    <span className="font-mono text-xs text-slate-400 break-all">{l.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-mono text-slate-600 text-right">
            Verificação efetuada em {new Date(result.timestamp).toLocaleString('pt-PT')}
          </p>
        </div>
      )}
    </div>
  )
}
