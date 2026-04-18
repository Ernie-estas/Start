import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useETFAnalytics } from '../../hooks/useETFData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

function fmtPct(v) {
  if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function colorClass(v) {
  if (v == null) return 'text-text-muted'
  return v >= 0 ? 'text-accent-green' : 'text-accent-red'
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-8 bg-bg-hover rounded animate-pulse" />
      ))}
    </div>
  )
}

export default function PerformancePanel({ selectedETFs }) {
  const { data, loading, error, refetch } = useETFAnalytics(selectedETFs)

  const analyticsMap = useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.filter(d => !d.error).map(d => [d.symbol, d]))
  }, [data])

  const returnPeriods = ['ytd', '1y', '3y', '5y']
  const periodLabels = { ytd: 'YTD', '1y': '1 Year', '3y': '3 Year', '5y': '5 Year' }

  // Grouped bar chart data
  const groupedData = useMemo(() => {
    return returnPeriods.map(p => {
      const entry = { period: periodLabels[p] }
      selectedETFs.forEach(sym => {
        const d = analyticsMap[sym]
        entry[sym] = d ? d[p] : null
      })
      return entry
    })
  }, [analyticsMap, selectedETFs])

  // Drawdown bar data
  const drawdownData = useMemo(() => {
    return selectedETFs.map((sym, i) => ({
      symbol: sym,
      max_drawdown: analyticsMap[sym]?.max_drawdown ?? null,
      fill: COLORS[i % COLORS.length],
    }))
  }, [analyticsMap, selectedETFs])

  if (!selectedETFs.length) {
    return <div className="card text-center py-12 text-text-muted text-sm">Select ETFs above to view performance.</div>
  }

  return (
    <div className="space-y-4">
      {/* Returns table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-header">Period Returns</h3>
          <button onClick={refetch} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-accent-red mb-3">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {loading ? <Skeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted font-medium py-2 pr-4">ETF</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-4">Price</th>
                  {returnPeriods.map(p => (
                    <th key={p} className="text-right text-text-muted font-medium py-2 pr-4">{periodLabels[p]}</th>
                  ))}
                  <th className="text-right text-text-muted font-medium py-2 pr-4">Ann. Vol</th>
                  <th className="text-right text-text-muted font-medium py-2">Max DD</th>
                </tr>
              </thead>
              <tbody>
                {selectedETFs.map((sym, i) => {
                  const d = analyticsMap[sym]
                  return (
                    <tr key={sym} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="font-bold mono text-text-primary">{sym}</span>
                        </div>
                      </td>
                      <td className="pr-4 mono text-text-secondary">{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</td>
                      {returnPeriods.map(p => (
                        <td key={p} className={`pr-4 mono font-semibold text-right ${colorClass(d?.[p])}`}>
                          {fmtPct(d?.[p])}
                        </td>
                      ))}
                      <td className="pr-4 mono text-right text-text-secondary">{d?.ann_vol != null ? `${d.ann_vol.toFixed(1)}%` : '—'}</td>
                      <td className={`mono font-semibold text-right ${colorClass(d?.max_drawdown)}`}>
                        {d?.max_drawdown != null ? `${d.max_drawdown.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grouped returns bar chart */}
      {!loading && data && (
        <div className="card">
          <h3 className="section-header mb-4">Returns Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={groupedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <ReferenceLine y={0} stroke="#2a2f45" />
              <Tooltip
                formatter={(v, name) => [v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '—', name]}
                contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }}
              />
              {selectedETFs.map((sym, i) => (
                <Bar key={sym} dataKey={sym} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} barSize={16} opacity={0.85} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Max drawdown chart */}
      {!loading && data && (
        <div className="card">
          <h3 className="section-header mb-4">Maximum Drawdown (2Y)</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart layout="vertical" data={drawdownData} margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={['auto', 0]} />
              <YAxis dataKey="symbol" type="category" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={v => [`${v?.toFixed(2)}%`, 'Max Drawdown']} contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }} />
              <ReferenceLine x={0} stroke="#2a2f45" />
              <Bar dataKey="max_drawdown" radius={[0, 3, 3, 0]} barSize={14}>
                {drawdownData.map((d, i) => <Cell key={d.symbol} fill={COLORS[i % COLORS.length]} opacity={0.75} />)}
                <LabelList dataKey="max_drawdown" position="right" style={{ fill: '#94a3b8', fontSize: 10 }} formatter={v => v != null ? `${v.toFixed(1)}%` : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted mt-1">Based on 2-year price history. Drawdown = peak-to-trough decline.</p>
        </div>
      )}
    </div>
  )
}
