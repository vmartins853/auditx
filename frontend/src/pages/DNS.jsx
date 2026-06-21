import { useState } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { Globe, Play, Copy, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp, Server, Mail, Shield, Info, Search } from 'lucide-react'
import { runDNSRecon } from '../services/api'
import { addHistoryEntry } from '../services/history'

const RECORD_INFO = {
  A:     { label: 'A',     desc: 'Endereços IPv4',              icon: Server, color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  AAAA:  { label: 'AAAA',  desc: 'Endereços IPv6',              icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20' },
  MX:    { label: 'MX',    desc: 'Servidores de e-mail',        icon: Mail,   color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  NS:    { label: 'NS',    desc: 'Servidores de nomes (DNS)',   icon: Globe,  color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20' },
  TXT:   { label: 'TXT',   desc: 'Registos de texto (SPF, verificações…)', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  CNAME: { label: 'CNAME', desc: 'Aliases de domínio',          icon: Info,   color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/20' },
  DMARC: { label: 'DMARC', desc: 'Política anti-spoofing de e-mail (_dmarc)', icon: Shield, color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
}

const EXAMPLES = ['google.com', 'github.com', 'cloudflare.com', 'microsoft.com']

function RecordCard({ type, records }) {
  const [open, setOpen] = useState(true)
  const info = RECORD_INFO[type] || RECORD_INFO.CNAME
  const Icon = info.icon

  if (!records || records.length === 0) return null

  return (
    <div className={`terminal overflow-hidden border ${info.bg}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${info.color}`} />
          <span className={`font-mono text-sm font-semibold ${info.color}`}>{info.label}</span>
          <span className="text-xs text-slate-500 font-mono">— {info.desc}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${info.bg} ${info.color}`}>
            {records.length} {records.length === 1 ? 'registo' : 'registos'}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {records.map((r, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3 group">
              <span className="text-slate-600 font-mono text-xs mt-0.5 w-5 shrink-0">{i + 1}.</span>
              <span className="font-mono text-sm text-white break-all">{r}</span>
              <button
                onClick={() => navigator.clipboard.writeText(r)}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-primary shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SecurityInsights({ records }) {
  const insights = []

  const spf = records.TXT?.find(r => r.includes('v=spf1'))
  if (spf) insights.push({ type: 'ok',   text: 'SPF configurado — protege contra spoofing de e-mail' })
  else      insights.push({ type: 'warn', text: 'Sem registo SPF — domínio vulnerável a spoofing de e-mail' })

  // DMARC vem de uma consulta dedicada a _dmarc.<domínio> (campo records.DMARC)
  const dmarc = records.DMARC?.find(r => r.includes('DMARC1'))
  if (dmarc) insights.push({ type: 'ok',   text: 'DMARC configurado — política de autenticação de e-mail presente' })
  else        insights.push({ type: 'warn', text: 'Sem registo DMARC — sem política de autenticação de e-mail' })

  if (records.AAAA?.length > 0)
    insights.push({ type: 'info', text: `IPv6 suportado (${records.AAAA.length} endereço${records.AAAA.length > 1 ? 's' : ''})` })

  if (records.NS?.length >= 2)
    insights.push({ type: 'ok', text: `${records.NS.length} servidores NS — redundância de DNS adequada` })
  else if (records.NS?.length === 1)
    insights.push({ type: 'warn', text: 'Apenas 1 servidor NS — ponto único de falha' })

  if (records.CNAME?.length > 0)
    insights.push({ type: 'info', text: `${records.CNAME.length} alias CNAME — possíveis subdomínios delegados` })

  return (
    <div className="terminal p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-primary w-4 h-4" />
        <span className="font-mono text-sm text-white font-semibold">Análise de Segurança</span>
      </div>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2.5 text-xs font-mono p-2.5 rounded-lg ${
            ins.type === 'ok'   ? 'bg-green-400/5 text-green-400'  :
            ins.type === 'warn' ? 'bg-yellow-400/5 text-yellow-400' :
                                  'bg-slate-400/5 text-slate-400'
          }`}>
            <span className="shrink-0 mt-0.5">
              {ins.type === 'ok' ? '✓' : ins.type === 'warn' ? '⚠' : 'ℹ'}
            </span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DNS() {
  const [domain, setDomain]       = useTemporaryStorage('dns_domain', '')
  const [enumSubdomains, setEnumSubs] = useTemporaryStorage('dns_enum', true)
  const [result, setResult]       = useTemporaryStorage('dns_result', null)

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [copied, setCopied]       = useState(false)

  const totalRecords = result
    ? Object.values(result.records).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    : 0

  async function handleRecon() {
    if (!domain.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await runDNSRecon(domain.trim(), enumSubdomains)
      if (res.data.status === 'error') setError(res.data.message)
      else {
        setResult(res.data)
        addHistoryEntry({ type: 'dns', target: domain.trim(), summary: `${res.data.stats?.total_records ?? 0} registos · ${res.data.subdomains?.length ?? 0} subdomínios`, data: res.data })
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro de ligação ao backend. Verifica se o servidor está a correr em localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  function copyAll() {
    if (!result) return
    const text = Object.entries(result.records)
      .filter(([, v]) => v?.length)
      .map(([type, vals]) => `[${type}]\n${vals.join('\n')}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="text-yellow-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            DNS <span className="text-yellow-400">Recon</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Enumeração de registos DNS — A, AAAA, MX, NS, TXT, CNAME — com análise de segurança automática.
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">DOMÍNIO ALVO</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRecon()}
              placeholder="exemplo.com"
              className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 font-mono text-sm text-white
                         placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 focus:ring-1
                         focus:ring-yellow-400/20 transition-all"
            />
            <button
              onClick={handleRecon}
              disabled={loading || !domain.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg
                         font-mono text-sm font-semibold text-yellow-400 hover:bg-yellow-500/30 hover:border-yellow-400/50
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A consultar...</>
                : <><Play className="w-4 h-4" /> Executar</>}
            </button>
          </div>
        </div>

        {/* Toggle subdomínios */}
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <div
            onClick={() => setEnumSubs(v => !v)}
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${enumSubdomains ? 'bg-yellow-400/80' : 'bg-dark-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${enumSubdomains ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-xs font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
            Enumerar subdomínios comuns (30 verificados)
          </span>
        </label>

        {/* Exemplos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-600">Exemplos:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setDomain(ex)}
              className="text-xs font-mono px-2.5 py-1 rounded border border-dark-700 text-slate-500
                         hover:border-yellow-400/30 hover:text-yellow-400 transition-all"
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

      {/* Loading */}
      {loading && (
        <div className="terminal p-8 flex flex-col items-center gap-3 mb-6">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          <p className="font-mono text-sm text-slate-400">
            A consultar registos DNS de <span className="text-yellow-400">{domain}</span>...
          </p>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="terminal px-4 py-3 flex items-center gap-3">
                <Globe className="text-yellow-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">{result.domain}</span>
              </div>
              <span className="font-mono text-xs text-slate-500">
                {totalRecords} {totalRecords === 1 ? 'registo encontrado' : 'registos encontrados'}
              </span>
            </div>
            <button
              onClick={copyAll}
              className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg border border-dark-700
                         text-slate-400 hover:text-primary hover:border-primary/30 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar tudo'}
            </button>
          </div>

          <SecurityInsights records={result.records} />

          <div className="space-y-3">
            {Object.entries(RECORD_INFO).map(([type]) => (
              <RecordCard key={type} type={type} records={result.records[type]} />
            ))}
          </div>

          {totalRecords === 0 && (
            <div className="terminal p-8 text-center">
              <p className="font-mono text-slate-500 text-sm">
                Nenhum registo DNS encontrado para <span className="text-yellow-400">{result.domain}</span>.
              </p>
            </div>
          )}

          {result.subdomains && result.subdomains.length > 0 && (
            <div className="terminal overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-dark-700">
                <div className="flex items-center gap-2">
                  <Search className="text-yellow-400 w-4 h-4" />
                  <span className="font-mono text-sm text-white font-semibold">Subdomínios Encontrados</span>
                  <span className="text-xs font-mono text-slate-500">
                    ({result.subdomains.length} de {result.stats?.subdomains_checked} verificados)
                  </span>
                </div>
              </div>
              <div className="divide-y divide-dark-700/50">
                {result.subdomains.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-dark-700/30 group transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-600 w-5">{i + 1}.</span>
                      <span className="font-mono text-sm text-yellow-400">{sub.subdomain}</span>
                      <span className="text-xs font-mono text-slate-500 border border-dark-600 px-1.5 py-0.5 rounded">{sub.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500">{sub.records?.[0]}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(sub.subdomain)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-primary transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.subdomains && result.subdomains.length === 0 && enumSubdomains && (
            <div className="terminal p-4 text-center">
              <p className="font-mono text-xs text-slate-600">Nenhum subdomínio comum encontrado.</p>
            </div>
          )}

          <p className="text-xs font-mono text-slate-600 text-right">
            Consulta efetuada em {new Date(result.timestamp).toLocaleString('pt-PT')}
          </p>
        </div>
      )}
    </div>
  )
}
