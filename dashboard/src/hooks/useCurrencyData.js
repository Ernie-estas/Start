import { useState, useEffect, useCallback, useRef } from 'react'

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

async function apiFetch(path) {
  const res = await fetch(BASE_URL + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function useAutoRefresh(fetchFn, refreshMs = 30000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(refreshMs / 1000)
  const countdownRef = useRef(refreshMs / 1000)

  const run = useCallback(() => {
    setLoading(true)
    fetchFn()
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => {
        setLoading(false)
        countdownRef.current = refreshMs / 1000
        setCountdown(refreshMs / 1000)
      })
  }, [fetchFn, refreshMs])

  useEffect(() => { run() }, [run])

  useEffect(() => {
    const id = setInterval(run, refreshMs)
    return () => clearInterval(id)
  }, [run, refreshMs])

  useEffect(() => {
    const id = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1)
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return { data, loading, error, refetch: run, countdown }
}

export function useFxRates(base = 'USD', refreshMs = 30000) {
  const fetchFn = useCallback(() => apiFetch(`/fx/rates?base=${base}`), [base])
  return useAutoRefresh(fetchFn, refreshMs)
}

export function useFxHistory(base = 'USD', quote = 'EUR', days = 90) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!base || !quote) return
    setLoading(true)
    setData(null)
    apiFetch(`/fx/history?base=${base}&quote=${quote}&days=${days}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [base, quote, days])

  return { data, loading, error }
}

export function useFxForward(base = 'USD', quote = 'EUR') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!base || !quote || base === quote) return
    setLoading(true)
    setData(null)
    apiFetch(`/fx/forward?base=${base}&quote=${quote}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [base, quote])

  return { data, loading, error }
}

export function useFxArbitrage(base = 'USD', refreshMs = 30000) {
  const fetchFn = useCallback(() => apiFetch(`/fx/arbitrage?base=${base}`), [base])
  return useAutoRefresh(fetchFn, refreshMs)
}

export function useFxPPPAll(base = 'USD') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!base) return
    setLoading(true)
    setData(null)
    apiFetch(`/fx/ppp-all?base=${base}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [base])

  return { data, loading, error }
}
