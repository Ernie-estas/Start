import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function apiFetch(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useETFAnalytics(symbols, period = '2y') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const key = symbols?.join(',') || ''

  const fetch_ = useCallback(() => {
    if (!symbols || symbols.length === 0) return
    setLoading(true)
    setError(null)
    apiFetch(`/etf/analytics?symbols=${symbols.join(',')}&period=${period}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [key, period])

  useEffect(() => { fetch_() }, [fetch_])
  return { data, loading, error, refetch: fetch_ }
}

export function useETFInfo(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!symbol || symbol.length < 1) {
      setData(null); setError(null); setLoading(false)
      return
    }
    setLoading(true)
    setData(null)
    setError(null)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      apiFetch(`/etf/info/${symbol.toUpperCase()}`)
        .then(d => { setData(d); setError(null) })
        .catch(() => setError('Not a valid ETF'))
        .finally(() => setLoading(false))
    }, 500)
    return () => clearTimeout(timerRef.current)
  }, [symbol])

  return { data, loading, error }
}

export function useETFHistory(symbols, period = '1y') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const key = symbols?.join(',') || ''

  useEffect(() => {
    if (!symbols || symbols.length === 0) return
    setLoading(true)
    Promise.all(
      symbols.map(sym =>
        apiFetch(`/history/${sym}?period=${period}`)
          .then(d => ({ symbol: sym, history: d }))
          .catch(() => ({ symbol: sym, history: [] }))
      )
    )
      .then(results => {
        const map = {}
        results.forEach(r => { map[r.symbol] = r.history })
        setData(map)
      })
      .finally(() => setLoading(false))
  }, [key, period])

  return { data, loading }
}
