import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ETF_BY_SYMBOL } from '../../utils/etfData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

const SCENARIOS = [
  {
    id: 'gfc2008',
    label: 'GFC 2008–2009',
    period: 'Oct 2007 – Mar 2009',
    description: 'Global financial crisis — Lehman Brothers collapse, subprime mortgage meltdown, credit freeze. Equities fell 50%+, financials devastated. Long-duration Treasuries surged as safe haven.',
    color: '#ef4444',
  },
  {
    id: 'covid2020',
    label: 'COVID Crash 2020',
    period: 'Feb 19 – Mar 23, 2020',
    description: 'Fastest 30% decline in market history. Equities fell sharply in 33 days as pandemic lockdowns halted global economies. Fed cut rates to zero; Treasuries and gold served as hedges.',
    color: '#f59e0b',
  },
  {
    id: 'rateShock2022',
    label: 'Rate Shock 2022',
    period: 'Jan – Oct 2022',
    description: 'Fed hiked rates 425bps in 12 months (fastest since 1980s) to combat 9.1% inflation. Both equities AND bonds fell simultaneously — worst year for a 60/40 portfolio in decades. Tech and long-duration bonds hardest hit.',
    color: '#8b5cf6',
  },
]

const MACRO_SHOCKS = [
  { shock: 'Rates +100bps', etfs: { SPY: -8, IVV: -8, VOO: -8, VTI: -8, IWM: -6, QQQ: -12, VIG: -5, SCHD: -4, XLK: -14, XLF: 4, XLV: -3, XLE: 2, XLI: -6, VEA: -7, EEM: -9, AGG: -6, TLT: -16, HYG: -4, GLD: -3, VNQ: -12 } },
  { shock: 'Rates -100bps', etfs: { SPY: 5, IVV: 5, VOO: 5, VTI: 5, IWM: 4, QQQ: 8, VIG: 4, SCHD: 4, XLK: 10, XLF: -3, XLV: 3, XLE: -1, XLI: 4, VEA: 5, EEM: 6, AGG: 6, TLT: 18, HYG: 3, GLD: 4, VNQ: 10 } },
  { shock: 'USD +5%', etfs: { SPY: -1, IVV: -1, VOO: -1, VTI: -1, IWM: 1, QQQ: -2, VIG: -1, SCHD: -1, XLK: -3, XLF: 1, XLV: -1, XLE: -3, XLI: -1, VEA: -6, EEM: -8, AGG: 0, TLT: 0, HYG: -1, GLD: -4, VNQ: -1 } },
  { shock: 'Oil +30%', etfs: { SPY: -2, IVV: -2, VOO: -2, VTI: -2, IWM: -3, QQQ: -4, VIG: -2, SCHD: -1, XLK: -4, XLF: -1, XLV: -1, XLE: 15, XLI: -2, VEA: -3, EEM: 2, AGG: -1, TLT: -2, HYG: -1, GLD: 3, VNQ: -2 } },
]

export default function ScenariosPanel({ selectedETFs }) {
  const [activeScenario, setActiveScenario] = useState('gfc2008')
  const [weights, setWeights] = useState(() => {
    const eq = 100 / selectedETFs.length
    return Object.fromEntries(selectedETFs.map(s => [s, eq]))
  })

  const normWeights = useMemo(() => {
    const total = Object.values(weights).reduce((s, v) => s + v, 0)
    if (!total) return weights
    return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]))
  }, [weights])

  const scenario = SCENARIOS.find(s => s.id === activeScenario)

  const scenarioData = useMemo(() =>
    selectedETFs.map((sym, i) => {
      const meta = ETF_BY_SYMBOL[sym]
      const dd = meta?.stressTests?.[activeScenario]
      return { sym, dd, fill: COLORS[i % COLORS.length] }
    }),
    [selectedETFs, activeScenario])

  const portfolioDD = useMemo(() => {
    let total = 0, validWeight = 0
    selectedETFs.forEach(sym => {
      const dd = ETF_BY_SYMBOL[sym]?.stressTests?.[activeScenario]
      const w = normWeights[sym] || 0
      if (dd != null) { total += dd * w; validWeight += w }
    })
    return validWeight > 0 ? total / validWeight : null
  }, [selectedETFs, activeScenario, normWeights])

  const colorDD = (v) => {
    if (v == null) return 'text-text-muted'
    if (v >= 10) return 'text-accent-green'
    if (v >= 0) return 'text-accent-amber'
    if (v >= -20) return 'text-accent-amber'
    return 'text-accent-red'
  }

  if (!selectedETFs.length) {
    return <div className="card text-center py-12 text-text-muted text-sm">Select ETFs above to view scenario analysis.</div>
  }

  return (
    <div className="space-y-4">
      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className={`text-xs px-4 py-2 rounded font-medium transition-colors cursor-pointer border ${
              activeScenario === s.id
                ? 'text-white border-transparent'
                : 'bg-bg-secondary text-text-muted hover:text-text-secondary border-border-subtle'
            }`}
            style={activeScenario === s.id ? { background: s.color + '99', borderColor: s.color } : {}}
          >{s.label}</button>
        ))}
      </div>

      {/* Scenario description */}
      {scenario && (
        <div className="card border-l-2" style={{ borderLeftColor: scenario.color }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{scenario.label}</h3>
              <p className="text-[10px] text-text-muted mono mt-0.5">{scenario.period}</p>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-2xl">{scenario.description}</p>
            </div>
            {portfolioDD != null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-text-muted">Est. Portfolio Impact</p>
                <p className={`text-2xl font-bold mono ${colorDD(portfolioDD)}`}>{portfolioDD >= 0 ? '+' : ''}{portfolioDD.toFixed(1)}%</p>
                <p className="text-[10px] text-text-muted">equal-weight avg</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawdown bar chart per ETF */}
      <div className="card">
        <h3 className="section-header mb-4">Estimated Peak-to-Trough Drawdown by ETF</h3>
        <ResponsiveContainer width="100%" height={Math.max(120, selectedETFs.length * 36)}>
          <BarChart layout="vertical" data={scenarioData} margin={{ left: 10, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <YAxis dataKey="sym" type="category" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
            <ReferenceLine x={0} stroke="#2a2f45" />
            <Tooltip
              formatter={(v, name) => [v != null ? `${v >= 0 ? '+' : ''}${v}%` : 'N/A', 'Est. Drawdown']}
              contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }}
            />
            <Bar dataKey="dd" radius={[0, 3, 3, 0]} barSize={16}>
              {scenarioData.map((d, i) => (
                <Cell key={d.sym} fill={d.dd != null && d.dd >= 0 ? '#10b981' : COLORS[i % COLORS.length]} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
          Approximate historical drawdowns. Not a forecast. Positive values indicate the ETF gained during the stress period.
        </p>
      </div>

      {/* Macro shock sensitivity grid */}
      <div className="card">
        <h3 className="section-header mb-3">Macro Shock Sensitivity — Estimated Impact (%)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left text-text-muted font-medium py-2 pr-4">Shock Scenario</th>
                {selectedETFs.map(sym => (
                  <th key={sym} className="text-right text-text-muted font-medium py-2 pr-3 mono">{sym}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MACRO_SHOCKS.map(row => (
                <tr key={row.shock} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                  <td className="py-2 pr-4 text-text-secondary">{row.shock}</td>
                  {selectedETFs.map(sym => {
                    const v = row.etfs[sym]
                    return (
                      <td key={sym} className={`pr-3 mono font-semibold text-right ${v == null ? 'text-text-muted' : v >= 5 ? 'text-accent-green' : v >= 0 ? 'text-accent-amber' : v >= -10 ? 'text-accent-amber' : 'text-accent-red'}`}>
                        {v != null ? `${v >= 0 ? '+' : ''}${v}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-text-muted mt-2">Qualitative estimates based on historical factor sensitivities. Not investment advice.</p>
      </div>
    </div>
  )
}
