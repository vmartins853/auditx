import { Outlet, NavLink } from 'react-router-dom'
import {
  Shield, Scan, Globe, Terminal, Brain, FileText
} from 'lucide-react'

const navItems = [
  { to: '/',                label: 'Dashboard',       icon: Shield },
  { to: '/scanner',         label: 'Port Scanner',    icon: Scan },
  { to: '/dns',             label: 'DNS Recon',       icon: Globe },
  { to: '/command-builder', label: 'Command Builder', icon: Terminal },
  { to: '/ai-analyzer',     label: 'AI Analyzer',     icon: Brain },
  { to: '/reports',         label: 'Reports',         icon: FileText },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <Shield className="text-primary w-7 h-7" />
            <span className="font-mono font-bold text-xl text-white">
              Audit<span className="text-primary">X</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">Security Testing Platform</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 glow'
                    : 'text-slate-400 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="font-mono">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700">
          <p className="text-xs text-slate-600 font-mono text-center">
            AuditX v0.1.0 — PIEI-22
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
