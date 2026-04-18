import { useState, useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { RefreshCw, Grid, BarChart2, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useFxRates, useFxHistory } from '../../hooks/useCurrencyData'
import { CURRENCY_META, fmtRate, fmtPct } from '../../utils/fxUtils'

const SORT_OPTIONS = ['currency', 'rate', 'change']

export default function SpotRatesPanel({ base }) {
  const { data, loading, error, refetch, countdown } = useFxRates(base, 30000)
  const [view, setView] = useState('grid')
  const [sortKey, setSortKey] = useState('currency')
  const [selectedQuote, setSelectedQuote] = useState('EUR')
  const { data: hist } = useFxHistory(base, selectedQuote, 60)

  const entries = useMemo(() => {
    if (!data?.rates) return []
    return Object.entries(data.rates)
      .map(([ccy, v]) => ({ ccy, ...v }))
      .sort((a, b) => {
        if (sortKey === 'currency') return a.ccy.localeCompare(b.ccy)
        if (sortKey === 'rate') return b.rate - a.rate
        if (sortKey === 'change') return (b.change_pct ?? 0) - (a.change_pct ?? 0)
        return 0
      })
  }, [data, sortKey])

  const sparkData = hist ? hist.slice(-20).map(h => ({ v: h.rate })) : []

  if (error) return (
    <div className="card flex items-center gap-3 text-accent-amber py-8 justify-center">
      <span className="text-sm">Could not load rates — backend offline. Deploy Render backend for live data.</span>
      <button className="btn-ghost text-xs" onClick={refetch}>Retry</button>
    </div>
  )

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          {data ? `ECB fixing rates · ${data.date}` : 'Loading…'}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={refetch} disabled={loading}
            className="flex items-center gap-1.5 btn-ghost text-xs">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : `${countdown}s`}
          </button>
          <div className="w-px h-4 bg-border-default" />
          {SORT_OPTIONS.map(k => (
            <button key={k} onClick={() => setSortKey(k)}
              className={`text-xs px-2 py-1 rounded transition-colors ${sortKey === k ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
          <div className="w-px h-4 bg-border-default" />
          <button onClick={() => setView('grid')}
            className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
            <Grid size={13} />
          </button>
          <button onClick={() => setView('heatmap')}
            className={`p-1.5 rounded transition-colors ${view === 'heatmap' ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>
            <BarChart2 size={13} />
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 19 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-24 bg-bg-hover" />
              ))
            : entries.map(({ ccy, rate, change_pct }) => {
                const meta = CURRENCY_META[ccy] || { name: ccy, flag: '🌐' }
                const isUp = (change_pct ?? 0) > 0
                const isDown = (change_pct ?? 0) < 0
                return (
                  <button
                    key={ccy}
                    onClick={() => setSelectedQuote(ccy)}
                    className={`card text-left hover:border-accent-blue/40 transition-colors cursor-pointer ${selectedQuote === ccy ? 'border-accent-blue/50 bg-accent-blue/5' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{meta.flag}</span>
                        <div>
                          <p className="font-bold text-xs text-text-primary mono">{ccy}</p>
                          <p className="text-[10px] text-text-muted truncate max-w-[80px]">{meta.name}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] ${isUp ? 'stat-up' : isDown ? 'stat-down' : 'text-text-muted'}`}>
                        {isUp ? <ArrowUp size={10} className="inline" /> : isDown ? <ArrowDown size={10} className="inline" /> : <Minus size={10} className="inline" />}
                        {change_pct != null ? ` ${Math.abs(change_pct).toFixed(2)}%` : ' —'}
                      </span>
                    </div>
                    <p className={`text-base font-bold mono ${isUp ? 'stat-up' : isDown ? 'stat-down' : 'text-text-primary'}`}>
                      {fmtRate(rate, ccy)}
                    </p>
                    {/* Mini sparkline */}
                    {selectedQuote === ccy && sparkData.length > 3 && (
                      <div className="mt-1 h-8">
                        <ResponsiveContainer width="100%" height={32}>
                          <LineChart data={sparkData}>
                            <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </button>
                )
              })
          }
        </div>
      )}

      {/* Heatmap view */}
      {view === 'heatmap' && (
        <div className="card">
          <p className="text-xs text-text-muted mb-3">24h change intensity — darker = larger move</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {loading
              ? Array.from({ length: 19 }).map((_, i) => <div key={i} className="animate-pulse h-16 rounded-lg bg-bg-hover" />)
              : entries.map(({ ccy, rate, change_pct }) => {
                  const meta = CURRENCY_META[ccy] || { flag: '🌐' }
                  const pct = change_pct ?? 0
                  const intensity = Math.min(Math.abs(pct) / 3, 1)
                  const bg = pct > 0
                    ? `rgba(16,185,129,${0.1 + intensity * 0.55})`
                    : pct < 0
                    ? `rgba(239,68,68,${0.1 + intensity * 0.55})`
                    : 'rgba(148,163,184,0.08)'
                  return (
                    <div key={ccy} className="rounded-lg p-2 text-center transition-all" style={{ background: bg }}>
                      <p className="text-sm">{meta.flag}</p>
                      <p className="text-[10px] font-bold mono text-text-primary">{ccy}</p>
                      <p className="text-[10px] mono text-text-primary">{fmtRate(rate, ccy)}</p>
                      <p className={`text-[10px] mono font-semibold ${pct > 0 ? 'stat-up' : pct < 0 ? 'stat-down' : 'text-text-muted'}`}>
                        {fmtPct(pct)}
                      </p>
                    </div>
                  )
                })
            }
          </div>
        </div>
      )}

      {/* Sparkline card for selected pair */}
      {!loading && sparkData.length > 3 && view === 'grid' && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {base}/{selectedQuote} — 60 Day History
            </h3>
            <span className="text-xs text-text-muted">{CURRENCY_META[base]?.flag} {base} → {CURRENCY_META[selectedQuote]?.flag} {selectedQuote}</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={sparkData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
