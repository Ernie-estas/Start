import { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useETFAnalytics, useETFHistory } from '../../hooks/useETFData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

function fmt(v, dp = 2, suffix = '') {
  if (v == null) return '—'
  return `${v.toFixed(dp)}${suffix}`
}

function corr(a, b) {
  if (!a || !b || a.length < 2 || b.length < 2) return null
  const n = Math.min(a.length, b.length)
  const ax = a.slice(-n), bx = b.slice(-n)
  const ma = ax.reduce((s, v) => s + v, 0) / n
  const mb = bx.reduce((s, v) => s + v, 0) / n
  const num = ax.reduce((s, v, i) => s + (v - ma) * (bx[i] - mb), 0)
  const da = Math.sqrt(ax.reduce((s, v) => s + (v - ma) ** 2, 0))
  const db = Math.sqrt(bx.reduce((s, v) => s + (v - mb) ** 2, 0))
  return da * db < 1e-10 ? null : num / (da * db)
}

function corrColor(v) {
  if (v == null) return '#4b5563'
  const abs = Math.abs(v)
  if (abs > 0.8) return v > 0 ? '#ef4444' : '#3b82f6'
  if (abs > 0.5) return v > 0 ? '#f59e0b' : '#60a5fa'
  return '#10b981'
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-bg-hover rounded animate-pulse" />)}
    </div>
  )
}

export default function RiskPanel({ selectedETFs }) {
  const { data: analytics, loading, error, refetch } = useETFAnalytics(selectedETFs)
  const { data: histories, loading: histLoading } = useETFHistory(selectedETFs, '1y')

  const analyticsMap = useMemo(() => {
    if (!analytics) return {}
    return Object.fromEntries(analytics.filter(d => !d.error).map(d => [d.symbol, d]))
  }, [analytics])

  // Daily returns from history for correlation
  const returnSeries = useMemo(() => {
    if (!histories) return {}
    const map = {}
    selectedETFs.forEach(sym => {
      const hist = histories[sym] || []
      if (hist.length < 2) return
      const rets = []
      for (let i = 1; i < hist.length; i++) {
        const prev = hist[i - 1].close
        const curr = hist[i].close
        if (prev && curr) rets.push((curr - prev) / prev)
      }
      map[sym] = rets
    })
    return map
  }, [histories, selectedETFs])

  const corrMatrix = useMemo(() => {
    const matrix = {}
    selectedETFs.forEach(a => {
      matrix[a] = {}
      selectedETFs.forEach(b => {
        if (a === b) matrix[a][b] = 1
        else matrix[a][b] = corr(returnSeries[a], returnSeries[b])
      })
    })
    return matrix
  }, [returnSeries, selectedETFs])

  // Scatter data: ann_vol vs 1y return
  const scatterData = useMemo(() =>
    selectedETFs.map((sym, i) => {
      const d = analyticsMap[sym]
      return { x: d?.ann_vol, y: d?.['1y'], sym, fill: COLORS[i % COLORS.length] }
    }).filter(d => d.x != null && d.y != null),
    [analyticsMap, selectedETFs])

  if (!selectedETFs.length) {
    return <div className="card text-center py-12 text-text-muted text-sm">Select ETFs above to view risk metrics.</div>
  }

  const riskCols = [
    { key: 'ann_vol', label: 'Ann. Vol', fmt: v => fmt(v, 1, '%') },
    { key: 'beta', label: 'Beta (vs SPY)', fmt: v => fmt(v, 2) },
    { key: 'sharpe', label: 'Sharpe', fmt: v => fmt(v, 2) },
    { key: 'sortino', label: 'Sortino', fmt: v => fmt(v, 2) },
    { key: 'calmar', label: 'Calmar', fmt: v => fmt(v, 2) },
    { key: 'max_drawdown', label: 'Max DD', fmt: v => fmt(v, 1, '%') },
    { key: 'var95', label: 'VaR 95%', fmt: v => fmt(v, 2, '%') },
    { key: 'cvar95', label: 'CVaR 95%', fmt: v => fmt(v, 2, '%') },
  ]

  function riskColor(key, v) {
    if (v == null) return 'text-text-muted'
    if (['sharpe', 'sortino', 'calmar'].includes(key)) {
      return v >= 1 ? 'text-accent-green' : v >= 0 ? 'text-accent-amber' : 'text-accent-red'
    }
    if (['max_drawdown', 'var95', 'cvar95'].includes(key)) {
      return v <= -20 ? 'text-accent-red' : v <= -10 ? 'text-accent-amber' : 'text-text-secondary'
    }
    return 'text-text-secondary'
  }

  return (
    <div className="space-y-4">
      {/* Risk metrics table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-header">Risk Metrics (2Y)</h3>
          <button onClick={refetch} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
        {error && <div className="flex items-center gap-2 text-xs text-accent-red mb-3"><AlertCircle size={13} /> {error}</div>}
        {loading ? <Skeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted font-medium py-2 pr-4">ETF</th>
                  {riskCols.map(c => <th key={c.key} className="text-right text-text-muted font-medium py-2 pr-4 whitespace-nowrap">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {selectedETFs.map((sym, i) => {
                  const d = analyticsMap[sym]
                  return (
                    <tr key={sym} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="font-bold mono text-text-primary">{sym}</span>
                        </div>
                      </td>
                      {riskCols.map(c => (
                        <td key={c.key} className={`pr-4 mono font-semibold text-right ${riskColor(c.key, d?.[c.key])}`}>
                          {c.fmt(d?.[c.key])}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
              Sharpe/Sortino use annualized risk-free rate 5.33%. VaR/CVaR = 1-day historical at 95% confidence.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Correlation matrix */}
        <div className="card">
          <h3 className="section-header mb-3">Correlation Matrix (1Y Daily Returns)</h3>
          {histLoading ? (
            <div className="h-24 bg-bg-hover rounded animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="py-1 pr-3 text-text-muted font-medium text-left w-14"></th>
                    {selectedETFs.map(sym => (
                      <th key={sym} className="py-1 px-2 text-text-muted font-medium text-center mono w-14">{sym}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedETFs.map(a => (
                    <tr key={a}>
                      <td className="py-1 pr-3 font-bold mono text-text-secondary text-left">{a}</td>
                      {selectedETFs.map(b => {
                        const v = corrMatrix[a]?.[b]
                        return (
                          <td key={b} className="py-1 px-2 text-center rounded">
                            <div
                              className="w-12 h-7 flex items-center justify-center rounded text-[10px] font-bold mx-auto"
                              style={{ background: `${corrColor(v)}22`, color: corrColor(v) }}
                            >
                              {v != null ? v.toFixed(2) : '—'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-text-muted mt-2">Green = low corr, Amber = moderate, Red = high</p>
        </div>

        {/* Risk/Return scatter */}
        <div className="card">
          <h3 className="section-header mb-3">Risk / Return (1Y Return vs Ann. Volatility)</h3>
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                <XAxis dataKey="x" type="number" name="Volatility" tickFormatter={v => `${v}%`} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Ann. Vol', position: 'insideBottom', fill: '#4b5563', fontSize: 10, offset: -4 }} />
                <YAxis dataKey="y" type="number" name="1Y Return" tickFormatter={v => `${v}%`} tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReferenceLine y={0} stroke="#2a2f45" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#2a2f45' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="custom-tooltip text-xs">
                        <p className="font-bold text-text-primary">{d.sym}</p>
                        <p className="text-text-muted">Vol: {d.x?.toFixed(1)}% | 1Y: {d.y >= 0 ? '+' : ''}{d.y?.toFixed(1)}%</p>
                      </div>
                    )
                  }}
                />
                {scatterData.map((d, i) => (
                  <Scatter key={d.sym} data={[d]} fill={d.fill} name={d.sym}>
                    <LabelList dataKey="sym" position="top" style={{ fill: d.fill, fontSize: 10, fontWeight: 600 }} />
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-text-muted py-8 text-center">No data available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
