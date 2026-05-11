// ─────────────────────────────────────────────────────────────────────────────
// hooks/useTemporaryStorage.js — Hook personalizado de persistência temporária
//
// Este hook foi desenvolvido de raiz para resolver um problema específico do
// AuditX: quando o utilizador navega entre módulos (ex: vai do Scanner para
// o DNS Recon e volta), o React desmonta e remonta os componentes, perdendo
// todo o estado local (useState).
//
// A solução é guardar o estado no sessionStorage do browser — um mecanismo de
// armazenamento nativo que persiste os dados enquanto a aba do browser está
// aberta, mas os elimina quando a aba é fechada.
//
// Para evitar que dados antigos de sessões anteriores apareçam inesperadamente,
// cada valor guardado inclui um timestamp. Os dados expiram após 30 minutos
// (TTL — Time To Live) sem atividade.
//
// Uso (idêntico ao useState do React):
//   const [target, setTarget] = useTemporaryStorage('scanner_target', '')
//   const [result, setResult] = useTemporaryStorage('scanner_result', null)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// TTL (Time To Live) — tempo máximo de vida dos dados no sessionStorage
// 30 minutos em milissegundos: 30 * 60 * 1000 = 1.800.000 ms
const TTL = 30 * 60 * 1000


export function useTemporaryStorage(key, initialValue) {
  // ── Inicialização do estado ─────────────────────────────────────────────────
  // A função passada ao useState é executada apenas uma vez, na montagem do
  // componente. Tenta carregar o valor guardado no sessionStorage para esta chave.
  const [state, setState] = useState(() => {
    try {
      // Tenta ler o valor guardado para esta chave
      const item = sessionStorage.getItem(key)

      // Se não existir nada guardado, usa o valor inicial fornecido pelo componente
      if (!item) return initialValue

      // Os dados são guardados como JSON com dois campos: value e timestamp
      // Exemplo: { "value": "192.168.1.1", "timestamp": 1714567890123 }
      const { value, timestamp } = JSON.parse(item)

      // Verifica se os dados já expiraram comparando o timestamp com o TTL
      // Date.now() devolve o tempo atual em milissegundos desde o Unix Epoch
      const isExpired = Date.now() - timestamp > TTL

      if (isExpired) {
        // Dados expirados — remove do sessionStorage e usa o valor inicial
        sessionStorage.removeItem(key)
        return initialValue
      }

      // Dados válidos e dentro do TTL — usa o valor guardado
      return value

    } catch {
      // Erro ao ler ou fazer parse do sessionStorage (ex: JSON corrompido)
      // Falha silenciosamente e usa o valor inicial
      return initialValue
    }
  })

  // ── Sincronização com o sessionStorage ─────────────────────────────────────
  // Este useEffect é executado sempre que o estado muda.
  // Guarda o novo valor no sessionStorage com o timestamp atual,
  // o que efetivamente "renova" o TTL sempre que o utilizador interage.
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        value:     state,        // Valor atual do estado
        timestamp: Date.now(),   // Timestamp atual para cálculo de expiração
      }))
    } catch {
      // Ignora erros de escrita (ex: sessionStorage cheio ou em modo privado)
    }
  }, [key, state])
  // A dependência [key, state] garante que o efeito corre quando o estado
  // muda ou quando a chave muda (o que não acontece na prática)

  // Devolve o par [estado, setter] — interface idêntica ao useState do React
  return [state, setState]
}
