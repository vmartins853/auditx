import { Link } from 'react-router-dom'
import { Scan, Globe, Terminal, Brain, FileText, Shield } from 'lucide-react'

const modules = [
  {
    to: '/scanner',
    icon: Scan,
    title: 'Port Scanner',
    desc: 'Executa Nmap contra um alvo e analisa portas e serviços ativos.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  {
    to: '/dns',
    icon: Globe,
    title: 'DNS Recon',
    desc: 'Enumeração de subdomínios e registos DNS de um domínio alvo.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
  },
  {
    to: '/command-builder',
    icon: Terminal,
    title: 'Command Builder',
    desc: 'Constrói comandos para Nmap, Hydra, Gobuster e Reverse Shells.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    to: '/ai-analyzer',
    icon: Brain,
    title: 'AI Analyzer',
    desc: 'Analisa outputs de ferramentas com IA e sugere vetores de ataque.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
  },
  {
    to: '/reports',
    icon: FileText,
    title: 'Reports',
    desc: 'Gera relatórios PDF de auditoria com resultados e recomendações.',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
  },
]

export default function Home() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-primary w-8 h-8" />
          <h1 className="text-3xl font-mono font-bold text-white">
            Audit<span className="text-primary">X</span>
          </h1>
        </div>
        <p className="text-slate-400 font-mono text-sm">
          Plataforma modular de testes de segurança e auditoria assistida por IA
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-primary">Sistema operacional</span>
        </div>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modules.map(({ to, icon: Icon, title, desc, color, bg }) => (
          <Link
            key={to}
            to={to}
            className={`group p-5 rounded-xl border ${bg} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className={`${color} mb-3`}>
              <Icon className="w-6 h-6" />
            </div>
            <h2 className={`font-mono font-semibold text-white mb-1`}>{title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            <div className={`mt-4 text-xs font-mono ${color} opacity-0 group-hover:opacity-100 transition-opacity`}>
              Abrir módulo →
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-10 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
        <p className="text-xs font-mono text-red-400">
          ⚠ Esta ferramenta destina-se exclusivamente a fins educativos e a testes em ambientes autorizados.
          O uso indevido é da inteira responsabilidade do utilizador.
        </p>
      </div>
    </div>
  )
}
