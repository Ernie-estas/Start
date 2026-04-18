import { useState } from 'react'
import { RefreshCw, AlertTriangle, TrendingUp, Filter } from 'lucide-react'
import { useFxArbitrage } from '../../hooks/useCurrencyData'
import { CURRENCY_META, fmtRate, fmtPct, getSignalColor } from '../../utils/fxUtils'

function SignalBadge({ signal }) {
  if (signal === 'signal') return <span className="badge-bull text-[10px] px-2 py-0.5 rounded-full font-semibold">SIGNAL</span>
  if (signal === 'watch') return <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full font-semibold">WATCH</span>
  return <span className="text-[10px] text-text-muted px-2 py-0.5">—</span>
}

function TenorCell({ data }) {
  if (!data) return <td className="py-2.5 pr-3 text-text-muted">—</td>
  const cls = getSignalColor(data.deviation)
  return (
    <td className="py-2.5 pr-3">
      <p className={`mono text-xs font-medium ${cls}`}>{fmtRate(data.F)}</p>
      <p className={`text-[10px] ${cls}`}>{data.deviation >= 0 ? '+' : ''}{data.deviation?.toFixed(3)}%</p>
    </td>
  )
}

export default function ArbitrageScanner({ base }) {
  const { data, loading, error, refetch, countdown } = useFxArbitrage(base, 30000)
  const [onlyOpportunities, setOnlyOpportunities] = useState(false)
  const [onlyProfitable, setOnlyProfitable] = useState(false)

  const cipRows = data?.cip_table
    ? (onlyOpportunities ? data.cip_table.filter(r => r.signal !== 'neutral') : data.cip_table)
    : []

  const triRows = data?.triangular
    ? (onlyProfitable ? data.triangular.filter(r => r.profitable) : data.triangular.slice(0, 30))
    : []

  if (error) return (
    <div className="card py-10 text-center text-text-muted text-sm">
      Backend offline — deploy Render API for live arbitrage data.
      <button className="btn-ghost text-xs ml-3" onClick={refetch}>Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          {data ? `ECB fixing · ${data.date}` : 'Loading…'}
        </div>
        <button onClick={refetch} disabled={loading} className="btn-ghost text-xs flex items-center gap-1.5 ml-auto">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : `${countdown}s`}
        </button>
      </div>

      {/* Top opportunities strip */}
      {data?.top_opportunities?.length > 0 && (
        <div className="card border-accent-green/30">
          <h3 className="text-sm font-semibold text-accent-green mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Top Triangular Opportunities
          </h3>
          <div className="flex gap-3 flex-wrap">
            {data.top_opportunities.map(o => (
              <div key={o.path} className="bg-accent-green/10 border border-accent-green/20 rounded-lg px-3 py-2 text-xs">
                <p className="font-semibold mono text-text-primary">
                  {o.currencies.map(c => CURRENCY_META[c]?.flag || '').join(' → ')} {o.path}
                </p>
                <p className="stat-up font-bold mono">Net: +{(o.net_profit_pct * 100).toFixed(3)} bps</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section A: CIP Deviation Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle size={14} className="text-accent-amber" />
            Covered Interest Rate Parity (CIP) Deviations
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={onlyOpportunities} onChange={e => setOnlyOpportunities(e.target.checked)} className="accent-blue-500" />
            <Filter size={11} /> Signals only
          </label>
        </div>
        <p className="text-[10px] text-text-muted mb-3">
          Forward rate = Spot × (1 + r_base × T) / (1 + r_quote × T). Deviation = simple vs continuous compounding CIP. &gt;0.1% = arbitrage signal.
        </p>
        {loading ? (
          <div className="space-y-2">{Array.from({length:8}).map((_,i)=><div key={i} className="h-8 bg-bg-hover rounded animate-pulse"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted font-medium py-2 pr-3">Pair</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">Spot</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">Rate Diff</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">1M Fwd (dev%)</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">3M Fwd (dev%)</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">6M Fwd (dev%)</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">1Y Fwd (dev%)</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-3">Max Dev</th>
                  <th className="text-left text-text-muted font-medium py-2">Signal</th>
                </tr>
              </thead>
              <tbody>
                {cipRows.map(row => (
                  <tr key={row.quote} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                    <td className="py-2.5 pr-3 font-bold mono">
                      {CURRENCY_META[row.quote]?.flag} {base}/{row.quote}
                    </td>
                    <td className="pr-3 mono">{fmtRate(row.spot, row.quote)}</td>
                    <td className={`pr-3 mono font-semibold ${row.rate_diff > 0 ? 'stat-up' : row.rate_diff < 0 ? 'stat-down' : 'text-text-muted'}`}>
                      {fmtPct(row.rate_diff)}
                    </td>
                    <TenorCell data={row.tenors?.['1M']} />
                    <TenorCell data={row.tenors?.['3M']} />
                    <TenorCell data={row.tenors?.['6M']} />
                    <TenorCell data={row.tenors?.['1Y']} />
                    <td className={`pr-3 mono font-semibold ${getSignalColor(row.max_deviation)}`}>
                      {row.max_deviation >= 0 ? '+' : ''}{row.max_deviation?.toFixed(4)}%
                    </td>
                    <td><SignalBadge signal={row.signal} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section B: Triangular Arbitrage */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp size={14} className="text-accent-purple" />
            Triangular Arbitrage Scanner
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={onlyProfitable} onChange={e => setOnlyProfitable(e.target.checked)} className="accent-blue-500" />
            Profitable only
          </label>
        </div>
        <p className="text-[10px] text-text-muted mb-3">
          Round-trip: {base} → A → B → {base}. Gross profit includes synthetic timing noise (0–3 bps). Net = gross − bid/ask spread costs. All rates from ECB single source — real opportunities require multi-venue data.
        </p>
        {loading ? (
          <div className="space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-8 bg-bg-hover rounded animate-pulse"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted font-medium py-2 pr-4">Path</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-4">Gross Profit</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-4">Spread Cost</th>
                  <th className="text-left text-text-muted font-medium py-2 pr-4">Net Profit</th>
                  <th className="text-left text-text-muted font-medium py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {triRows.map(row => (
                  <tr key={row.path} className={`border-b border-border-subtle transition-colors ${row.profitable ? 'bg-accent-green/5 hover:bg-accent-green/10' : 'hover:bg-bg-hover'}`}>
                    <td className="py-2.5 pr-4 mono">
                      {row.currencies.map(c => CURRENCY_META[c]?.flag || '').join(' → ')}
                      {' '}<span className="text-text-muted">{row.path}</span>
                    </td>
                    <td className="pr-4 mono">{(row.gross_profit_pct * 100).toFixed(3)} bps</td>
                    <td className="pr-4 mono text-text-muted">{(row.spread_cost_pct * 100).toFixed(1)} bps</td>
                    <td className={`pr-4 mono font-semibold ${row.net_profit_pct > 0 ? 'stat-up' : 'text-text-muted'}`}>
                      {row.net_profit_pct > 0 ? '+' : ''}{(row.net_profit_pct * 100).toFixed(3)} bps
                    </td>
                    <td>
                      {row.profitable
                        ? <span className="badge-bull text-[10px] px-2 py-0.5 rounded-full">PROFIT</span>
                        : <span className="text-text-muted text-[10px]">Cost &gt; Spread</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
