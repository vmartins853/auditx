import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary — apanha exceções de render em qualquer página filha e mostra um
// fallback, em vez de deixar a app inteira ir a ecrã branco. Tem de ser um
// componente de classe (os hooks não suportam getDerivedStateFromError).
//
// A prop resetKey (ex.: o pathname da rota) limpa o erro ao navegar para outra
// página, permitindo recuperar sem recarregar.
// ─────────────────────────────────────────────────────────────────────────────
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 max-w-2xl">
          <div className="flex items-start gap-3 p-5 rounded-lg border border-red-500/20 bg-red-500/5">
            <AlertTriangle className="text-red-400 w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <p className="font-mono text-sm text-red-400 font-semibold">Algo correu mal nesta página</p>
              <p className="font-mono text-xs text-slate-400 mt-1">
                {String(this.state.error?.message || this.state.error)}
              </p>
              <p className="font-mono text-xs text-slate-500 mt-3">
                Escolhe outro módulo na barra lateral para continuar.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
