import { useState } from 'react'
import { FileText, Download, Loader2, AlertTriangle, CheckCircle, User, Target, Calendar, AlignLeft, Scan, Globe, Brain, Shield, Lock, History } from 'lucide-react'
import { generateReport } from '../services/api'
import { getHistory } from '../services/history'

export default function Reports() {
  const [alvo,      setAlvo]      = useState('')
  const [auditor,   setAuditor]   = useState('')
  const [data,      setData]      = useState(new Date().toISOString().split('T')[0])
  const [descricao, setDescricao] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)

  // Carregar dados guardados dos outros módulos.
  // O TTL tem de coincidir com o do useTemporaryStorage (30 min), senão a Reports
  // descarta dados que os módulos ainda consideram válidos.
  const STORAGE_TTL = 30 * 60 * 1000
  function loadFromStorage(key) {
    try {
      const item = sessionStorage.getItem(key)
      if (!item) return null
      const { value, timestamp } = JSON.parse(item)
      const expired = Date.now() - timestamp > STORAGE_TTL
      return expired ? null : value
    } catch { return null }
  }

  const scannerResult = loadFromStorage('scanner_result')
  const dnsResult     = loadFromStorage('dns_result')
  const headersResult = loadFromStorage('headers_result')
  const tlsResult     = loadFromStorage('tls_result')
  const aiResult      = loadFromStorage('ai_result')

  // Normaliza um alvo para comparação: minúsculas, sem esquema (http://),
  // sem porta nem caminho, sem barra final. Assim "https://Exemplo.com/x:443"
  // e "exemplo.com" passam a comparar como iguais.
  function normalizeTarget(t) {
    return String(t || '')
      .toLowerCase().trim()
      .replace(/^https?:\/\//, '')   // remove o esquema
      .replace(/[/:].*$/, '')        // remove porta e caminho
      .replace(/\/$/, '')            // remove barra final
  }

  // O histórico vive no localStorage (persiste entre sessões) — ao contrário dos
  // resultados dos módulos, não expira. Guardamos só os campos não sensíveis
  // (sem o blob `data`) para manter o payload leve.
  const allHistory = getHistory().map(({ timestamp, type, target, summary }) => ({ timestamp, type, target, summary }))

  // Filtra o histórico pelo alvo do relatório: só entram execuções do mesmo alvo
  // (correspondência exata ou de subdomínio). Sem alvo preenchido ainda não há
  // correspondência possível, por isso a lista fica vazia.
  const alvoKey = normalizeTarget(alvo)
  const historyEntries = alvoKey
    ? allHistory.filter(h => {
        const hk = normalizeTarget(h.target)
        return hk && (hk === alvoKey || hk.endsWith('.' + alvoKey) || alvoKey.endsWith('.' + hk))
      })
    : []

  async function handleGenerate() {
    if (!alvo.trim()) {
      setError('O campo Alvo é obrigatório.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        alvo,
        auditor,
        data,
        descricao,
        scanner:     scannerResult || null,
        dns:         dnsResult     || null,
        headers:     headersResult || null,
        tls:         tlsResult     || null,
        ai_analysis: aiResult      || null,
        history:     historyEntries.length ? historyEntries : null,
      }

      const res = await generateReport(payload)
      // Usa o content-type da resposta: o backend pode devolver HTML (fallback do WeasyPrint)
      const ct  = res.headers['content-type'] || 'application/pdf'
      const ext = ct.includes('pdf') ? 'pdf' : 'html'
      const url = window.URL.createObjectURL(new Blob([res.data], { type: ct }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `auditx_report.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao gerar o relatório. Verifica se o backend está a correr.')
    } finally {
      setLoading(false)
    }
  }

  const hasScanner = !!scannerResult
  const hasDNS     = !!dnsResult
  const hasHeaders = !!headersResult
  const hasTLS     = !!tlsResult
  const hasAI      = !!aiResult
  const hasHistory = historyEntries.length > 0
  const hasAny     = hasScanner || hasDNS || hasHeaders || hasTLS || hasAI || hasHistory

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="text-red-400 w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            Audit <span className="text-red-400">Reports</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Gera um relatório PDF com os resultados dos módulos executados.
        </p>
      </div>

      {/* Dados detetados automaticamente */}
      <div className="terminal p-5 mb-6">
        <p className="text-xs font-mono text-slate-500 mb-3">DADOS DETETADOS AUTOMATICAMENTE</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Scan className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="font-mono text-xs text-slate-300">Port Scanner</span>
            {hasScanner
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ {scannerResult.parsed?.length || 0} portas encontradas</span>
              : <span className="text-xs font-mono text-slate-600 ml-auto">Sem dados — executa o Port Scanner primeiro</span>}
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 shrink-0 text-yellow-400" />
            <span className="font-mono text-xs text-slate-300">DNS Recon</span>
            {hasDNS
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ {dnsResult.domain}</span>
              : <span className="text-xs font-mono text-slate-600 ml-auto">Sem dados — executa o DNS Recon primeiro</span>}
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-mono text-xs text-slate-300">Security Headers</span>
            {hasHeaders
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ Nota {headersResult.grade} ({headersResult.present}/{headersResult.total})</span>
              : <span className="text-xs font-mono text-slate-600 ml-auto">Sem dados — executa o Security Headers primeiro</span>}
          </div>
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">TLS Inspector</span>
            {hasTLS
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ {tlsResult.host} ({tlsResult.tls_version})</span>
              : <span className="text-xs font-mono text-slate-600 ml-auto">Sem dados — executa o TLS Inspector primeiro</span>}
          </div>
          <div className="flex items-center gap-3">
            <Brain className="w-4 h-4 shrink-0 text-purple-400" />
            <span className="font-mono text-xs text-slate-300">AI Analyzer</span>
            {hasAI
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ {aiResult.riscos?.length || 0} riscos identificados</span>
              : <span className="text-xs font-mono text-slate-600 ml-auto">Sem dados — executa o AI Analyzer primeiro</span>}
          </div>
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="font-mono text-xs text-slate-300">Histórico de Execuções</span>
            {hasHistory
              ? <span className="text-xs font-mono text-green-400 ml-auto">✓ {historyEntries.length} entradas para este alvo</span>
              : allHistory.length === 0
                ? <span className="text-xs font-mono text-slate-600 ml-auto">Sem registos no histórico</span>
                : alvoKey
                  ? <span className="text-xs font-mono text-slate-600 ml-auto">Sem registos para este alvo ({allHistory.length} no total)</span>
                  : <span className="text-xs font-mono text-slate-600 ml-auto">Preenche o alvo para filtrar ({allHistory.length} no total)</span>}
          </div>
        </div>
        {!hasAny && (
          <p className="text-xs font-mono text-yellow-400 mt-3">
            ⚠ Nenhum resultado detetado. Os dados dos módulos expiram após 30 minutos de inatividade.
          </p>
        )}
      </div>

      {/* Campos manuais */}
      <div className="space-y-4 mb-6">
        <p className="text-xs font-mono text-slate-500 uppercase">Informações do Relatório</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
              <Target className="w-3.5 h-3.5" /> ALVO <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={alvo}
              onChange={e => { setAlvo(e.target.value); setError(null) }}
              placeholder="192.168.1.1 ou exemplo.com"
              className={`w-full bg-dark-800 border rounded-lg px-3 py-2.5 font-mono text-sm text-white
                         placeholder-slate-600 focus:outline-none focus:border-red-400/50 transition-all ${
                           error && !alvo.trim() ? 'border-red-500/50' : 'border-dark-700'
                         }`}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
              <Calendar className="w-3.5 h-3.5" /> DATA
            </label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 font-mono text-sm
                         text-white focus:outline-none focus:border-red-400/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
            <User className="w-3.5 h-3.5" /> AUDITOR
          </label>
          <input
            type="text"
            value={auditor}
            onChange={e => setAuditor(e.target.value)}
            placeholder="Nome do auditor"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 font-mono text-sm
                       text-white placeholder-slate-600 focus:outline-none focus:border-red-400/50 transition-all"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
            <AlignLeft className="w-3.5 h-3.5" /> DESCRIÇÃO / ÂMBITO
          </label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreve o âmbito do teste, objetivos, e contexto da auditoria..."
            rows={4}
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-3 font-mono text-sm
                       text-white placeholder-slate-600 focus:outline-none focus:border-red-400/50 transition-all resize-none"
          />
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5 mb-4">
          <AlertTriangle className="text-red-400 w-5 h-5 mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-slate-400">{error}</p>
        </div>
      )}

      {/* Sucesso */}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-green-500/20 bg-green-500/5 mb-4">
          <CheckCircle className="text-green-400 w-5 h-5 mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-green-400">Relatório gerado e descarregado com sucesso!</p>
        </div>
      )}

      {/* Botão */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-400/30 rounded-lg
                   font-mono text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:border-red-400/50
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> A gerar relatório...</>
          : <><Download className="w-4 h-4" /> Gerar e Descarregar PDF</>}
      </button>

      <p className="text-xs font-mono text-slate-600 mt-4">
        O relatório inclui automaticamente todos os dados disponíveis dos módulos executados nesta sessão.
      </p>
    </div>
  )
}
