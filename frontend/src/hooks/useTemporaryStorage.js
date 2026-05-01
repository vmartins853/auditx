import { useState, useEffect } from 'react'

const TTL = 30 * 60 * 1000 // 30 minutos

export function useTemporaryStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = sessionStorage.getItem(key)
      if (!item) return initialValue

      const { value, timestamp } = JSON.parse(item)
      const isExpired = Date.now() - timestamp > TTL

      if (isExpired) {
        sessionStorage.removeItem(key)
        return initialValue
      }

      return value
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        value: state,
        timestamp: Date.now(),
      }))
    } catch {}
  }, [key, state])

  return [state, setState]
}
