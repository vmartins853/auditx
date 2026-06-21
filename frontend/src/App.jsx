// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Componente raiz da aplicação React
//
// Este componente define a estrutura de navegação da aplicação usando o
// React Router DOM. O BrowserRouter usa a API History do browser para gerir
// o URL sem recarregar a página (comportamento típico de uma SPA —
// Single Page Application).
//
// Estrutura de rotas:
//   /                → Home (Dashboard)
//   /scanner         → Módulo Port Scanner
//   /dns             → Módulo DNS Recon
//   /command-builder → Módulo Command Builder
//   /ai-analyzer     → Módulo AI Analyzer
//   /reports         → Módulo Reports
//
// O Layout envolve todas as rotas e é responsável pela sidebar de navegação
// persistente. O componente <Outlet /> do React Router renderiza a página
// correspondente ao URL atual dentro do Layout.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'

// Importação de todas as páginas da aplicação
import Home           from './pages/Home'
import Scanner        from './pages/Scanner'
import DNS            from './pages/DNS'
import CommandBuilder from './pages/CommandBuilder'
import AIAnalyzer     from './pages/AIAnalyzer'
import Reports        from './pages/Reports'
import Headers        from './pages/Headers'
import NotFound       from './pages/NotFound'

export default function App() {
  return (
    // BrowserRouter fornece o contexto de navegação a todos os componentes filhos
    <BrowserRouter>
      <Routes>
        {/*
          Layout é a rota pai — renderiza a sidebar e o conteúdo principal.
          Todas as rotas filhas são renderizadas dentro do <Outlet /> do Layout.
        */}
        <Route path="/" element={<Layout />}>
          {/* index — rota principal, renderizada em "/" */}
          <Route index                     element={<Home />}           />
          <Route path="scanner"            element={<Scanner />}        />
          <Route path="dns"                element={<DNS />}            />
          <Route path="command-builder"    element={<CommandBuilder />} />
          <Route path="ai-analyzer"        element={<AIAnalyzer />}     />
          <Route path="reports"            element={<Reports />}        />
          <Route path="headers"            element={<Headers />}        />
          {/* catch-all — qualquer URL desconhecido */}
          <Route path="*"                  element={<NotFound />}       />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
