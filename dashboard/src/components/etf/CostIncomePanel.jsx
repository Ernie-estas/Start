import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { useETFAnalytics } from '../../hooks/useETFData'
import { ETF_BY_SYMBOL } from '../../utils/etfData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

function fmt(v, dp = 2, pre = '', suf = '') {
  if (v == null) return '—'
  return `${pre}${v.toFixed(dp)}${suf}`
}

export default function CostIncomePanel({ selectedETFs }) {
  const { data: analytics, loading } = useETFAnalytics(selectedETFs)
  const [portfolio, setPortfolio] = useState(100000)
  const [costBases, setCostBases] = useState({})

  const analyticsMap = useMemo(() => {
    if (!analytics) return {}
    return Object.fromEntries(analytics.filter(d => !d.error).map(d => [d.symbol, d]))
  }, [analytics])

  // Sorted ER data
  const erData = useMemo(() =>
    [...selectedETFs]
      .map((sym, i) => ({ sym, er: ETF_BY_SYMBOL[sym]?.er ?? null, fill: COLORS[i % COLORS.length] }))
      .filter(d => d.er != null)
      .sort((a, b) => a.er - b.er),
    [selectedETFs])

  const portfolioER = useMemo(() => {
    const equal = 1 / selectedETFs.length
    return selectedETFs.reduce((acc, sym) => {
      const er = ETF_BY_SYMBOL[sym]?.er ?? 0
      return acc + er * equal
    }, 0)
  }, [selectedETFs])

  if (!selectedETFs.length) {
    return <div className="card text-center py-12 text-text-muted text-sm">Select ETFs above to view cost & income.</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense ratio chart */}
        <div className="card">
          <h3 className="section-header mb-3">Expense Ratios (TER)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart layout="vertical" data={erData} margin={{ left: 10, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(3)}%`} />
              <YAxis dataKey="sym" type="category" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={v => [`${(v * 100).toFixed(4)}%`, 'ER']} contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="er" radius={[0, 3, 3, 0]} barSize={14}>
                {erData.map(d => <Cell key={d.sym} fill={d.fill} />)}
                <LabelList dataKey="er" position="right" style={{ fill: '#94a3b8', fontSize: 10 }} formatter={v => `${(v * 100).toFixed(4)}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost drag calculator */}
        <div className="card">
          <h3 className="section-header mb-3">Annual Cost Drag</h3>
          <div className="mb-3">
            <label className="text-xs text-text-muted">Portfolio Size ($)</label>
            <input
              type="number"
              value={portfolio}
              onChange={e => setPortfolio(Number(e.target.value))}
              className="input-dark w-full mt-1 text-sm"
              min={1000} step={1000}
            />
          </div>
          <div className="space-y-2">
            {erData.map((d, i) => (
              <div key={d.sym} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                  <span className="font-bold mono text-text-primary">{d.sym}</span>
                  <span className="text-text-muted">{(d.er * 100).toFixed(4)}%/yr</span>
                </div>
                <span className="mono text-accent-red font-semibold">-${(d.er * portfolio).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
            <div className="border-t border-border-subtle pt-2 flex justify-between text-xs font-semibold">
              <span className="text-text-secondary">Equal-weight avg ER</span>
              <span className="mono text-accent-red">-${(portfolioER * portfolio).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
            </div>
          </div>
          <p className="text-[10px] text-text-muted mt-2">10-year compound drag at avg ER: ${(portfolio * (1 - Math.pow(1 - portfolioER, 10))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Income / dividend table */}
      <div className="card">
        <h3 className="section-header mb-3">Income & Dividends</h3>
        {loading ? (
          <div className="h-20 bg-bg-hover rounded animate-pulse" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted font-medium py-2 pr-4">ETF</th>
                  <th className="text-right text-text-muted font-medium py-2 pr-4">Yield</th>
                  <th className="text-right text-text-muted font-medium py-2 pr-4">Annual Div Rate</th>
                  <th className="text-right text-text-muted font-medium py-2 pr-4">Dist. Frequency</th>
                  <th className="text-right text-text-muted font-medium py-2 pr-4">Post-Tax Yield*</th>
                  <th className="text-right text-text-muted font-medium py-2 pr-4">NAV Premium/Disc</th>
                  <th className="text-right text-text-muted font-medium py-2">Yield on Cost</th>
                </tr>
              </thead>
              <tbody>
                {selectedETFs.map((sym, i) => {
                  const d = analyticsMap[sym]
                  const meta = ETF_BY_SYMBOL[sym]
                  const yield_ = d?.div_yield
                  const postTax = yield_ != null ? yield_ * 0.85 : null
                  const price = d?.price
                  const cb = costBases[sym] || price
                  const yoc = (yield_ != null && cb && price) ? yield_ * price / cb : null
                  const nav = d?.nav
                  const prem = nav && price ? ((price - nav) / nav * 100) : null
                  return (
                    <tr key={sym} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="font-bold mono text-text-primary">{sym}</span>
                        </div>
                      </td>
                      <td className="pr-4 mono font-semibold text-right text-accent-green">
                        {yield_ != null ? `${(yield_ * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="pr-4 mono text-right text-text-secondary">
                        {d?.div_rate != null ? `$${d.div_rate.toFixed(2)}` : '—'}
                      </td>
                      <td className="pr-4 text-right text-text-muted whitespace-nowrap">
                        {meta?.distFreq || '—'}
                      </td>
                      <td className="pr-4 mono text-right text-text-secondary">
                        {postTax != null ? `${(postTax * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="pr-4 mono text-right">
                        {prem != null ? (
                          <span className={prem >= 0 ? 'text-accent-amber' : 'text-accent-green'}>
                            {prem >= 0 ? '+' : ''}{prem.toFixed(2)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            placeholder={price ? price.toFixed(2) : 'Cost basis'}
                            value={costBases[sym] || ''}
                            onChange={e => setCostBases(prev => ({ ...prev, [sym]: Number(e.target.value) }))}
                            className="input-dark text-right text-xs py-0.5 w-20"
                            min={0.01} step={0.01}
                          />
                          <span className="mono text-accent-green text-[10px]">
                            {yoc != null ? `${(yoc * 100).toFixed(2)}%` : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
              *Post-tax yield assumes 15% qualified dividend rate (US). Enter your cost basis to compute yield on cost.
            </p>
          </div>
        )}
      </div>

      {/* Bond ETF info */}
      {selectedETFs.some(sym => ETF_BY_SYMBOL[sym]?.duration != null) && (
        <div className="card">
          <h3 className="section-header mb-3">Fixed Income Details</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedETFs.filter(sym => ETF_BY_SYMBOL[sym]?.duration != null).map(sym => {
              const meta = ETF_BY_SYMBOL[sym]
              return (
                <div key={sym} className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                  <p className="text-xs font-bold mono text-text-primary mb-1">{sym}</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-text-muted">Duration</span><span className="mono text-text-secondary">{meta.duration}Y</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">YTM</span><span className="mono text-accent-green">{meta.ytm}%</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Rate sens.</span><span className="mono text-accent-amber">-{meta.duration.toFixed(1)}% / +1%</span></div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-text-muted mt-2">Duration = approx. % price change per 1% rate move (inverse).</p>
        </div>
      )}
    </div>
  )
}
