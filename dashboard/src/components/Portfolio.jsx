import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Upload, TrendingUp, TrendingDown, DollarSign, BarChart2, AlertCircle, FileText } from 'lucide-react'
import Papa from 'papaparse'

const SECTOR_COLORS = {
  'Technology': '#3b82f6',
  'Healthcare': '#10b981',
  'Financials': '#f59e0b',
  'Consumer Discretionary': '#8b5cf6',
  'Industrials': '#06b6d4',
  'Communication Services': '#ec4899',
  'Energy': '#ef4444',
  'Real Estate': '#14b8a6',
  'Consumer Staples': '#a78bfa',
  'Materials': '#fb923c',
  'Utilities': '#4ade80',
  'Other': '#94a3b8',
}

const DEMO_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 150, price: 182.63, sector: 'Technology', cost: 142.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 80, price: 415.32, sector: 'Technology', cost: 310.00 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', shares: 60, price: 875.42, sector: 'Technology', cost: 450.00 },
  { symbol: 'JPM', name: 'JPMorgan Chase', shares: 120, price: 218.54, sector: 'Financials', cost: 180.00 },
  { symbol: 'UNH', name: 'UnitedHealth Group', shares: 40, price: 521.63, sector: 'Healthcare', cost: 480.00 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 90, price: 196.45, sector: 'Consumer Discretionary', cost: 160.00 },
  { symbol: 'V', name: 'Visa Inc.', shares: 100, price: 276.84, sector: 'Financials', cost: 240.00 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', shares: 130, price: 112.35, sector: 'Energy', cost: 95.00 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 75, price: 172.18, sector: 'Communication Services', cost: 140.00 },
  { symbol: 'META', name: 'Meta Platforms', shares: 55, price: 508.23, sector: 'Communication Services', cost: 380.00 },
  { symbol: 'PLD', name: 'Prologis Inc.', shares: 70, price: 118.45, sector: 'Real Estate', cost: 125.00 },
  { symbol: 'LIN', name: 'Linde PLC', shares: 45, price: 442.18, sector: 'Materials', cost: 380.00 },
]

const PERF_HISTORY = [
  { date: 'Oct', value: 180000 },
  { date: 'Nov', value: 192000 },
  { date: 'Dec', value: 187000 },
  { date: 'Jan', value: 203000 },
  { date: 'Feb', value: 198000 },
  { date: 'Mar', value: 217000 },
  { date: 'Apr', value: 224831 },
]

const CSV_TEMPLATE = `symbol,shares,cost
AAPL,100,150.00
MSFT,50,300.00
NVDA,30,500.00`

function StatCard({ label, value, sub, up, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'text-accent-blue bg-accent-blue/10',
    green: 'text-accent-green bg-accent-green/10',
    red: 'text-accent-red bg-accent-red/10',
    amber: 'text-accent-amber bg-accent-amber/10',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <p className="text-xl font-semibold mono text-text-primary">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 ${up === true ? 'stat-up' : up === false ? 'stat-down' : 'text-text-muted'}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-text-muted mb-1">{label}</p>
        <p className="text-text-primary font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState(DEMO_HOLDINGS)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const totalValue = holdings.reduce((s, h) => s + h.shares * h.price, 0)
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.cost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = ((totalGain / totalCost) * 100).toFixed(2)

  const sectorData = Object.entries(
    holdings.reduce((acc, h) => {
      const val = h.shares * h.price
      acc[h.sector] = (acc[h.sector] || 0) + val
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value, pct: ((value / totalValue) * 100).toFixed(1) }))
    .sort((a, b) => b.value - a.value)

  const parseCSV = useCallback((file) => {
    setError('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const parsed = data.map((row) => {
            const sym = (row.symbol || row.Symbol || row.ticker || row.Ticker || '').toUpperCase().trim()
            const shares = parseFloat(row.shares || row.Shares || row.qty || row.Qty || 0)
            const cost = parseFloat(row.cost || row.Cost || row['avg_cost'] || row['Avg Cost'] || 0)
            if (!sym || isNaN(shares)) throw new Error(`Invalid row: ${JSON.stringify(row)}`)
            // Map to mock price data
            const demo = DEMO_HOLDINGS.find(d => d.symbol === sym)
            return {
              symbol: sym,
              name: demo?.name || sym,
              shares,
              price: demo?.price || cost * 1.15,
              sector: demo?.sector || 'Other',
              cost: cost || (demo?.cost || 0),
            }
          })
          setHoldings(parsed)
        } catch (e) {
          setError('Could not parse CSV. Check format: symbol, shares, cost')
        }
      },
      error: () => setError('Failed to read file.'),
    })
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) parseCSV(file)
    else setError('Please upload a .csv file')
  }, [parseCSV])

  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) parseCSV(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'portfolio_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${holdings.length} positions`} icon={DollarSign} color="blue" />
        <StatCard label="Total Return" value={`$${totalGain.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub={`${totalGainPct > 0 ? '+' : ''}${totalGainPct}% all time`} up={totalGain > 0} icon={TrendingUp} color={totalGain >= 0 ? 'green' : 'red'} />
        <StatCard label="Day P&L" value="+$1,847.23" sub="+0.82% today" up={true} icon={BarChart2} color="green" />
        <StatCard label="Beta" value="1.14" sub="vs S&P 500" icon={AlertCircle} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload + Performance Chart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload */}
          <div
            className={`card border-2 border-dashed transition-colors duration-200 cursor-pointer ${dragging ? 'border-accent-blue bg-accent-blue/5' : 'border-border-default hover:border-border-bright'}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('csv-input').click()}
          >
            <div className="flex items-center gap-4 py-2">
              <div className="p-3 rounded-xl bg-accent-blue/10">
                <Upload size={20} className="text-accent-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Upload Portfolio CSV</p>
                <p className="text-xs text-text-muted mt-0.5">Drag & drop or click — columns: symbol, shares, cost</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                className="btn-ghost flex items-center gap-1.5"
              >
                <FileText size={13} />
                Template
              </button>
            </div>
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onFileChange} />
          </div>
          {error && <p className="text-accent-red text-xs flex items-center gap-1"><AlertCircle size={12} />{error}</p>}

          {/* Performance Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Portfolio Performance</h3>
              <div className="flex gap-2">
                {['1M', '3M', '6M', 'YTD', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`text-xs px-2 py-1 rounded transition-colors ${t === '6M' ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={PERF_HISTORY} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#perfGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings Table */}
          <div className="card overflow-hidden">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Symbol', 'Name', 'Shares', 'Price', 'Value', 'Cost Basis', 'P&L', 'P&L %', 'Sector'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium py-2 pr-4 first:pl-0 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const val = h.shares * h.price
                    const cost = h.shares * h.cost
                    const pl = val - cost
                    const plPct = ((pl / cost) * 100).toFixed(2)
                    return (
                      <tr key={h.symbol} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                        <td className="py-2.5 pr-4 font-semibold text-text-primary mono">{h.symbol}</td>
                        <td className="pr-4 text-text-secondary whitespace-nowrap">{h.name}</td>
                        <td className="pr-4 mono">{h.shares.toLocaleString()}</td>
                        <td className="pr-4 mono">${h.price.toFixed(2)}</td>
                        <td className="pr-4 mono font-medium">${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        <td className="pr-4 mono text-text-muted">${h.cost.toFixed(2)}</td>
                        <td className={`pr-4 mono ${pl >= 0 ? 'stat-up' : 'stat-down'}`}>{pl >= 0 ? '+' : ''}${pl.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        <td className={`pr-4 mono ${pl >= 0 ? 'stat-up' : 'stat-down'}`}>{plPct > 0 ? '+' : ''}{plPct}%</td>
                        <td className="pr-0 text-text-muted">{h.sector}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sector Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry) => (
                    <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] || '#94a3b8'} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Value']}
                  contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {sectorData.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: SECTOR_COLORS[s.name] || '#94a3b8' }} />
                  <span className="text-text-secondary flex-1 truncate">{s.name}</span>
                  <span className="mono text-text-muted">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Bar */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Sector Weight vs S&P 500</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={sectorData.slice(0, 6).map(s => ({
                  name: s.name.split(' ')[0],
                  portfolio: parseFloat(s.pct),
                  sp500: (Math.random() * 15 + 5).toFixed(1) * 1,
                }))}
                margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="portfolio" name="Portfolio" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={8} />
                <Bar dataKey="sp500" name="S&P 500" fill="#252836" radius={[0, 3, 3, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
