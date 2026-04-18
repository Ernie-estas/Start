import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useFxForward } from '../../hooks/useCurrencyData'
import { CURRENCY_META, INTEREST_RATES, calcForwardRate, calcForwardPremiumAnn, fmtRate, fmtPct } from '../../utils/fxUtils'

const TENORS_ORDERED = ['1M', '3M', '6M', '1Y']
const TENOR_T = { '1M': 1/12, '3M': 3/12, '6M': 6/12, '1Y': 1.0 }

function fmtPips(F, S, currency) {
  if (F == null || S == null) return '—'
  const multiplier = (currency === 'JPY' || currency === 'KRW') ? 100 : 10000
  const pips = (F - S) * multiplier
  return (pips >= 0 ? '+' : '') + pips.toFixed(1)
}

export default function ForwardRatePanel({ base }) {
  const currencies = Object.keys(CURRENCY_META).filter(c => c !== base)
  const [quote, setQuote] = useState('EUR')
  const { data, loading, error } = useFxForward(base, quote)

  const [rBase, setRBase] = useState(INTEREST_RATES[base] ?? 5.0)
  const [rQuote, setRQuote] = useState(INTEREST_RATES[quote] ?? 4.0)
  const [spot, setSpot] = useState('')

  const spotVal = data?.spot ?? (spot !== '' ? parseFloat(spot) : null)

  const calcRows = useMemo(() => {
    if (!spotVal) return []
    return TENORS_ORDERED.map(tenor => {
      const T = TENOR_T[tenor]
      const F = calcForwardRate(spotVal, rBase, rQuote, T)
      const prem = calcForwardPremiumAnn(spotVal, F, T)
      return { tenor, T, F, prem }
    })
  }, [spotVal, rBase, rQuote])

  const chartData = calcRows.map(r => ({ tenor: r.tenor, forward: r.F, spot: spotVal }))

  const liveRows = data?.forwards ?? []

  if (error) return (
    <div className="card py-10 text-center text-text-muted text-sm">
      Backend offline — deploy Render API for live forward rate data.
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pair selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-text-muted">Quote Currency:</span>
        <select
          value={quote}
          onChange={e => {
            setQuote(e.target.value)
            setRQuote(INTEREST_RATES[e.target.value] ?? 4.0)
          }}
          className="input-dark text-xs"
        >
          {currencies.map(c => (
            <option key={c} value={c}>{CURRENCY_META[c]?.flag} {c} — {CURRENCY_META[c]?.name}</option>
          ))}
        </select>
        <span className="text-xs text-text-muted ml-4">
          {CURRENCY_META[base]?.flag} {base} / {CURRENCY_META[quote]?.flag} {quote}
        </span>
      </div>

      {/* Live forward table from backend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Live Forward Rates — {base}/{quote}
          {data?.spot && <span className="ml-2 text-text-muted font-normal text-xs">Spot: {fmtRate(data.spot, quote)}</span>}
        </h3>
        {loading ? (
          <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-8 bg-bg-hover rounded animate-pulse"/>)}</div>
        ) : liveRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Tenor', 'Spot', 'Forward Rate', 'Pips', 'Annualized Premium', 'Direction'].map(h => (
                    <th key={h} className="text-left text-text-muted font-medium py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveRows.map(row => {
                  const pipsStr = fmtPips(row.F, data.spot, quote)
                  const isUp = (row.premium_ann ?? 0) > 0
                  return (
                    <tr key={row.tenor} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                      <td className="py-2.5 pr-4 font-bold mono text-text-primary">{row.tenor}</td>
                      <td className="pr-4 mono text-text-muted">{fmtRate(data.spot, quote)}</td>
                      <td className="pr-4 mono font-semibold text-text-primary">{fmtRate(row.F, quote)}</td>
                      <td className={`pr-4 mono ${isUp ? 'stat-up' : 'stat-down'}`}>{pipsStr}</td>
                      <td className={`pr-4 mono font-semibold ${isUp ? 'stat-up' : 'stat-down'}`}>
                        {row.premium_ann != null ? fmtPct(row.premium_ann) : '—'}
                      </td>
                      <td className={`text-[10px] ${isUp ? 'badge-bull' : 'badge-bear'} px-2 py-0.5 rounded-full inline-block`}>
                        {isUp ? 'PREMIUM' : 'DISCOUNT'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-text-muted">No forward data available.</p>
        )}
      </div>

      {/* Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Interactive Forward Calculator</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted block mb-1.5">
                Spot Rate ({base}/{quote}): <span className="mono text-text-primary">{spotVal != null ? fmtRate(spotVal, quote) : '—'}</span>
              </label>
              <input
                type="number"
                step="0.0001"
                placeholder={data?.spot ? `Live: ${fmtRate(data.spot, quote)}` : 'Enter spot rate…'}
                value={spot}
                onChange={e => setSpot(e.target.value)}
                className="input-dark text-xs w-full"
              />
              {data?.spot && !spot && (
                <p className="text-[10px] text-text-muted mt-1">Using live rate. Override above to test scenarios.</p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>{base} Interest Rate</span>
                <span className="mono text-accent-blue font-semibold">{rBase.toFixed(2)}%</span>
              </div>
              <input
                type="range" min="0" max="25" step="0.05"
                value={rBase}
                onChange={e => setRBase(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full bg-bg-hover accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                <span>0%</span><span>25%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>{quote} Interest Rate</span>
                <span className="mono text-accent-amber font-semibold">{rQuote.toFixed(2)}%</span>
              </div>
              <input
                type="range" min="0" max="25" step="0.05"
                value={rQuote}
                onChange={e => setRQuote(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full bg-bg-hover accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                <span>0%</span><span>25%</span>
              </div>
            </div>

            <div className="text-[10px] text-text-muted pt-2 border-t border-border-subtle">
              Formula: F = S × (1 + r<sub>base</sub>×T) / (1 + r<sub>quote</sub>×T) · CIP theorem
            </div>
          </div>
        </div>

        {/* Calculated results table */}
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Calculated Forward Rates</h3>
          {calcRows.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Tenor', 'Forward', 'Pips', 'Ann. Premium'].map(h => (
                    <th key={h} className="text-left text-text-muted font-medium py-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calcRows.map(row => {
                  const isUp = (row.prem ?? 0) > 0
                  return (
                    <tr key={row.tenor} className="border-b border-border-subtle">
                      <td className="py-2.5 pr-3 font-bold mono">{row.tenor}</td>
                      <td className="pr-3 mono text-text-primary">{row.F != null ? fmtRate(row.F, quote) : '—'}</td>
                      <td className={`pr-3 mono ${isUp ? 'stat-up' : 'stat-down'}`}>{fmtPips(row.F, spotVal, quote)}</td>
                      <td className={`mono font-semibold ${isUp ? 'stat-up' : 'stat-down'}`}>{row.prem != null ? fmtPct(row.prem) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-text-muted">Adjust rates above to calculate forward curve.</p>
          )}
        </div>
      </div>

      {/* Forward curve chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h4 className="text-xs font-semibold text-text-primary mb-3">Forward Curve — {base}/{quote}</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis dataKey="tenor" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#4b5563', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => fmtRate(v, quote)}
                domain={['auto', 'auto']}
                width={50}
              />
              <Tooltip
                contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                formatter={(v, name) => [fmtRate(v, quote), name === 'forward' ? 'Forward' : 'Spot']}
              />
              {spotVal && <ReferenceLine y={spotVal} stroke="#4b5563" strokeDasharray="4 4" label={{ value: 'Spot', fill: '#4b5563', fontSize: 10 }} />}
              <Line type="monotone" dataKey="forward" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="forward" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted mt-2">
            Dashed line = spot rate. Curve above spot = base currency at forward premium (higher rates). Curve below = discount.
          </p>
        </div>
      )}
    </div>
  )
}
