import { useState } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { Lock, Play, AlertTriangle, Loader2, Check, X, ShieldAlert } from 'lucide-react'
import { inspectTLS } from '../services/api'

const EXAMPLES = ['github.com', 'expired.badssl.com', 'self-signed.badssl.com']
const WEAK_TLS = ['SSLv3', 'TLSv1', 'TLSv1.1']

// Constrói os alertas a partir do resultado
function buildAlerts(r) {
  const a = []
  if (r.expired)        a.push({ type: 'crit', text: `Certificado EXPIRADO em ${r.valid_until} (há ${Math.abs(r.days_left)} dias)` })
  if (r.not_yet_valid)  a.push({ type: 'crit', text: `Certificado ainda não é válido (válido a partir de ${r.valid_from})` })
  if (!r.trusted && !r.expired) a.push({ type: 'warn', text: `Cadeia não confiável: ${r.trust_error || 'verificação falhou'}` })
  if (r.trusted && !r.expired && r.days_left < 30) a.push({ type: 'warn', text: `Expira em breve — ${r.days_left} dias` })
  if (WEAK_TLS.includes(r.tls_version)) a.push({ type: 'warn', text: `Versão TLS obsoleta: ${r.tls_version}` })
  if (a.length === 0) a.push({ type: 'ok', text: 'Certificado válido, confiável e com validade folgada' })
  return a
}

function Row({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b border-dark-700/50">
      <span className="font-mono text-xs text-slate-500 w-36 shrink-0">{label}</span>
      <span className="font-mono text-xs text-white break-all">{value}</span>
    </div>
  )
}

export default function TLS() {
  const [target, setTarget] = useTemporaryStorage('tls_target', '')
  const [result, setResult] = useTemporaryStorage('tls_result', null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handleInspect() {
    if (!target.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await inspectTLS(target.trim())
      if (res.data.status === 'error') setError(res.data.message)
      else setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro de ligação ao backend. Verifica se o servidor está a correr em localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  const alerts = result ? buildAlerts(result) : []

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Lock className="text-teal-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            TLS <span className="text-teal-400">Inspector</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Inspeciona o certificado TLS de um host — emissor, validade, SANs e estado de confiança.
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">HOST (ou host:porta)</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={target}
              onChange={e => { setTarget(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleInspect()}
              placeholder="exemplo.com"
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 font-mono text-sm text-white
                         placeholder-slate-600 focus:outline-none focus:border-teal-400/50 focus:ring-1
                         focus:ring-teal-400/20 transition-all"
            />
            <button
              onClick={handleInspect}
              disabled={loading || !target.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-teal-500/20 border border-teal-400/30 rounded-lg
                         font-mono text-sm font-semibold text-teal-400 hover:bg-teal-500/30 hover:border-teal-400/50
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A inspecionar...</>
                : <><Play className="w-4 h-4" /> Inspecionar</>}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-600">Exemplos:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setTarget(ex)}
              className="text-xs font-mono px-2.5 py-1 rounded border border-dark-700 text-slate-500
                         hover:border-teal-400/30 hover:text-teal-400 transition-all"
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
          {/* Estado */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`terminal p-4 flex flex-col items-center justify-center border ${
              result.expired || result.not_yet_valid
                ? 'border-red-400/30 bg-red-400/10'
                : result.trusted ? 'border-green-400/30 bg-green-400/10' : 'border-yellow-400/30 bg-yellow-400/10'
            }`}>
              {result.expired || result.not_yet_valid
                ? <X className="w-7 h-7 text-red-400" />
                : result.trusted ? <Check className="w-7 h-7 text-green-400" /> : <ShieldAlert className="w-7 h-7 text-yellow-400" />}
              <div className="text-xs font-mono text-slate-400 mt-2">
                {result.expired ? 'Expirado' : result.trusted ? 'Confiável' : 'Não confiável'}
              </div>
            </div>
            <div className="terminal p-4 text-center">
              <div className={`text-2xl font-mono font-bold ${result.days_left < 0 ? 'text-red-400' : result.days_left < 30 ? 'text-yellow-400' : 'text-teal-400'}`}>
                {result.days_left}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-1">Dias até expirar</div>
            </div>
            <div className="terminal p-4 text-center">
              <div className="text-lg font-mono font-bold text-white">{result.tls_version}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">{result.cipher}</div>
            </div>
          </div>

          {/* Alertas */}
          <div className="terminal p-4 space-y-2">
            {alerts.map((al, i) => (
              <div key={i} className={`flex items-start gap-2.5 text-xs font-mono p-2.5 rounded-lg ${
                al.type === 'ok'   ? 'bg-green-400/5 text-green-400'  :
                al.type === 'warn' ? 'bg-yellow-400/5 text-yellow-400' :
                                     'bg-red-400/5 text-red-400'
              }`}>
                <span className="shrink-0 mt-0.5">{al.type === 'ok' ? '✓' : al.type === 'warn' ? '⚠' : '✘'}</span>
                <span>{al.text}</span>
              </div>
            ))}
          </div>

          {/* Detalhes do certificado */}
          <div className="terminal overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-dark-700">
              <Lock className="text-teal-400 w-4 h-4" />
              <span className="font-mono text-sm text-white font-semibold">Detalhes do Certificado</span>
            </div>
            <Row label="Host" value={`${result.host}:${result.port}`} />
            <Row label="Subject (CN)" value={result.subject_cn} />
            <Row label="Emissor" value={result.issuer_cn || result.issuer_org} />
            <Row label="Válido de" value={result.valid_from} />
            <Row label="Válido até" value={result.valid_until} />
            <Row label="Assinatura" value={result.signature_algorithm} />
            <Row label="Nº de série" value={result.serial} />
            <Row label={`SANs (${result.san_count})`} value={result.san?.join(', ')} />
          </div>

          <p className="text-xs font-mono text-slate-600 text-right">
            Inspeção efetuada em {new Date(result.timestamp).toLocaleString('pt-PT')}
          </p>
        </div>
      )}
    </div>
  )
}
