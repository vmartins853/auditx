import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import DNS from './pages/DNS'
import CommandBuilder from './pages/CommandBuilder'
import AIAnalyzer from './pages/AIAnalyzer'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="dns" element={<DNS />} />
          <Route path="command-builder" element={<CommandBuilder />} />
          <Route path="ai-analyzer" element={<AIAnalyzer />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
