import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Globe, DollarSign, Activity, Zap } from 'lucide-react'

const MACRO_DATA = {
  fed_funds: {
    label: 'Fed Funds Rate',
    current: '5.33%',
    prev: '5.33%',
    change: '0bp',
    up: false,
    desc: 'Federal Reserve target rate — unchanged since Jul 2023',
    color: '#ef4444',
    history: [
      { date: 'Jan 22', value: 0.08 }, { date: 'Mar 22', value: 0.33 }, { date: 'May 22', value: 0.83 },
      { date: 'Jul 22', value: 2.33 }, { date: 'Sep 22', value: 3.08 }, { date: 'Nov 22', value: 3.83 },
      { date: 'Feb 23', value: 4.58 }, { date: 'May 23', value: 5.08 }, { date: 'Jul 23', value: 5.33 },
      { date: 'Dec 23', value: 5.33 }, { date: 'Mar 24', value: 5.33 }, { date: 'Jul 24', value: 5.33 },
    ],
  },
  cpi: {
    label: 'CPI (YoY)',
    current: '3.2%',
    prev: '3.4%',
    change: '-0.2%',
    up: false,
    desc: 'Consumer Price Index — easing but above 2% target',
    color: '#f59e0b',
    history: [
      { date: 'Jan 22', value: 7.5 }, { date: 'Mar 22', value: 8.5 }, { date: 'Jun 22', value: 9.1 },
      { date: 'Sep 22', value: 8.2 }, { date: 'Dec 22', value: 6.5 }, { date: 'Mar 23', value: 5.0 },
      { date: 'Jun 23', value: 3.0 }, { date: 'Sep 23', value: 3.7 }, { date: 'Dec 23', value: 3.4 },
      { date: 'Mar 24', value: 3.5 }, { date: 'Jun 24', value: 3.0 }, { date: 'Sep 24', value: 2.4 },
      { date: 'Dec 24', value: 2.9 }, { date: 'Mar 25', value: 3.2 },
    ],
    reference: 2.0,
  },
  unemployment: {
    label: 'Unemployment',
    current: '3.9%',
    prev: '3.7%',
    change: '+0.2%',
    up: true,
    desc: 'U-3 unemployment rate — near historical lows',
    color: '#8b5cf6',
    history: [
      { date: 'Jan 21', value: 6.4 }, { date: 'Apr 21', value: 6.0 }, { date: 'Jul 21', value: 5.4 },
      { date: 'Oct 21', value: 4.6 }, { date: 'Jan 22', value: 4.0 }, { date: 'Apr 22', value: 3.6 },
      { date: 'Jul 22', value: 3.5 }, { date: 'Oct 22', value: 3.7 }, { date: 'Jan 23', value: 3.4 },
      { date: 'Apr 23', value: 3.4 }, { date: 'Jul 23', value: 3.5 }, { date: 'Oct 23', value: 3.9 },
      { date: 'Jan 24', value: 3.7 }, { date: 'Apr 24', value: 3.9 },
    ],
  },
  gdp: {
    label: 'GDP Growth (QoQ Ann.)',
    current: '+2.8%',
    prev: '+3.4%',
    change: '-0.6%',
    up: false,
    desc: 'Real GDP annualized growth — resilient consumer spending',
    color: '#10b981',
    history: [
      { date: 'Q1 22', value: -1.6 }, { date: 'Q2 22', value: -0.6 }, { date: 'Q3 22', value: 3.2 },
      { date: 'Q4 22', value: 2.6 }, { date: 'Q1 23', value: 2.2 }, { date: 'Q2 23', value: 2.1 },
      { date: 'Q3 23', value: 4.9 }, { date: 'Q4 23', value: 3.4 }, { date: 'Q1 24', value: 1.6 },
      { date: 'Q2 24', value: 3.0 }, { date: 'Q3 24', value: 2.8 },
    ],
    reference: 0,
  },
  yield_10y: {
    label: '10Y Treasury Yield',
    current: '4.42%',
    prev: '4.45%',
    change: '-3bp',
    up: false,
    desc: 'US 10-year Treasury benchmark yield',
    color: '#3b82f6',
    history: [
      { date: 'Jan 22', value: 1.77 }, { date: 'Apr 22', value: 2.88 }, { date: 'Jul 22', value: 2.97 },
      { date: 'Oct 22', value: 4.08 }, { date: 'Jan 23', value: 3.53 }, { date: 'Apr 23', value: 3.55 },
      { date: 'Jul 23', value: 3.96 }, { date: 'Oct 23', value: 4.93 }, { date: 'Jan 24', value: 4.15 },
      { date: 'Apr 24', value: 4.67 }, { date: 'Jul 24', value: 4.24 }, { date: 'Oct 24', value: 4.28 },
      { date: 'Jan 25', value: 4.62 }, { date: 'Apr 25', value: 4.42 },
    ],
  },
  pce: {
    label: 'Core PCE (YoY)',
    current: '2.8%',
    prev: '2.9%',
    change: '-0.1%',
    up: false,
    desc: "Fed's preferred inflation measure — declining toward 2% target",
    color: '#06b6d4',
    history: [
      { date: 'Jan 22', value: 5.2 }, { date: 'Apr 22', value: 4.9 }, { date: 'Jul 22', value: 4.7 },
      { date: 'Oct 22', value: 4.9 }, { date: 'Jan 23', value: 4.7 }, { date: 'Apr 23', value: 4.4 },
      { date: 'Jul 23', value: 4.2 }, { date: 'Oct 23', value: 3.5 }, { date: 'Jan 24', value: 2.9 },
      { date: 'Apr 24', value: 2.8 }, { date: 'Jul 24', value: 2.6 }, { date: 'Oct 24', value: 2.8 },
    ],
    reference: 2.0,
  },
}

const YIELD_CURVE = [
  { term: '1M', yield: 5.26 },
  { term: '3M', yield: 5.25 },
  { term: '6M', yield: 5.19 },
  { term: '1Y', yield: 5.07 },
  { term: '2Y', yield: 4.72 },
  { term: '3Y', yield: 4.54 },
  { term: '5Y', yield: 4.44 },
  { term: '7Y', yield: 4.42 },
  { term: '10Y', yield: 4.42 },
  { term: '20Y', yield: 4.68 },
  { term: '30Y', yield: 4.57 },
]

const FEAR_GREED = {
  score: 62,
  label: 'GREED',
  components: [
    { name: 'Market Momentum', value: 68, dir: 'greed' },
    { name: 'Stock Price Strength', value: 75, dir: 'greed' },
    { name: 'Stock Price Breadth', value: 58, dir: 'greed' },
    { name: 'Put/Call Ratio', value: 52, dir: 'neutral' },
    { name: 'Market Volatility (VIX)', value: 61, dir: 'greed' },
    { name: 'Safe Haven Demand', value: 48, dir: 'neutral' },
    { name: 'Junk Bond Demand', value: 70, dir: 'greed' },
  ],
}

const GLOBAL = [
  { region: 'US S&P 500', value: '5,243', chg: '+0.84%', up: true },
  { region: 'Euro Stoxx 600', value: '504.2', chg: '+0.42%', up: true },
  { region: 'Nikkei 225', value: '39,821', chg: '+1.14%', up: true },
  { region: 'FTSE 100', value: '8,284', chg: '-0.13%', up: false },
  { region: 'Shanghai Comp.', value: '3,078', chg: '-0.31%', up: false },
  { region: 'Hang Seng', value: '17,284', chg: '+0.78%', up: true },
  { region: 'DAX', value: '18,641', chg: '+0.52%', up: true },
  { region: 'EM Index', value: '1,082', chg: '+1.24%', up: true },
]

function MacroCard({ data }) {
  const isPositive = !data.change.startsWith('+') || data.up === false
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-text-muted">{data.label}</p>
          <p className="text-xl font-bold mono mt-0.5 text-text-primary">{data.current}</p>
          <p className={`text-xs mt-0.5 ${data.up ? 'stat-up' : 'stat-down'}`}>
            {data.change} from prev
          </p>
        </div>
        <div className="w-1.5 h-12 rounded-full" style={{ background: data.color }} />
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data.history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${data.label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={data.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={data.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {data.reference != null && <ReferenceLine y={data.reference} stroke="#4b5563" strokeDasharray="3 3" />}
          <Area type="monotone" dataKey="value" stroke={data.color} fill={`url(#grad-${data.label.replace(/\s/g,'')})`} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-text-muted mt-2">{data.desc}</p>
    </div>
  )
}

export default function MacroIndicators() {
  const fearColor = FEAR_GREED.score > 75 ? '#ef4444' : FEAR_GREED.score > 55 ? '#10b981' : FEAR_GREED.score > 45 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Macro Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(MACRO_DATA).map(d => <MacroCard key={d.label} data={d} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yield Curve */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Activity size={14} className="text-accent-blue" />
              US Treasury Yield Curve
            </h3>
            <span className="text-xs badge-neutral px-2 py-0.5 rounded">PARTIALLY INVERTED</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={YIELD_CURVE} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis dataKey="term" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[4.0, 5.4]} />
              <Tooltip
                contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                formatter={v => [`${v}%`, 'Yield']}
              />
              <Area type="monotone" dataKey="yield" stroke="#3b82f6" fill="url(#yieldGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-3 mt-4 text-xs">
            {[
              { label: '2Y-10Y Spread', value: '-30bp', alert: true },
              { label: '3M-10Y Spread', value: '-83bp', alert: true },
              { label: 'Fed Funds - 10Y', value: '-91bp', alert: true },
              { label: 'Real 10Y Yield', value: '+2.18%', alert: false },
            ].map(item => (
              <div key={item.label} className="bg-bg-secondary rounded-lg p-2.5">
                <p className="text-text-muted text-[10px]">{item.label}</p>
                <p className={`font-semibold mono mt-0.5 ${item.alert ? 'stat-down' : 'stat-up'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Fear & Greed */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap size={14} className="text-accent-amber" />
              CNN Fear & Greed Index
            </h3>
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#1e2130" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="48"
                    fill="none"
                    stroke={fearColor}
                    strokeWidth="12"
                    strokeDasharray={`${(FEAR_GREED.score / 100) * 301.6} 301.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold mono" style={{ color: fearColor }}>{FEAR_GREED.score}</span>
                  <span className="text-xs font-semibold" style={{ color: fearColor }}>{FEAR_GREED.label}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {FEAR_GREED.components.map(c => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted flex-1 truncate">{c.name}</span>
                  <div className="w-16 h-1.5 bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.value}%`,
                        background: c.dir === 'greed' ? '#10b981' : c.dir === 'fear' ? '#ef4444' : '#f59e0b'
                      }}
                    />
                  </div>
                  <span className={`mono text-[10px] w-6 ${c.dir === 'greed' ? 'stat-up' : c.dir === 'fear' ? 'stat-down' : 'text-accent-amber'}`}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Global Markets */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Globe size={14} className="text-accent-cyan" />
              Global Markets
            </h3>
            <div className="space-y-2">
              {GLOBAL.map(m => (
                <div key={m.region} className="flex items-center justify-between text-xs border-b border-border-subtle pb-1.5 last:border-0 last:pb-0">
                  <span className="text-text-secondary">{m.region}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-text-primary">{m.value}</span>
                    <span className={`mono ${m.up ? 'stat-up' : 'stat-down'}`}>{m.chg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Economic Calendar */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <DollarSign size={14} className="text-accent-green" />
          Upcoming Economic Events
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Date', 'Event', 'Actual', 'Forecast', 'Previous', 'Impact'].map(h => (
                  <th key={h} className="text-left text-text-muted font-medium py-2 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: 'Apr 5', event: 'Non-Farm Payrolls', actual: '—', forecast: '215K', prev: '275K', impact: 'HIGH' },
                { date: 'Apr 10', event: 'CPI (YoY)', actual: '—', forecast: '3.1%', prev: '3.2%', impact: 'HIGH' },
                { date: 'Apr 11', event: 'Core CPI (YoY)', actual: '—', forecast: '3.7%', prev: '3.8%', impact: 'HIGH' },
                { date: 'Apr 15', event: 'Retail Sales (MoM)', actual: '—', forecast: '+0.4%', prev: '+0.6%', impact: 'MEDIUM' },
                { date: 'Apr 26', event: 'GDP Advance (Q1)', actual: '—', forecast: '+2.1%', prev: '+3.4%', impact: 'HIGH' },
                { date: 'Apr 30', event: 'Core PCE (YoY)', actual: '—', forecast: '2.7%', prev: '2.8%', impact: 'HIGH' },
                { date: 'May 1', event: 'FOMC Decision', actual: '—', forecast: 'Hold 5.25-5.50%', prev: '5.25-5.50%', impact: 'CRITICAL' },
              ].map(e => (
                <tr key={e.event} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                  <td className="py-2.5 pr-6 mono text-text-muted">{e.date}</td>
                  <td className="pr-6 text-text-primary font-medium">{e.event}</td>
                  <td className="pr-6 mono">{e.actual === '—' ? <span className="text-text-muted">Pending</span> : e.actual}</td>
                  <td className="pr-6 mono text-text-secondary">{e.forecast}</td>
                  <td className="pr-6 mono text-text-muted">{e.prev}</td>
                  <td className="pr-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      e.impact === 'CRITICAL' ? 'bg-accent-red/20 text-accent-red' :
                      e.impact === 'HIGH' ? 'bg-accent-amber/15 text-accent-amber' :
                      'badge-neutral'
                    }`}>
                      {e.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
