import { useState } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { Brain, Play, Copy, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp, Zap, Shield, List } from 'lucide-react'
import { analyzeOutput } from '../services/api'

const TOOLS = [
  { value: 'nmap',      label: 'Nmap',          placeholder: 'Cola aqui o output do Nmap...' },
  { value: 'gobuster',  label: 'Gobuster',       placeholder: 'Cola aqui o output do Gobuster...' },
  { value: 'hydra',     label: 'Hydra',          placeholder: 'Cola aqui o output do Hydra...' },
  { value: 'ffuf',      label: 'FFuF',           placeholder: 'Cola aqui o output do FFuF...' },
  { value: 'netcat',    label: 'Netcat',         placeholder: 'Cola aqui o output do Netcat...' },
  { value: 'hashcat',   label: 'Hashcat',        placeholder: 'Cola aqui o output do Hashcat...' },
  { value: 'manual',    label: 'Outro / Manual', placeholder: 'Cola aqui qualquer output de ferramenta de segurança...' },
]

const SEVERITY_COLOR = {
  'Alta':  'text-red-400 bg-red-400/10 border-red-400/20',
  'Média': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Baixa': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Info':  'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export default function AIAnalyzer() {
  const [tool, setTool]       = useTemporaryStorage('ai_tool', 'nmap')
  const [output, setOutput]   = useTemporaryStorage('ai_output', '')
  const [result, setResult]   = useTemporaryStorage('ai_result', null)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied]   = useState(null)

  const selectedTool = TOOLS.find(t => t.value === tool) || TOOLS[0]

  async function handleAnalyze() {
    if (!output.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await analyzeOutput(tool, output)
      if (res.data.status === 'error') setError(res.data.message)
      else setResult(res.data.analysis)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro de ligação ao backend. Verifica se o servidor está a correr em localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Brain className="text-purple-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            AI <span className="text-purple-400">Analyzer</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Cola o output de qualquer ferramenta e obtém uma análise detalhada com sugestões de ataque.
        </p>
      </div>

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        {/* Seleção de ferramenta */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">FERRAMENTA</label>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map(t => (
              <button
                key={t.value}
                onClick={() => setTool(t.value)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                  tool === t.value
                    ? 'bg-purple-400/10 border-purple-400/40 text-purple-400'
                    : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-white hover:border-dark-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea do output */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">
            OUTPUT DA FERRAMENTA
          </label>
          <textarea
            value={output}
            onChange={e => setOutput(e.target.value)}
            placeholder={selectedTool.placeholder}
            rows={10}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 font-mono text-xs text-white
                       placeholder-slate-600 focus:outline-none focus:border-purple-400/50 focus:ring-1
                       focus:ring-purple-400/20 transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono text-slate-600">
              {output.length > 0 ? `${output.length} caracteres` : 'Sem conteúdo'}
            </span>
            {output.length > 0 && (
              <button
                onClick={() => { setOutput(''); setResult(null) }}
                className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors"
              >
                ↺ Limpar
              </button>
            )}
          </div>
        </div>

        {/* Botão */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !output.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-purple-500/20 border border-purple-400/30 rounded-lg
                     font-mono text-sm font-semibold text-purple-400 hover:bg-purple-500/30 hover:border-purple-400/50
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A analisar com IA...</>
            : <><Play className="w-4 h-4" /> Analisar com IA</>}
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

          {/* Resumo */}
          <div className="terminal p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="text-purple-400 w-4 h-4" />
              <span className="font-mono text-sm text-white font-semibold">Resumo</span>
            </div>
            <p className="font-mono text-sm text-slate-300 leading-relaxed">{result.resumo}</p>
          </div>

          {/* Riscos */}
          {result.riscos?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="text-red-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">Riscos Identificados</span>
                <span className="text-xs font-mono text-slate-500">({result.riscos.length})</span>
              </div>
              {result.riscos.map((risco, i) => (
                <div key={i} className="terminal p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-white font-semibold">{risco.titulo}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${SEVERITY_COLOR[risco.severidade] || SEVERITY_COLOR['Info']}`}>
                      {risco.severidade}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">{risco.descricao}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recomendações */}
          {result.recomendacoes?.length > 0 && (
            <div className="terminal p-5">
              <div className="flex items-center gap-2 mb-3">
                <List className="text-blue-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">Recomendações</span>
              </div>
              <ul className="space-y-2">
                {result.recomendacoes.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-xs text-slate-300">
                    <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Próximos passos */}
          {result.proximos_passos?.length > 0 && (
            <div className="terminal p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-yellow-400 w-4 h-4" />
                <span className="font-mono text-sm text-white font-semibold">Próximos Passos</span>
              </div>
              <div className="space-y-2">
                {result.proximos_passos.map((passo, i) => (
                  <div key={i} className="flex items-center justify-between group bg-dark-700/50 rounded-lg px-3 py-2">
                    <code className="font-mono text-xs text-yellow-400 break-all">{passo}</code>
                    <button
                      onClick={() => copyText(passo, `passo_${i}`)}
                      className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-primary"
                    >
                      {copied === `passo_${i}`
                        ? <Check className="w-3.5 h-3.5 text-primary" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output raw da IA colapsável */}
          <div className="terminal overflow-hidden">
            <button
              onClick={() => setShowRaw(v => !v)}
              className="w-full flex items-center justify-between p-4 text-slate-400 hover:text-white transition-colors"
            >
              <span className="font-mono text-xs">RESPOSTA RAW DA IA</span>
              {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRaw && (
              <pre className="px-4 pb-4 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap border-t border-dark-700 pt-4">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
