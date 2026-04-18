import { useState } from 'react'
import Portfolio from './components/Portfolio'
import ETFExposure from './components/ETFExposure'
import StockResearch from './components/StockResearch'
import MacroIndicators from './components/MacroIndicators'
import MonteCarlo from './components/MonteCarlo'
import TechnicalChart from './components/TechnicalChart'
import CurrencyDashboard from './components/CurrencyDashboard'
import Ticker from './components/Ticker'
import {
  LayoutDashboard, Briefcase, BarChart2, TrendingUp, LineChart, Activity, Zap, DollarSign
} from 'lucide-react'

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'etf', label: 'ETF Exposure', icon: LayoutDashboard },
  { id: 'research', label: 'Stock Research', icon: BarChart2 },
  { id: 'technical', label: 'Technical', icon: LineChart },
  { id: 'macro', label: 'Macro', icon: TrendingUp },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Activity },
  { id: 'fx', label: 'FX Arbitrage', icon: DollarSign },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-border-default bg-bg-secondary sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Zap size={18} className="text-accent-blue" />
              <span className="font-semibold text-sm tracking-wider text-text-primary">ALPHA</span>
              <span className="font-light text-sm tracking-wider text-text-secondary">TERMINAL</span>
            </div>
            <div className="w-px h-4 bg-border-default" />
            <span className="text-xs text-text-muted mono">v2.4.1</span>
          </div>

          {/* Live indicators */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-text-muted">LIVE</span>
            </div>
            <span className="text-text-muted mono">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">S&P</span>
              <span className="stat-up font-medium mono">5,243.77</span>
              <span className="stat-up">+0.84%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">NDX</span>
              <span className="stat-up font-medium mono">18,432.15</span>
              <span className="stat-up">+1.12%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">10Y</span>
              <span className="stat-down font-medium mono">4.42%</span>
              <span className="stat-down">-3bp</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">BTC</span>
              <span className="stat-up font-medium mono">$82,441</span>
              <span className="stat-up">+2.31%</span>
            </div>
          </div>
        </div>

        {/* Ticker tape */}
        <Ticker />

        {/* Navigation */}
        <nav className="flex px-6 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-150 border-b-2 -mb-px ${
                activeTab === id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="px-6 py-6 max-w-[1600px] mx-auto">
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'etf' && <ETFExposure />}
        {activeTab === 'research' && <StockResearch />}
        {activeTab === 'technical' && <TechnicalChart />}
        {activeTab === 'macro' && <MacroIndicators />}
        {activeTab === 'montecarlo' && <MonteCarlo />}
        {activeTab === 'fx' && <CurrencyDashboard />}
      </main>
    </div>
  )
}
