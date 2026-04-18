import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function apiFetch(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function useAutoRefresh(fetcher, refreshMs) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetch_ = useCallback(() => {
    setLoading(true)
    setError(null)
    fetcher()
      .then(d => { setData(d); setLastUpdated(new Date()); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [fetcher])

  useEffect(() => {
    fetch_()
    if (refreshMs) {
      timerRef.current = setInterval(fetch_, refreshMs)
    }
    return () => clearInterval(timerRef.current)
  }, [fetch_, refreshMs])

  return { data, loading, error, refetch: fetch_, lastUpdated }
}

export function useIntelNews(refreshMs = 300000) {
  const fetcher = useCallback(() => apiFetch('/intelligence/news'), [])
  return useAutoRefresh(fetcher, refreshMs)
}

export function useIntelConflicts(refreshMs = 0) {
  const fetcher = useCallback(() => apiFetch('/intelligence/conflicts'), [])
  return useAutoRefresh(fetcher, refreshMs)
}

export function useIntelCorrelations(refreshMs = 0) {
  const fetcher = useCallback(() => apiFetch('/intelligence/correlations'), [])
  return useAutoRefresh(fetcher, refreshMs)
}

export function useIntelVix(refreshMs = 60000) {
  const fetcher = useCallback(() => apiFetch('/intelligence/vix'), [])
  return useAutoRefresh(fetcher, refreshMs)
}
