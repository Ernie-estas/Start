import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Globe } from 'lucide-react'
import { useFxPPPAll } from '../../hooks/useCurrencyData'
import { CURRENCY_META, INTEREST_RATES, INFLATION_RATES, fmtRate, fmtPct, getValuationColor, signalLabel } from '../../utils/fxUtils'

function SignalIcon({ signal }) {
  if (!signal || signal === 'no_data') return <Minus size={12} className="text-text-muted" />
  if (signal.includes('undervalued')) return <TrendingUp size={12} className="stat-up" />
  if (signal.includes('overvalued')) return <TrendingDown size={12} className="stat-down" />
  return <Minus size={12} className="text-text-secondary" />
}

function SignalBadge({ signal }) {
  const label = signalLabel(signal)
  const cls = signal?.includes('undervalued') ? 'badge-bull'
    : signal?.includes('overvalued') ? 'badge-bear'
    : 'badge-neutral'
  return <span className={`${cls} text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap`}>{label}</span>
}

export default function PPPPanel({ base }) {
  const { data, loading, error } = useFxPPPAll(base)
  const [selected, setSelected] = useState('EUR')
  const [sortKey, setSortKey] = useState('overvaluation_pct')

  const rows = data?.data
    ? [...data.data].sort((a, b) => {
        const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
        return bv - av
      })
    : []

  const detail = rows.find(r => r.quote === selected)

  const chartData = detail ? [
    { label: 'Spot', value: detail.spot },
    { label: 'PPP Fair', value: detail.ppp_rate_1y },
    { label: 'UIP Expected', value: detail.uip_expected_1y },
    { label: 'Blended', value: detail.blended_fair_value },
  ].filter(d => d.value != null) : []

  if (error) return (
    <div className="card py-10 text-center text-text-muted text-sm">
      Backend offline — deploy Render API for live PPP data.
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
        <Globe size={13} />
        <span>PPP = Relative Purchasing Power Parity using current inflation differentials.</span>
        <span className="text-border-default">|</span>
        <span>UIP = Uncovered Interest Rate Parity (expectation theory).</span>
        {data?.date && <span className="ml-auto">ECB rates · {data.date}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary table */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">Fair Value Analysis — All Pairs vs {base}</h3>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="input-dark text-xs ml-auto"
            >
              <option value="overvaluation_pct">Sort: Overvaluation</option>
              <option value="uip_change_pct">Sort: UIP Change</option>
            </select>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({length:10}).map((_,i)=><div key={i} className="h-8 bg-bg-hover rounded animate-pulse"/>)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Currency','Spot','Inflation Δ','PPP Fair (1Y)','Over/Under %','UIP Expected','UIP Δ%','Signal'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium py-2 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const meta = CURRENCY_META[row.quote] || { flag: '🌐', name: row.quote }
                    const inflDiff = (row.pi_base ?? 0) - (row.pi_quote ?? 0)
                    const ovrCls = getValuationColor(row.overvaluation_pct)
                    return (
                      <tr
                        key={row.quote}
                        className={`border-b border-border-subtle cursor-pointer transition-colors ${selected === row.quote ? 'bg-accent-blue/5' : 'hover:bg-bg-hover'}`}
                        onClick={() => setSelected(row.quote)}
                      >
                        <td className="py-2.5 pr-3 font-bold">
                          <span className="mr-1">{meta.flag}</span>
                          <span className="mono text-text-primary">{row.quote}</span>
                        </td>
                        <td className="pr-3 mono">{fmtRate(row.spot, row.quote)}</td>
                        <td className={`pr-3 mono ${inflDiff > 0 ? 'stat-up' : inflDiff < 0 ? 'stat-down' : 'text-text-muted'}`}>
                          {inflDiff != null ? fmtPct(inflDiff) : '—'}
                        </td>
                        <td className="pr-3 mono text-text-secondary">{row.ppp_rate_1y != null ? fmtRate(row.ppp_rate_1y, row.quote) : '—'}</td>
                        <td className={`pr-3 mono font-semibold ${ovrCls}`}>{fmtPct(row.overvaluation_pct)}</td>
                        <td className="pr-3 mono text-text-secondary">{row.uip_expected_1y != null ? fmtRate(row.uip_expected_1y, row.quote) : '—'}</td>
                        <td className={`pr-3 mono ${(row.uip_change_pct ?? 0) > 0 ? 'stat-up' : 'stat-down'}`}>{fmtPct(row.uip_change_pct)}</td>
                        <td><SignalBadge signal={row.signal} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: detail card */}
        <div className="space-y-4">
          {detail && (
            <>
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{CURRENCY_META[detail.quote]?.flag}</span>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mono">{base}/{detail.quote}</h3>
                    <p className="text-[11px] text-text-muted">{CURRENCY_META[detail.quote]?.name}</p>
                  </div>
                  <div className="ml-auto"><SignalIcon signal={detail.signal} /></div>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Spot Rate', value: fmtRate(detail.spot, detail.quote) },
                    { label: 'PPP Fair Value (1Y)', value: detail.ppp_rate_1y != null ? fmtRate(detail.ppp_rate_1y, detail.quote) : '—', highlight: true },
                    { label: 'Overvaluation', value: fmtPct(detail.overvaluation_pct), cls: getValuationColor(detail.overvaluation_pct) },
                    { label: 'UIP Expected (1Y)', value: detail.uip_expected_1y != null ? fmtRate(detail.uip_expected_1y, detail.quote) : '—' },
                    { label: 'UIP Δ (Expected)', value: fmtPct(detail.uip_change_pct), cls: (detail.uip_change_pct ?? 0) > 0 ? 'stat-up' : 'stat-down' },
                    { label: 'Blended Fair Value', value: detail.blended_fair_value != null ? fmtRate(detail.blended_fair_value, detail.quote) : '—' },
                    { label: 'Blended Deviation', value: fmtPct(detail.blended_deviation_pct), cls: getValuationColor(detail.blended_deviation_pct) },
                    { label: `${base} Inflation`, value: detail.pi_base != null ? `${detail.pi_base}%` : '—' },
                    { label: `${detail.quote} Inflation`, value: detail.pi_quote != null ? `${detail.pi_quote}%` : '—' },
                    { label: `${base} Interest Rate`, value: detail.r_base != null ? `${detail.r_base}%` : '—' },
                    { label: `${detail.quote} Interest Rate`, value: detail.r_quote != null ? `${detail.r_quote}%` : '—' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between border-b border-border-subtle pb-1.5 last:border-0">
                      <span className="text-text-muted">{item.label}</span>
                      <span className={`mono font-semibold ${item.cls || 'text-text-primary'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart comparison */}
              {chartData.length > 1 && (
                <div className="card">
                  <h4 className="text-xs font-semibold text-text-primary mb-3">Rate Comparison</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => fmtRate(v, detail.quote)} domain={['auto', 'auto']} width={45} />
                      <Tooltip
                        contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                        formatter={v => [fmtRate(v, detail.quote), 'Rate']}
                      />
                      <ReferenceLine y={detail.spot} stroke="#4b5563" strokeDasharray="3 3" />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {chartData.map((d, i) => (
                          <Bar key={d.label} fill={['#3b82f6','#10b981','#f59e0b','#8b5cf6'][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reference table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Global Rates & Inflation Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Currency', 'Country', 'Central Bank Rate', 'CPI Inflation', 'Real Rate (approx)'].map(h => (
                  <th key={h} className="text-left text-text-muted font-medium py-2 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(INTEREST_RATES).map(([ccy, rate]) => {
                const meta = CURRENCY_META[ccy] || { flag: '🌐', name: ccy }
                const infl = INFLATION_RATES[ccy]
                const real = infl != null ? rate - infl : null
                return (
                  <tr key={ccy} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                    <td className="py-2.5 pr-6 font-bold mono">
                      <span className="mr-1.5">{meta.flag}</span>{ccy}
                    </td>
                    <td className="pr-6 text-text-secondary">{meta.name}</td>
                    <td className={`pr-6 mono font-semibold ${rate > 5 ? 'stat-down' : rate < 1 ? 'stat-up' : 'text-text-primary'}`}>{rate}%</td>
                    <td className={`pr-6 mono ${infl != null ? (infl > 5 ? 'stat-down' : infl < 2 ? 'text-text-muted' : 'text-accent-amber') : 'text-text-muted'}`}>
                      {infl != null ? `${infl}%` : '—'}
                    </td>
                    <td className={`mono ${real != null ? (real > 0 ? 'stat-up' : 'stat-down') : 'text-text-muted'}`}>
                      {real != null ? fmtPct(real) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
