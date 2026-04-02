/**
 * Shared hook for fetching live market data from the FastAPI/yfinance backend.
 * Falls back gracefully to null on network or API errors (e.g. sandbox environments).
 */
import { useState, useEffect, useCallback } from 'react'

const BASE = '/api'

async function apiFetch(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useQuote(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(() => {
    if (!symbol) return
    setLoading(true)
    apiFetch(`/quote/${symbol}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  useEffect(() => { fetch_() }, [fetch_])
  return { data, loading, error, refetch: fetch_ }
}

export function useInfo(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setData(null)
    apiFetch(`/info/${symbol}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading, error }
}

export function useHistory(symbol, period = '6mo') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setData(null)
    apiFetch(`/history/${symbol}?period=${period}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol, period])

  return { data, loading, error }
}

export function useTechnical(symbol, period = '1y') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setData(null)
    apiFetch(`/technical/${symbol}?period=${period}`)
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [symbol, period])

  return { data, loading, error }
}

export function useInsiders(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    apiFetch(`/insiders/${symbol}`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading }
}

export function useAnalystRatings(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    apiFetch(`/analyst-ratings/${symbol}`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading }
}

export function useBatchQuotes(symbols) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(() => {
    if (!symbols || symbols.length === 0) return
    setLoading(true)
    apiFetch(`/quotes?symbols=${symbols.join(',')}`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [symbols?.join(',')])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, loading, refetch: fetch_ }
}
