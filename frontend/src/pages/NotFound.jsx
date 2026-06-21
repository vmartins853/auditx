import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

// Página apresentada em qualquer rota desconhecida (catch-all "*" no App.jsx)
export default function NotFound() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="terminal p-8 text-center">
        <Shield className="text-primary w-10 h-10 mx-auto mb-3" />
        <h1 className="font-mono text-2xl font-bold text-white mb-1">404</h1>
        <p className="font-mono text-sm text-slate-400 mb-4">Página não encontrada.</p>
        <Link to="/" className="font-mono text-xs text-primary hover:underline">
          ← Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
