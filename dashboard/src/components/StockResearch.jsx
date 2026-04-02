import { useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts'
import { Search, TrendingUp, TrendingDown, Users, Star, DollarSign, BarChart2 } from 'lucide-react'

const STOCKS = {
  AAPL: {
    name: 'Apple Inc.', sector: 'Technology', market_cap: '2.82T',
    price: 182.63, change: +1.24, changePct: +0.68,
    pe: 28.4, fwd_pe: 26.1, ps: 7.2, pb: 42.1, ev_ebitda: 21.3,
    roe: 147.2, fcf_yield: 3.8, div_yield: 0.52,
    revenue_growth: 6.1, eps_growth: 11.2, gross_margin: 46.2, net_margin: 25.3,
    description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    analysts: { buy: 28, hold: 12, sell: 4, target: 210.50 },
    insiders: [
      { name: 'Tim Cook', title: 'CEO', type: 'Sale', shares: 511000, value: 92.3, date: '2024-11-15', sentiment: 'neutral' },
      { name: 'Luca Maestri', title: 'CFO', type: 'Sale', shares: 210000, value: 37.8, date: '2024-11-08', sentiment: 'neutral' },
      { name: 'Jeff Williams', title: 'COO', type: 'Purchase', shares: 50000, value: 9.1, date: '2024-10-22', sentiment: 'bull' },
      { name: 'Deirdre O\'Brien', title: 'SVP Retail', type: 'Sale', shares: 125000, value: 22.5, date: '2024-10-14', sentiment: 'neutral' },
    ],
    comps: [
      { name: 'AAPL', pe: 28.4, ps: 7.2, pb: 42.1, ev_ebitda: 21.3, roe: 147.2 },
      { name: 'MSFT', pe: 35.2, ps: 13.4, pb: 14.2, ev_ebitda: 26.8, roe: 38.4 },
      { name: 'GOOGL', pe: 22.1, ps: 6.1, pb: 6.8, ev_ebitda: 16.2, roe: 28.1 },
      { name: 'META', pe: 24.8, ps: 8.7, pb: 8.3, ev_ebitda: 18.4, roe: 35.2 },
      { name: 'AMZN', pe: 41.3, ps: 3.2, pb: 9.1, ev_ebitda: 22.1, roe: 22.8 },
    ],
    price_history: [
      { date: 'Oct', price: 168 }, { date: 'Nov', price: 189 }, { date: 'Dec', price: 192 },
      { date: 'Jan', price: 184 }, { date: 'Feb', price: 176 }, { date: 'Mar', price: 179 }, { date: 'Apr', price: 183 },
    ],
  },
  MSFT: {
    name: 'Microsoft Corporation', sector: 'Technology', market_cap: '3.09T',
    price: 415.32, change: +3.61, changePct: +0.87,
    pe: 35.2, fwd_pe: 30.8, ps: 13.4, pb: 14.2, ev_ebitda: 26.8,
    roe: 38.4, fcf_yield: 2.8, div_yield: 0.72,
    revenue_growth: 15.2, eps_growth: 19.8, gross_margin: 70.1, net_margin: 35.6,
    description: 'Develops and supports software, services, devices, and solutions worldwide including cloud platform Azure.',
    analysts: { buy: 42, hold: 6, sell: 1, target: 480.00 },
    insiders: [
      { name: 'Satya Nadella', title: 'CEO', type: 'Sale', shares: 100000, value: 41.5, date: '2024-11-20', sentiment: 'neutral' },
      { name: 'Amy Hood', title: 'CFO', type: 'Sale', shares: 75000, value: 31.1, date: '2024-11-12', sentiment: 'neutral' },
      { name: 'Brad Smith', title: 'President', type: 'Purchase', shares: 20000, value: 8.3, date: '2024-10-30', sentiment: 'bull' },
    ],
    comps: [
      { name: 'MSFT', pe: 35.2, ps: 13.4, pb: 14.2, ev_ebitda: 26.8, roe: 38.4 },
      { name: 'AAPL', pe: 28.4, ps: 7.2, pb: 42.1, ev_ebitda: 21.3, roe: 147.2 },
      { name: 'GOOGL', pe: 22.1, ps: 6.1, pb: 6.8, ev_ebitda: 16.2, roe: 28.1 },
      { name: 'AMZN', pe: 41.3, ps: 3.2, pb: 9.1, ev_ebitda: 22.1, roe: 22.8 },
      { name: 'CRM', pe: 47.2, ps: 8.8, pb: 5.4, ev_ebitda: 38.1, roe: 10.3 },
    ],
    price_history: [
      { date: 'Oct', price: 375 }, { date: 'Nov', price: 408 }, { date: 'Dec', price: 374 },
      { date: 'Jan', price: 395 }, { date: 'Feb', price: 410 }, { date: 'Mar', price: 421 }, { date: 'Apr', price: 415 },
    ],
  },
  NVDA: {
    name: 'NVIDIA Corporation', sector: 'Technology', market_cap: '2.15T',
    price: 875.42, change: +27.31, changePct: +3.22,
    pe: 62.1, fwd_pe: 34.2, ps: 21.4, pb: 38.2, ev_ebitda: 52.3,
    roe: 91.4, fcf_yield: 1.8, div_yield: 0.03,
    revenue_growth: 122.4, eps_growth: 765.3, gross_margin: 74.6, net_margin: 55.4,
    description: 'Designs and manufactures graphics processing units (GPUs) and system on a chip (SoC) for AI, gaming, and professional visualization.',
    analysts: { buy: 38, hold: 8, sell: 2, target: 1050.00 },
    insiders: [
      { name: 'Jensen Huang', title: 'CEO', type: 'Sale', shares: 600000, value: 524.8, date: '2024-11-18', sentiment: 'neutral' },
      { name: 'Colette Kress', title: 'CFO', type: 'Sale', shares: 80000, value: 70.0, date: '2024-11-10', sentiment: 'neutral' },
      { name: 'Mark Stevens', title: 'Director', type: 'Sale', shares: 50000, value: 43.7, date: '2024-10-28', sentiment: 'neutral' },
    ],
    comps: [
      { name: 'NVDA', pe: 62.1, ps: 21.4, pb: 38.2, ev_ebitda: 52.3, roe: 91.4 },
      { name: 'AMD', pe: 158.2, ps: 9.8, pb: 4.1, ev_ebitda: 78.4, roe: 2.8 },
      { name: 'INTC', pe: null, ps: 1.9, pb: 1.2, ev_ebitda: null, roe: -8.4 },
      { name: 'QCOM', pe: 18.4, ps: 4.8, pb: 6.2, ev_ebitda: 13.8, roe: 38.2 },
      { name: 'AVGO', pe: 26.4, ps: 12.1, pb: 18.4, ev_ebitda: 22.6, roe: 52.1 },
    ],
    price_history: [
      { date: 'Oct', price: 430 }, { date: 'Nov', price: 498 }, { date: 'Dec', price: 495 },
      { date: 'Jan', price: 613 }, { date: 'Feb', price: 788 }, { date: 'Mar', price: 903 }, { date: 'Apr', price: 875 },
    ],
  },
}

function AnalystBar({ buy, hold, sell }) {
  const total = buy + hold + sell
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-10 text-accent-green">BUY</span>
        <div className="flex-1 h-2 bg-border-default rounded-full overflow-hidden">
          <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${(buy / total) * 100}%` }} />
        </div>
        <span className="mono w-6 text-right">{buy}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-10 text-accent-amber">HOLD</span>
        <div className="flex-1 h-2 bg-border-default rounded-full overflow-hidden">
          <div className="h-full bg-accent-amber rounded-full transition-all" style={{ width: `${(hold / total) * 100}%` }} />
        </div>
        <span className="mono w-6 text-right">{hold}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-10 text-accent-red">SELL</span>
        <div className="flex-1 h-2 bg-border-default rounded-full overflow-hidden">
          <div className="h-full bg-accent-red rounded-full transition-all" style={{ width: `${(sell / total) * 100}%` }} />
        </div>
        <span className="mono w-6 text-right">{sell}</span>
      </div>
    </div>
  )
}

export default function StockResearch() {
  const [selected, setSelected] = useState('AAPL')
  const [searchInput, setSearchInput] = useState('')

  const s = STOCKS[selected]

  const handleSearch = (e) => {
    e.preventDefault()
    const sym = searchInput.toUpperCase().trim()
    if (STOCKS[sym]) { setSelected(sym); setSearchInput('') }
  }

  const radarData = [
    { subject: 'Growth', A: Math.min(s.revenue_growth * 2, 100), fullMark: 100 },
    { subject: 'Profitability', A: Math.min(s.net_margin * 2, 100), fullMark: 100 },
    { subject: 'Value', A: Math.max(100 - s.pe, 10), fullMark: 100 },
    { subject: 'Momentum', A: s.changePct > 0 ? 70 : 40, fullMark: 100 },
    { subject: 'Quality', A: Math.min(s.roe / 2, 100), fullMark: 100 },
    { subject: 'Dividend', A: s.div_yield * 20, fullMark: 100 },
  ]

  const upside = (((s.analysts.target - s.price) / s.price) * 100).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & header */}
      <div className="flex items-center gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search symbol… (AAPL, MSFT, NVDA)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="input-dark w-72 pl-8"
            />
          </div>
          <button type="submit" className="btn-primary">Research</button>
        </form>
        <div className="flex gap-2">
          {Object.keys(STOCKS).map(sym => (
            <button
              key={sym}
              onClick={() => setSelected(sym)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors mono ${
                selected === sym ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-default'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Stock header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold mono text-text-primary">{selected}</h2>
              <span className="text-text-muted text-sm">{s.name}</span>
              <span className="text-xs px-2 py-0.5 bg-accent-blue/15 text-accent-blue rounded">{s.sector}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold mono">${s.price.toFixed(2)}</span>
              <span className={`flex items-center gap-1 text-sm font-medium ${s.change >= 0 ? 'stat-up' : 'stat-down'}`}>
                {s.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)} ({s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%)
              </span>
              <span className="text-xs text-text-muted">Mkt Cap: ${s.market_cap}</span>
            </div>
            <p className="text-xs text-text-muted mt-2 max-w-xl">{s.description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Analyst Consensus Target</p>
            <p className="text-2xl font-bold mono text-text-primary">${s.analysts.target.toFixed(2)}</p>
            <p className={`text-sm font-medium mt-0.5 ${upside > 0 ? 'stat-up' : 'stat-down'}`}>
              {upside > 0 ? '+' : ''}{upside}% upside
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Price History (6M)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={s.price_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }} formatter={v => [`$${v}`, 'Price']} />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Valuation Comps */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart2 size={14} className="text-accent-cyan" />
              Valuation Comparables
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {['Company', 'P/E', 'Fwd P/E', 'P/S', 'P/B', 'EV/EBITDA', 'ROE (%)'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.comps.map((c, i) => (
                    <tr key={c.name} className={`border-b border-border-subtle ${c.name === selected ? 'bg-accent-blue/5' : 'hover:bg-bg-hover'} transition-colors`}>
                      <td className={`py-2.5 pr-4 font-bold mono ${c.name === selected ? 'text-accent-blue' : 'text-text-primary'}`}>
                        {c.name} {c.name === selected && '◀'}
                      </td>
                      <td className="pr-4 mono">{c.pe != null ? c.pe.toFixed(1) : 'N/A'}</td>
                      <td className="pr-4 mono text-text-muted">{i === 0 ? s.fwd_pe.toFixed(1) : '—'}</td>
                      <td className="pr-4 mono">{c.ps.toFixed(1)}x</td>
                      <td className="pr-4 mono">{c.pb.toFixed(1)}x</td>
                      <td className="pr-4 mono">{c.ev_ebitda != null ? c.ev_ebitda.toFixed(1) : 'N/A'}</td>
                      <td className={`pr-0 mono font-semibold ${c.roe > 0 ? 'stat-up' : 'stat-down'}`}>{c.roe.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comp bar chart */}
            <div className="mt-4">
              <p className="text-xs text-text-muted mb-2">P/E Multiple Comparison</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={s.comps.filter(c => c.pe != null)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="pe" name="P/E" radius={[3, 3, 0, 0]} barSize={24}>
                    {s.comps.filter(c => c.pe != null).map(c => (
                      <Cell key={c.name} fill={c.name === selected ? '#3b82f6' : '#252836'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insider Activity */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users size={14} className="text-accent-purple" />
              Insider Activity
            </h3>
            <div className="space-y-3">
              {s.insiders.map((ins, i) => (
                <div key={i} className="flex items-center gap-4 text-xs border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    ins.type === 'Purchase' ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'
                  }`}>
                    {ins.type === 'Purchase' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{ins.name}</p>
                    <p className="text-text-muted">{ins.title}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${ins.type === 'Purchase' ? 'stat-up' : 'stat-down'}`}>
                      {ins.type === 'Purchase' ? '+' : '-'}{ins.shares.toLocaleString()} shares
                    </p>
                    <p className="text-text-muted">${ins.value}M</p>
                  </div>
                  <div className="text-right text-text-muted min-w-[80px]">
                    {ins.date}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    ins.sentiment === 'bull' ? 'badge-bull' : ins.sentiment === 'bear' ? 'badge-bear' : 'badge-neutral'
                  }`}>
                    {ins.sentiment.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Key Metrics</h3>
            <div className="space-y-2.5">
              {[
                { label: 'P/E Ratio', value: s.pe.toFixed(1) + 'x' },
                { label: 'Fwd P/E', value: s.fwd_pe.toFixed(1) + 'x' },
                { label: 'P/S Ratio', value: s.ps.toFixed(1) + 'x' },
                { label: 'P/B Ratio', value: s.pb.toFixed(1) + 'x' },
                { label: 'EV/EBITDA', value: s.ev_ebitda.toFixed(1) + 'x' },
                { label: 'ROE', value: s.roe.toFixed(1) + '%', up: true },
                { label: 'FCF Yield', value: s.fcf_yield.toFixed(1) + '%', up: true },
                { label: 'Div Yield', value: s.div_yield.toFixed(2) + '%' },
                { label: 'Rev Growth', value: '+' + s.revenue_growth.toFixed(1) + '%', up: true },
                { label: 'EPS Growth', value: '+' + s.eps_growth.toFixed(1) + '%', up: true },
                { label: 'Gross Margin', value: s.gross_margin.toFixed(1) + '%', up: true },
                { label: 'Net Margin', value: s.net_margin.toFixed(1) + '%', up: true },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                  <span className="text-text-muted">{m.label}</span>
                  <span className={`mono font-semibold ${m.up ? 'stat-up' : 'text-text-primary'}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Ratings */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Star size={14} className="text-accent-amber" />
              Analyst Ratings
            </h3>
            <AnalystBar buy={s.analysts.buy} hold={s.analysts.hold} sell={s.analysts.sell} />
            <div className="mt-3 pt-3 border-t border-border-subtle text-xs flex justify-between">
              <span className="text-text-muted">Consensus: <span className="text-accent-green font-semibold">STRONG BUY</span></span>
              <span className="text-text-muted">{s.analysts.buy + s.analysts.hold + s.analysts.sell} analysts</span>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quality Score</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2130" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name={selected} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
