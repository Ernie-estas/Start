import { useState, useEffect } from 'react'
import Portfolio from './components/Portfolio'
import ETFExposure from './components/ETFExposure'
import StockResearch from './components/StockResearch'
import MacroIndicators from './components/MacroIndicators'
import MonteCarlo from './components/MonteCarlo'
import TechnicalChart from './components/TechnicalChart'
import CurrencyDashboard from './components/CurrencyDashboard'
import Ticker from './components/Ticker'
import {
  LayoutDashboard, Briefcase, BarChart2, TrendingUp, LineChart,
  Activity, Zap, DollarSign, ChevronRight,
} from 'lucide-react'

const TABS = [
  { id: 'portfolio',   label: 'Portfolio',     icon: Briefcase },
  { id: 'etf',         label: 'ETF Exposure',  icon: LayoutDashboard },
  { id: 'research',    label: 'Research',      icon: BarChart2 },
  { id: 'technical',   label: 'Technical',     icon: LineChart },
  { id: 'macro',       label: 'Macro',         icon: TrendingUp },
  { id: 'montecarlo',  label: 'Monte Carlo',   icon: Activity },
  { id: 'fx',          label: 'FX Arbitrage',  icon: DollarSign },
]

const MARKET_STRIP = [
  { label: 'S&P 500', value: '5,243.77', change: '+0.84%', up: true },
  { label: 'NASDAQ',  value: '18,432',   change: '+1.12%', up: true },
  { label: '10Y UST', value: '4.42%',    change: '-3bp',   up: false },
  { label: 'BTC',     value: '$82,441',  change: '+2.31%', up: true },
  { label: 'DXY',     value: '104.32',   change: '-0.21%', up: false },
  { label: 'GOLD',    value: '$2,331',   change: '+0.54%', up: true },
]

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="mono text-xs text-text-muted tabular-nums">
      {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-secondary/95 backdrop-blur-sm">

        {/* Top bar: logo | market strip | clock */}
        <div className="flex items-center gap-6 px-6 h-12 border-b border-border-subtle/50">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded-md bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center">
              <Zap size={13} className="text-accent-blue" />
            </div>
            <span className="font-bold text-sm tracking-widest text-text-primary">ALPHA</span>
            <span className="font-light text-sm tracking-widest text-text-secondary">TERMINAL</span>
            <span className="text-[10px] text-text-muted mono border border-border-default px-1.5 py-0.5 rounded ml-1">v2.5</span>
          </div>

          {/* Market strip */}
          <div className="flex items-center gap-5 flex-1 overflow-x-auto scrollbar-hide">
            {MARKET_STRIP.map((m, i) => (
              <div key={m.label} className="flex items-center gap-3 flex-shrink-0">
                {i > 0 && <span className="w-px h-3 bg-border-subtle" />}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-text-muted font-medium tracking-wide">{m.label}</span>
                  <span className="mono text-[11px] font-semibold text-text-primary">{m.value}</span>
                  <span className={`text-[10px] font-semibold ${m.up ? 'stat-up' : 'stat-down'}`}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: live + clock */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
              <span className="text-[10px] font-semibold tracking-widest text-accent-green">LIVE</span>
            </div>
            <span className="w-px h-3 bg-border-subtle" />
            <Clock />
          </div>
        </div>

        {/* Ticker tape */}
        <Ticker />

        {/* Tab navigation */}
        <nav className="flex items-center gap-0.5 px-4 h-10">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150 rounded-md ${
                activeTab === id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <Icon size={12} />
              {label}
              {activeTab === id && <ChevronRight size={10} className="opacity-50" />}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Content ── */}
      <main className="px-6 py-6 max-w-[1600px] mx-auto">
        {activeTab === 'portfolio'  && <Portfolio />}
        {activeTab === 'etf'        && <ETFExposure />}
        {activeTab === 'research'   && <StockResearch />}
        {activeTab === 'technical'  && <TechnicalChart />}
        {activeTab === 'macro'      && <MacroIndicators />}
        {activeTab === 'montecarlo' && <MonteCarlo />}
        {activeTab === 'fx'         && <CurrencyDashboard />}
      </main>
    </div>
  )
}
