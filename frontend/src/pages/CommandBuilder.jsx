import { useState, useMemo } from 'react'
import { useTemporaryStorage } from '../hooks/useTemporaryStorage'
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { TOOLS, buildCommand } from '../services/tools'

const CATEGORIES = ['Todos', 'Reconhecimento', 'Web Hacking', 'Cracking', 'Exploração']

function FlagToggle({ flag, selected, onToggle }) {
  const [showDesc, setShowDesc] = useState(false)
  const isActive = selected.includes(flag.flag)

  return (
    <div className={`rounded-lg border transition-all duration-150 overflow-hidden ${
      isActive ? 'border-primary/40 bg-primary/5' : 'border-dark-700 bg-dark-800 hover:border-dark-600'
    }`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onToggle(flag.flag)}
          className={`w-4 h-4 rounded border-2 shrink-0 transition-all flex items-center justify-center ${
            isActive ? 'bg-primary border-primary' : 'border-slate-600 hover:border-slate-400'
          }`}
        >
          {isActive && <span className="text-black text-xs font-bold leading-none">✓</span>}
        </button>
        <code className={`font-mono text-xs font-semibold ${isActive ? 'text-primary' : 'text-slate-300'}`}>
          {flag.flag}
        </code>
        <span className="text-xs text-slate-400 flex-1 truncate">{flag.label}</span>
        <button onClick={() => setShowDesc(v => !v)} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
      {showDesc && (
        <div className="px-3 pb-3 border-t border-dark-700 pt-2">
          <p className="text-xs font-mono text-slate-500 leading-relaxed">{flag.desc}</p>
        </div>
      )}
    </div>
  )
}

export default function CommandBuilder() {
  const [category, setCategory]           = useTemporaryStorage('cb_category', 'Todos')
  const [selectedToolId, setSelectedToolId] = useTemporaryStorage('cb_tool', TOOLS[0].id)
  const [fieldValues, setFieldValues]     = useTemporaryStorage('cb_fields', {})
  const [selectedFlags, setSelectedFlags] = useTemporaryStorage('cb_flags', [])

  const [showFlags, setShowFlags] = useState(true)
  const [copied, setCopied]       = useState(false)

  const selectedTool = TOOLS.find(t => t.id === selectedToolId) || TOOLS[0]

  const visibleTools = useMemo(() =>
    category === 'Todos' ? TOOLS : TOOLS.filter(t => t.category === category),
    [category]
  )

  function selectTool(tool) {
    setSelectedToolId(tool.id)
    setFieldValues({})
    setSelectedFlags([])
  }

  function updateField(id, value) {
    setFieldValues(prev => ({ ...prev, [id]: value }))
  }

  function toggleFlag(flag) {
    setSelectedFlags(prev => {
      // Desligar: simplesmente remove
      if (prev.includes(flag)) return prev.filter(f => f !== flag)

      // Ligar: se a flag pertencer a um grupo mutuamente exclusivo,
      // remove as outras flags do mesmo grupo antes de a adicionar
      const def = selectedTool.flags.find(f => f.flag === flag)
      let next = prev
      if (def?.group) {
        const sameGroup = selectedTool.flags
          .filter(f => f.group === def.group)
          .map(f => f.flag)
        next = prev.filter(f => !sameGroup.includes(f))
      }
      return [...next, flag]
    })
  }

  const command = useMemo(() =>
    buildCommand(selectedTool, fieldValues, selectedFlags),
    [selectedTool, fieldValues, selectedFlags]
  )

  function copyCommand() {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Terminal className="text-primary w-6 h-6" />
          <h1 className="text-2xl font-mono font-bold text-white">
            Command <span className="text-primary">Builder</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Constrói comandos para ferramentas de pentesting com explicação de cada opção.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 space-y-3">
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs transition-all ${
                  category === cat ? 'bg-dark-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="border-t border-dark-700 pt-3 space-y-1">
            {visibleTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => selectTool(tool)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  selectedToolId === tool.id
                    ? `${tool.bg} border ${tool.border} ${tool.color}`
                    : 'text-slate-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <span className="font-mono text-sm font-semibold">{tool.name}</span>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight line-clamp-1">{tool.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Painel principal */}
        <div className="col-span-9 space-y-5">
          <div className={`p-4 rounded-xl border ${selectedTool.border} ${selectedTool.bg}`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-lg font-bold ${selectedTool.color}`}>{selectedTool.name}</span>
              <span className="text-xs font-mono text-slate-500 border border-dark-600 px-2 py-0.5 rounded">{selectedTool.category}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{selectedTool.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {selectedTool.fields.filter(field => !field.showIf || field.showIf(fieldValues)).map(field => (
              <div key={field.id} className={field.id === 'url' ? 'col-span-2' : ''}>
                <label className="block text-xs font-mono text-slate-400 mb-2">
                  {field.label.toUpperCase()}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={fieldValues[field.id] || field.options[0]?.value || ''}
                    onChange={e => updateField(field.id, e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.id] ?? (field.default || '')}
                    onChange={e => updateField(field.id, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2.5 font-mono text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                )}
              </div>
            ))}
          </div>

          {selectedTool.flags.length > 0 && (
            <div className="terminal overflow-hidden">
              <button
                onClick={() => setShowFlags(v => !v)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <span className="font-mono text-xs text-slate-400">FLAGS DISPONÍVEIS</span>
                <div className="flex items-center gap-2">
                  {selectedFlags.length > 0 && (
                    <span className="text-xs font-mono text-primary">{selectedFlags.length} ativa{selectedFlags.length !== 1 ? 's' : ''}</span>
                  )}
                  {showFlags ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>
              {showFlags && (
                <div className="border-t border-dark-700 p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedTool.flags.map(flag => (
                    <FlagToggle key={flag.flag} flag={flag} selected={selectedFlags} onToggle={toggleFlag} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="terminal p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs font-mono text-slate-600">terminal</span>
              </div>
              <button
                onClick={copyCommand}
                disabled={!command}
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded border border-dark-600 text-slate-400 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-primary" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>
            <div className="font-mono text-sm min-h-[2rem]">
              <span className="text-primary">root@kali</span>
              <span className="text-slate-400">:~$ </span>
              {command
                ? <span className="text-white break-all">{command}</span>
                : <span className="text-slate-600">Preenche os campos acima para gerar o comando...</span>
              }
            </div>
          </div>

          {selectedTool.id === 'revshell' && fieldValues['lport'] && (
            <div className="terminal p-4">
              <p className="text-xs font-mono text-slate-500 mb-2">LISTENER (corre isto na tua máquina primeiro)</p>
              <div className="font-mono text-sm">
                <span className="text-primary">root@kali</span>
                <span className="text-slate-400">:~$ </span>
                <span className="text-yellow-400">nc -lvnp {fieldValues['lport']}</span>
              </div>
            </div>
          )}

          {(selectedFlags.length > 0 || Object.keys(fieldValues).length > 0) && (
            <button
              onClick={() => { setFieldValues({}); setSelectedFlags([]) }}
              className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors"
            >
              ↺ Limpar seleções
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
