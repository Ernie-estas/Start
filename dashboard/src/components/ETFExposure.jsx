import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Search, Info, Layers, AlertTriangle } from 'lucide-react'

const ETF_DATA = {
  SPY: {
    name: 'SPDR S&P 500 ETF',
    aum: '504B',
    er: '0.0945%',
    holdings: 503,
    top: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 7.21, sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft', weight: 6.84, sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA', weight: 6.12, sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon', weight: 3.87, sector: 'Consumer Disc.' },
      { symbol: 'META', name: 'Meta Platforms', weight: 2.63, sector: 'Comm. Services' },
      { symbol: 'GOOGL', name: 'Alphabet A', weight: 2.08, sector: 'Comm. Services' },
      { symbol: 'GOOG', name: 'Alphabet C', weight: 1.78, sector: 'Comm. Services' },
      { symbol: 'BRK.B', name: 'Berkshire B', weight: 1.71, sector: 'Financials' },
      { symbol: 'LLY', name: 'Eli Lilly', weight: 1.64, sector: 'Healthcare' },
      { symbol: 'JPM', name: 'JPMorgan', weight: 1.61, sector: 'Financials' },
    ],
    sectors: [
      { name: 'Technology', weight: 29.5 },
      { name: 'Financials', weight: 13.2 },
      { name: 'Healthcare', weight: 12.8 },
      { name: 'Consumer Disc.', weight: 10.7 },
      { name: 'Industrials', weight: 8.5 },
      { name: 'Comm. Services', weight: 8.9 },
      { name: 'Energy', weight: 3.8 },
      { name: 'Real Estate', weight: 2.4 },
      { name: 'Materials', weight: 2.5 },
      { name: 'Utilities', weight: 2.6 },
      { name: 'Consumer Staples', weight: 5.1 },
    ],
  },
  QQQ: {
    name: 'Invesco QQQ Trust',
    aum: '259B',
    er: '0.20%',
    holdings: 101,
    top: [
      { symbol: 'MSFT', name: 'Microsoft', weight: 8.92, sector: 'Technology' },
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 8.43, sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA', weight: 8.21, sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon', weight: 5.14, sector: 'Consumer Disc.' },
      { symbol: 'META', name: 'Meta Platforms', weight: 4.87, sector: 'Comm. Services' },
      { symbol: 'TSLA', name: 'Tesla', weight: 3.42, sector: 'Consumer Disc.' },
      { symbol: 'GOOGL', name: 'Alphabet A', weight: 2.91, sector: 'Comm. Services' },
      { symbol: 'GOOG', name: 'Alphabet C', weight: 2.64, sector: 'Comm. Services' },
      { symbol: 'AVGO', name: 'Broadcom', weight: 2.48, sector: 'Technology' },
      { symbol: 'COST', name: 'Costco', weight: 2.31, sector: 'Consumer Staples' },
    ],
    sectors: [
      { name: 'Technology', weight: 51.2 },
      { name: 'Comm. Services', weight: 15.8 },
      { name: 'Consumer Disc.', weight: 13.4 },
      { name: 'Healthcare', weight: 6.2 },
      { name: 'Industrials', weight: 4.8 },
      { name: 'Consumer Staples', weight: 4.3 },
      { name: 'Financials', weight: 2.4 },
      { name: 'Energy', weight: 0.8 },
      { name: 'Other', weight: 1.1 },
    ],
  },
  VTI: {
    name: 'Vanguard Total Stock Mkt',
    aum: '433B',
    er: '0.03%',
    holdings: 3762,
    top: [
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 5.84, sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft', weight: 5.51, sector: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA', weight: 4.93, sector: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon', weight: 3.12, sector: 'Consumer Disc.' },
      { symbol: 'META', name: 'Meta Platforms', weight: 2.14, sector: 'Comm. Services' },
      { symbol: 'GOOGL', name: 'Alphabet A', weight: 1.68, sector: 'Comm. Services' },
      { symbol: 'TSLA', name: 'Tesla', weight: 1.52, sector: 'Consumer Disc.' },
      { symbol: 'BRK.B', name: 'Berkshire B', weight: 1.38, sector: 'Financials' },
      { symbol: 'LLY', name: 'Eli Lilly', weight: 1.32, sector: 'Healthcare' },
      { symbol: 'JPM', name: 'JPMorgan', weight: 1.29, sector: 'Financials' },
    ],
    sectors: [
      { name: 'Technology', weight: 28.4 },
      { name: 'Financials', weight: 13.8 },
      { name: 'Healthcare', weight: 13.1 },
      { name: 'Consumer Disc.', weight: 10.9 },
      { name: 'Industrials', weight: 9.2 },
      { name: 'Comm. Services', weight: 8.4 },
      { name: 'Energy', weight: 3.6 },
      { name: 'Real Estate', weight: 3.1 },
      { name: 'Materials', weight: 2.8 },
      { name: 'Utilities', weight: 2.7 },
      { name: 'Consumer Staples', weight: 4.0 },
    ],
  },
  XLK: {
    name: 'Technology Select SPDR',
    aum: '68B',
    er: '0.10%',
    holdings: 67,
    top: [
      { symbol: 'NVDA', name: 'NVIDIA', weight: 21.4, sector: 'Technology' },
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 19.8, sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft', weight: 19.3, sector: 'Technology' },
      { symbol: 'AVGO', name: 'Broadcom', weight: 5.12, sector: 'Technology' },
      { symbol: 'CRM', name: 'Salesforce', weight: 3.94, sector: 'Technology' },
      { symbol: 'ORCL', name: 'Oracle', weight: 3.78, sector: 'Technology' },
      { symbol: 'AMD', name: 'AMD', weight: 3.42, sector: 'Technology' },
      { symbol: 'ACN', name: 'Accenture', weight: 3.21, sector: 'Technology' },
      { symbol: 'CSCO', name: 'Cisco', weight: 2.87, sector: 'Technology' },
      { symbol: 'ADBE', name: 'Adobe', weight: 2.54, sector: 'Technology' },
    ],
    sectors: [
      { name: 'Technology', weight: 98.4 },
      { name: 'Other', weight: 1.6 },
    ],
  },
}

const PORTFOLIO_ETFS = [
  { symbol: 'SPY', shares: 50, value: 26219 },
  { symbol: 'QQQ', shares: 30, value: 13478 },
  { symbol: 'VTI', shares: 40, value: 9718 },
]

const SECTOR_COLORS = {
  'Technology': '#3b82f6',
  'Healthcare': '#10b981',
  'Financials': '#f59e0b',
  'Consumer Disc.': '#8b5cf6',
  'Industrials': '#06b6d4',
  'Comm. Services': '#ec4899',
  'Energy': '#ef4444',
  'Real Estate': '#14b8a6',
  'Consumer Staples': '#a78bfa',
  'Materials': '#fb923c',
  'Utilities': '#4ade80',
  'Other': '#94a3b8',
}

const OVERLAP_DATA = [
  { symbol: 'AAPL', etfs: ['SPY', 'QQQ', 'VTI'], risk: 'high' },
  { symbol: 'MSFT', etfs: ['SPY', 'QQQ', 'VTI'], risk: 'high' },
  { symbol: 'NVDA', etfs: ['SPY', 'QQQ', 'VTI'], risk: 'high' },
  { symbol: 'AMZN', etfs: ['SPY', 'QQQ', 'VTI'], risk: 'medium' },
  { symbol: 'GOOGL', etfs: ['SPY', 'QQQ', 'VTI'], risk: 'medium' },
  { symbol: 'META', etfs: ['SPY', 'QQQ'], risk: 'medium' },
  { symbol: 'TSLA', etfs: ['QQQ', 'VTI'], risk: 'low' },
  { symbol: 'JPM', etfs: ['SPY', 'VTI'], risk: 'low' },
]

export default function ETFExposure() {
  const [selected, setSelected] = useState('SPY')
  const [searchQuery, setSearchQuery] = useState('')

  const etf = ETF_DATA[selected]

  const filteredHoldings = etf.top.filter(h =>
    h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Build combined sector exposure from portfolio ETFs
  const combinedSectors = {}
  PORTFOLIO_ETFS.forEach(pe => {
    const etfInfo = ETF_DATA[pe.symbol]
    if (!etfInfo) return
    const weight = pe.value / PORTFOLIO_ETFS.reduce((s, x) => s + x.value, 0)
    etfInfo.sectors.forEach(s => {
      combinedSectors[s.name] = (combinedSectors[s.name] || 0) + s.weight * weight
    })
  })
  const combinedSectorArr = Object.entries(combinedSectors)
    .map(([name, weight]) => ({ name, weight: weight.toFixed(1) * 1 }))
    .sort((a, b) => b.weight - a.weight)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-accent-blue/10 text-accent-blue"><Layers size={18} /></div>
          <div>
            <p className="text-xs text-text-muted">ETFs in Portfolio</p>
            <p className="text-xl font-semibold mono">3</p>
            <p className="text-xs text-text-muted mt-0.5">SPY · QQQ · VTI</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-accent-amber/10 text-accent-amber"><AlertTriangle size={18} /></div>
          <div>
            <p className="text-xs text-text-muted">Overlap Risk</p>
            <p className="text-xl font-semibold mono text-accent-amber">HIGH</p>
            <p className="text-xs text-text-muted mt-0.5">AAPL, MSFT, NVDA duplicated</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-accent-purple/10 text-accent-purple"><Info size={18} /></div>
          <div>
            <p className="text-xs text-text-muted">Effective Holdings</p>
            <p className="text-xl font-semibold mono">~4,200</p>
            <p className="text-xs text-text-muted mt-0.5">Unique underlying stocks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ETF Selector + Holdings */}
        <div className="lg:col-span-2 space-y-4">
          {/* ETF selector */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary">ETF Deep Dive</h3>
              <div className="flex gap-2 ml-auto">
                {Object.keys(ETF_DATA).map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelected(sym)}
                    className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                      selected === sym ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
              <div>
                <p className="text-text-muted">Name</p>
                <p className="text-text-primary font-medium mt-0.5">{etf.name}</p>
              </div>
              <div>
                <p className="text-text-muted">AUM</p>
                <p className="text-text-primary font-semibold mono mt-0.5">${etf.aum}</p>
              </div>
              <div>
                <p className="text-text-muted">Expense Ratio</p>
                <p className="text-accent-green font-semibold mono mt-0.5">{etf.er}</p>
              </div>
              <div>
                <p className="text-text-muted">Holdings</p>
                <p className="text-text-primary font-semibold mono mt-0.5">{etf.holdings.toLocaleString()}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search holdings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-dark w-full pl-8"
              />
            </div>

            {/* Holdings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['#', 'Symbol', 'Name', 'Weight', 'Sector', 'Weight Bar'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHoldings.map((h, i) => (
                    <tr key={h.symbol} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                      <td className="py-2.5 pr-4 text-text-muted">{i + 1}</td>
                      <td className="pr-4 font-bold text-text-primary mono">{h.symbol}</td>
                      <td className="pr-4 text-text-secondary whitespace-nowrap">{h.name}</td>
                      <td className="pr-4 mono font-semibold">{h.weight.toFixed(2)}%</td>
                      <td className="pr-4 text-text-muted whitespace-nowrap">{h.sector}</td>
                      <td className="pr-0 min-w-[100px]">
                        <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-blue rounded-full"
                            style={{ width: `${(h.weight / filteredHoldings[0]?.weight) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overlap Warning */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent-amber" />
              Overlap Analysis — Stocks Held Across Multiple ETFs
            </h3>
            <div className="space-y-2">
              {OVERLAP_DATA.map(o => (
                <div key={o.symbol} className="flex items-center gap-3 text-xs">
                  <span className="font-bold mono w-12 text-text-primary">{o.symbol}</span>
                  <div className="flex gap-1">
                    {o.etfs.map(e => (
                      <span key={e} className="px-1.5 py-0.5 bg-accent-blue/15 text-accent-blue rounded text-[10px] mono">{e}</span>
                    ))}
                  </div>
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    o.risk === 'high' ? 'badge-bear' : o.risk === 'medium' ? 'badge-neutral' : 'badge-bull'
                  }`}>
                    {o.risk.toUpperCase()} OVERLAP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sector charts */}
        <div className="space-y-4">
          {/* ETF Sector Breakdown */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{selected} Sector Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={etf.sectors} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="weight">
                  {etf.sectors.map(s => (
                    <Cell key={s.name} fill={SECTOR_COLORS[s.name] || '#94a3b8'} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => [`${v}%`, 'Weight']}
                  contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {etf.sectors.slice(0, 7).map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: SECTOR_COLORS[s.name] || '#94a3b8' }} />
                  <span className="text-text-secondary flex-1 truncate">{s.name}</span>
                  <span className="mono text-text-muted">{s.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Combined ETF Portfolio Sector Exposure */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Combined ETF Sector Exposure</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={combinedSectorArr.slice(0, 8)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip
                  formatter={v => [`${v}%`, 'Weight']}
                  contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="weight" radius={[0, 3, 3, 0]} barSize={8}>
                  {combinedSectorArr.slice(0, 8).map(s => (
                    <Cell key={s.name} fill={SECTOR_COLORS[s.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
