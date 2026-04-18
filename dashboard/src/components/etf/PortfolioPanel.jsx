import { useState, useMemo } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import * as Slider from '@radix-ui/react-slider'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ETF_BY_SYMBOL, SECTOR_COLORS } from '../../utils/etfData'

function normalize(weights) {
  const total = Object.values(weights).reduce((s, v) => s + v, 0)
  if (total === 0) return weights
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total * 100]))
}

function computeOverlap(selectedETFs, weights) {
  const holdingMap = {}
  selectedETFs.forEach(sym => {
    const etf = ETF_BY_SYMBOL[sym]
    if (!etf) return
    const w = (weights[sym] || 0) / 100
    etf.topHoldings.forEach(h => {
      if (!holdingMap[h.symbol]) holdingMap[h.symbol] = { symbol: h.symbol, name: h.name, etfs: [], totalExposure: 0 }
      holdingMap[h.symbol].etfs.push(sym)
      holdingMap[h.symbol].totalExposure += h.weight * w
    })
  })
  return Object.values(holdingMap)
    .filter(h => h.etfs.length > 1)
    .sort((a, b) => b.totalExposure - a.totalExposure)
    .slice(0, 12)
}

function computeSectors(selectedETFs, weights) {
  const sectorMap = {}
  selectedETFs.forEach(sym => {
    const etf = ETF_BY_SYMBOL[sym]
    if (!etf) return
    const w = (weights[sym] || 0) / 100
    etf.sectors.forEach(s => {
      sectorMap[s.name] = (sectorMap[s.name] || 0) + s.weight * w
    })
  })
  return Object.entries(sectorMap)
    .map(([name, weight]) => ({ name, weight: parseFloat(weight.toFixed(1)) }))
    .sort((a, b) => b.weight - a.weight)
}

export default function PortfolioPanel({ selectedETFs }) {
  const initWeights = () => {
    const equal = selectedETFs.length ? 100 / selectedETFs.length : 0
    return Object.fromEntries(selectedETFs.map(s => [s, parseFloat(equal.toFixed(1))]))
  }
  const [weights, setWeights] = useState(initWeights)
  const [searchQ, setSearchQ] = useState('')
  const [activeETF, setActiveETF] = useState(selectedETFs[0] || '')

  const normWeights = useMemo(() => normalize(weights), [weights])
  const overlap = useMemo(() => computeOverlap(selectedETFs, normWeights), [selectedETFs, normWeights])
  const sectors = useMemo(() => computeSectors(selectedETFs, normWeights), [selectedETFs, normWeights])

  const portfolioER = useMemo(() => {
    return selectedETFs.reduce((acc, sym) => {
      const etf = ETF_BY_SYMBOL[sym]
      return acc + (etf ? etf.er * (normWeights[sym] || 0) / 100 : 0)
    }, 0)
  }, [selectedETFs, normWeights])

  const activeETFData = ETF_BY_SYMBOL[activeETF]
  const filteredHoldings = activeETFData?.topHoldings.filter(h =>
    h.symbol.toLowerCase().includes(searchQ.toLowerCase()) ||
    h.name.toLowerCase().includes(searchQ.toLowerCase())
  ) || []

  if (selectedETFs.length === 0) {
    return <div className="card text-center py-12 text-text-muted text-sm">Select ETFs above to build a portfolio.</div>
  }

  return (
    <div className="space-y-4">
      {/* Weight sliders + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h3 className="section-header mb-3">Allocation Weights</h3>
          <div className="space-y-4">
            {selectedETFs.map(sym => {
              const etf = ETF_BY_SYMBOL[sym]
              const w = normWeights[sym] || 0
              return (
                <div key={sym}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold mono text-text-primary">{sym}</span>
                      <span className="text-[10px] text-text-muted">{etf?.name}</span>
                    </div>
                    <span className="text-xs font-semibold mono text-accent-blue">{w.toFixed(1)}%</span>
                  </div>
                  <Slider.Root
                    value={[weights[sym] || 0]}
                    onValueChange={([v]) => setWeights(prev => ({ ...prev, [sym]: v }))}
                    min={0} max={100} step={1}
                    className="relative flex items-center w-full h-4 cursor-pointer"
                  >
                    <Slider.Track className="relative h-1 flex-1 bg-border-default rounded-full">
                      <Slider.Range className="absolute h-full bg-accent-blue rounded-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30" />
                  </Slider.Root>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-text-muted">Weighted Avg Expense Ratio</span>
            <span className={`mono font-semibold ${portfolioER <= 0.05 ? 'text-accent-green' : portfolioER <= 0.15 ? 'text-text-primary' : 'text-accent-amber'}`}>
              {(portfolioER * 100).toFixed(4)}% / yr
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-text-muted">Annual cost on $100,000</span>
            <span className="mono text-text-secondary">${(portfolioER * 100000).toFixed(0)}</span>
          </div>
        </div>

        {/* Sector breakdown */}
        <div className="card">
          <h3 className="section-header mb-3">Portfolio Sector Mix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={sectors.slice(0, 8)} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={v => [`${v}%`, 'Weight']} contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="weight" radius={[0, 3, 3, 0]} barSize={8}>
                {sectors.slice(0, 8).map(s => <Cell key={s.name} fill={SECTOR_COLORS[s.name] || '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overlap analysis */}
      {overlap.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-accent-amber" />
            Overlap Analysis — Holdings Shared Across Multiple ETFs
          </h3>
          <div className="space-y-1.5">
            {overlap.map(o => (
              <div key={o.symbol} className="flex items-center gap-3 text-xs">
                <span className="font-bold mono w-12 text-text-primary">{o.symbol}</span>
                <span className="text-text-muted flex-1 truncate">{o.name}</span>
                <div className="flex gap-1">
                  {o.etfs.map(e => (
                    <span key={e} className="px-1.5 py-0.5 bg-accent-blue/15 text-accent-blue rounded text-[10px] mono">{e}</span>
                  ))}
                </div>
                <span className="mono text-text-muted text-[10px] w-16 text-right">{o.totalExposure.toFixed(2)}% combined</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  o.etfs.length >= 3 ? 'badge-bear' : o.etfs.length === 2 ? 'badge-neutral' : 'badge-bull'
                }`}>
                  {o.etfs.length >= 3 ? 'HIGH' : 'MED'} OVERLAP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Holdings deep-dive */}
      {selectedETFs.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="section-header">Top Holdings</h3>
            <div className="flex gap-1.5 ml-auto flex-wrap">
              {selectedETFs.map(sym => (
                <button
                  key={sym}
                  onClick={() => setActiveETF(sym)}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${activeETF === sym ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}`}
                >{sym}</button>
              ))}
            </div>
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input className="input-dark pl-8 text-xs py-1 w-36" placeholder="Search…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>
          </div>
          {activeETFData ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['#', 'Symbol', 'Name', 'Weight', 'Sector', ''].map(h => (
                    <th key={h} className="text-left text-text-muted font-medium py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((h, i) => (
                  <tr key={h.symbol} className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors">
                    <td className="py-2 pr-4 text-text-muted">{i + 1}</td>
                    <td className="pr-4 font-bold mono text-text-primary">{h.symbol}</td>
                    <td className="pr-4 text-text-secondary">{h.name}</td>
                    <td className="pr-4 mono font-semibold">{h.weight.toFixed(2)}%</td>
                    <td className="pr-4 text-text-muted">{h.sector}</td>
                    <td className="min-w-[80px]">
                      <div className="h-1 bg-border-default rounded-full overflow-hidden">
                        <div className="h-full bg-accent-blue rounded-full" style={{ width: `${(h.weight / (filteredHoldings[0]?.weight || 1)) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-text-muted">No holdings data for {activeETF}.</p>
          )}
        </div>
      )}
    </div>
  )
}
