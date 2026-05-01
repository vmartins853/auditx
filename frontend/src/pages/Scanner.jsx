import { useState } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { Scan, Play, Copy, Check, AlertTriangle, ChevronDown, ChevronUp, Loader2, Wifi } from 'lucide-react'
import { runScan } from '../services/api'

const SCAN_PRESETS = [
  { label: 'Scan Rápido',   flags: ['-T4'],        ports: '1-1000',  desc: 'Top 1000 portas, velocidade T4' },
  { label: 'Scan Completo', flags: ['-T4', '-sV'], ports: '1-65535', desc: 'Todas as portas + deteção de versão' },
  { label: 'Deteção de OS', flags: ['-T4', '-O'],  ports: '1-1000',  desc: 'Tenta identificar o sistema operativo' },
  { label: 'Stealth SYN',   flags: ['-sS', '-T2'], ports: '1-1000',  desc: 'Scan furtivo SYN, mais lento' },
  { label: 'UDP Scan',      flags: ['-sU', '-T4'], ports: '1-500',   desc: 'Verifica portas UDP abertas' },
  { label: 'Personalizado', flags: [],             ports: '',        desc: 'Define os teus próprios parâmetros' },
]

const SEVERITY_MAP = {
  21:   { risk: 'Alta',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  22:   { risk: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  23:   { risk: 'Alta',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  25:   { risk: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  80:   { risk: 'Baixa', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  443:  { risk: 'Baixa', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20' },
  445:  { risk: 'Alta',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  3306: { risk: 'Alta',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  3389: { risk: 'Alta',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  8080: { risk: 'Baixa', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
}

function getRisk(port) {
  return SEVERITY_MAP[port] || { risk: 'Info', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' }
}

function isValidTarget(value) {
  const ipv4   = /^(\d{1,3}\.){3}\d{1,3}$/
  const domain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

  if (ipv4.test(value)) {
    return value.split('.').every(n => parseInt(n) >= 0 && parseInt(n) <= 255)
  }

  return domain.test(value)
}

export default function Scanner() {
  const [target, setTarget]           = useTemporaryStorage('scanner_target', '')
  const [preset, setPreset]           = useTemporaryStorage('scanner_preset', 0)
  const [customPorts, setCustomPorts] = useTemporaryStorage('scanner_ports', '')
  const [customFlags, setCustomFlags] = useTemporaryStorage('scanner_flags', '')
  const [result, setResult]           = useTemporaryStorage('scanner_result', null)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied]   = useState(false)

  const isCustom       = preset === SCAN_PRESETS.length - 1
  const selectedPreset = SCAN_PRESETS[preset]
  const ports          = isCustom ? customPorts : selectedPreset.ports
  const flags          = isCustom ? customFlags.split(' ').filter(Boolean) : selectedPreset.flags
  const command        = `nmap -p${ports} --open ${flags.join(' ')} ${target || '<alvo>'}`

  async function handleScan() {
    if (!target.trim()) return

    if (!isValidTarget(target.trim())) {
      setError('Alvo inválido. Introduz um endereço IPv4 válido (ex: 192.168.1.1) ou um domínio (ex: exemplo.com).')
      setResult(null)
      return
    }

    if (isCustom && !customPorts.trim()) {
      setError('No modo personalizado tens de especificar as portas (ex: 1-1000 ou 80,443,8080).')
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      console.log('A fazer scan...')
      const res = await runScan(target.trim(), { ports, flags })
      console.log('Resposta recebida:', res)
      if (res.data.status === 'error') setError(res.data.message)
      else setResult(res.data)
    } catch (e) {
      console.log('Erro capturado:', e.message)
      console.log('Erro tipo:', e.constructor.name)
      console.log('Erro capturado:', e.message)
      console.log('Erro tipo:', e.constructor.name)
      console.log('Erro completo:', JSON.stringify(e, Object.getOwnPropertyNames(e)))
      console.log('Erro code:', e.code)
      console.log('Erro config url:', e.config?.url)
      setError(e.response?.data?.detail || 'Erro de ligação ao backend. Verifica se o servidor está a correr em localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  function copyCommand() {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highRisk = result?.parsed?.filter(p => getRisk(p.port).risk === 'Alta') || []

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Scan className="text-blue-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            Port <span className="text-blue-400">Scanner</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Executa Nmap contra um alvo e analisa portas e serviços ativos.
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-5 mb-6">
        {/* Alvo */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">ALVO (IP ou domínio)</label>
          <input
            type="text"
            value={target}
            onChange={e => { setTarget(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            placeholder="192.168.1.1 ou exemplo.com"
            className={`w-full bg-dark-800 border rounded-lg px-4 py-3 font-mono text-sm text-white
                       placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                         error && !loading
                           ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                           : 'border-dark-700 focus:border-blue-400/50 focus:ring-blue-400/20'
                       }`}
          />
        </div>

        {/* Presets */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">TIPO DE SCAN</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SCAN_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPreset(i)}
                className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                  preset === i
                    ? 'border-blue-400/40 bg-blue-400/10 text-blue-400'
                    : 'border-dark-700 bg-dark-800 text-slate-400 hover:border-dark-600 hover:text-white'
                }`}
              >
                <div className="font-mono text-xs font-semibold">{p.label}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Campos personalizados */}
        {isCustom && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                PORTAS <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customPorts}
                onChange={e => { setCustomPorts(e.target.value); setError(null) }}
                placeholder="ex: 1-65535 ou 80,443,8080"
                className={`w-full bg-dark-800 border rounded-lg px-3 py-2.5 font-mono text-sm
                           text-white placeholder-slate-600 focus:outline-none focus:border-blue-400/50 transition-all ${
                             error && !customPorts.trim()
                               ? 'border-red-500/50'
                               : 'border-dark-700'
                           }`}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">FLAGS NMAP</label>
              <input
                type="text"
                value={customFlags}
                onChange={e => setCustomFlags(e.target.value)}
                placeholder="ex: -sV -O -T4"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 font-mono text-sm
                           text-white placeholder-slate-600 focus:outline-none focus:border-blue-400/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Preview do comando */}
        <div className="terminal p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">COMANDO GERADO</span>
            <button onClick={copyCommand} className="text-slate-500 hover:text-primary transition-colors">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="font-mono text-sm">
            <span className="text-primary">root@kali</span>
            <span className="text-slate-400">:~$ </span>
            <span className="text-white">{command}</span>
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={handleScan}
          disabled={loading || !target.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-400/30 rounded-lg
                     font-mono text-sm font-semibold text-blue-400 hover:bg-blue-500/30 hover:border-blue-400/50
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A executar scan...</>
            : <><Play className="w-4 h-4" /> Executar Scan</>}
        </button>
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
          {/* Sumário */}
          <div className="grid grid-cols-3 gap-4">
            <div className="terminal p-4 text-center">
              <div className="text-2xl font-mono font-bold text-blue-400">{result.parsed.length}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Portas Abertas</div>
            </div>
            <div className="terminal p-4 text-center">
              <div className="text-2xl font-mono font-bold text-red-400">{highRisk.length}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Risco Alto</div>
            </div>
            <div className="terminal p-4 text-center">
              <div className="text-sm font-mono font-bold text-primary truncate">{result.target}</div>
              <div className="text-xs font-mono text-slate-500 mt-1">Alvo</div>
            </div>
          </div>

          {/* Alertas risco alto */}
          {highRisk.length > 0 && (
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-400 w-4 h-4" />
                <span className="font-mono text-sm text-red-400 font-semibold">Portas de Risco Alto Detetadas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {highRisk.map(p => (
                  <span key={p.port} className="font-mono text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {p.port}/{p.protocol} ({p.service})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabela */}
          {result.parsed.length > 0 ? (
            <div className="terminal overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-dark-700">
                <Wifi className="text-blue-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">Portas Abertas</span>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left px-4 py-2.5 text-xs text-slate-500">PORTA</th>
                    <th className="text-left px-4 py-2.5 text-xs text-slate-500">PROTOCOLO</th>
                    <th className="text-left px-4 py-2.5 text-xs text-slate-500">SERVIÇO</th>
                    <th className="text-left px-4 py-2.5 text-xs text-slate-500">VERSÃO</th>
                    <th className="text-left px-4 py-2.5 text-xs text-slate-500">RISCO</th>
                  </tr>
                </thead>
                <tbody>
                  {result.parsed.map((p, i) => {
                    const risk = getRisk(p.port)
                    return (
                      <tr key={i} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="px-4 py-2.5 text-blue-400 font-bold">{p.port}</td>
                        <td className="px-4 py-2.5 text-slate-400">{p.protocol}</td>
                        <td className="px-4 py-2.5 text-white">{p.service}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{p.version || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded border ${risk.bg} ${risk.color}`}>
                            {risk.risk}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="terminal p-8 text-center">
              <p className="font-mono text-slate-500 text-sm">Nenhuma porta aberta encontrada no range especificado.</p>
            </div>
          )}

          {/* Output raw colapsável */}
          <div className="terminal overflow-hidden">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-full flex items-center justify-between p-4 text-slate-400 hover:text-white transition-colors"
            >
              <span className="font-mono text-xs">OUTPUT RAW DO NMAP</span>
              {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRaw && (
              <pre className="px-4 pb-4 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap border-t border-dark-700 pt-4">
                {result.raw}
              </pre>
            )}
          </div>

          <p className="text-xs font-mono text-slate-600 text-right">
            Scan executado em {new Date(result.timestamp).toLocaleString('pt-PT')}
          </p>
        </div>
      )}
    </div>
  )
}
