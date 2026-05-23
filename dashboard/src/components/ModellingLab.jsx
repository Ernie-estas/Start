import { useState } from 'react'
import GBMSimulator from './lab/GBMSimulator'
import HestonSimulator from './lab/HestonSimulator'
import MCConvergence from './lab/MCConvergence'
import BlackScholesDashboard from './lab/BlackScholesDashboard'
import ImpliedVolSolver from './lab/ImpliedVolSolver'
import EfficientFrontier from './lab/EfficientFrontier'
import BondPricer from './lab/BondPricer'
import GARCHVaR from './lab/GARCHVaR'

const TOOL_GROUPS = [
  { label: 'Stochastic Processes', tools: [
    { id: 'gbm',     name: 'Geometric Brownian Motion', tagline: 'Path simulation' },
    { id: 'heston',  name: 'Heston Stochastic Vol',     tagline: 'Correlated vol process' },
    { id: 'mc',      name: 'Monte Carlo Convergence',   tagline: 'Variance reduction' },
  ]},
  { label: 'Derivatives Pricing', tools: [
    { id: 'bs',      name: 'Black-Scholes Greeks',      tagline: 'Closed-form pricer' },
    { id: 'iv',      name: 'Implied Vol Solver',        tagline: 'Newton-Raphson' },
  ]},
  { label: 'Portfolio Theory', tools: [
    { id: 'frontier',name: 'Efficient Frontier',         tagline: 'Mean-variance' },
  ]},
  { label: 'Fixed Income', tools: [
    { id: 'bond',    name: 'Bond Pricer & Yield Curve', tagline: 'Duration, convexity' },
  ]},
  { label: 'Risk & Volatility', tools: [
    { id: 'garch',   name: 'GARCH(1,1) & VaR',          tagline: 'Vol clustering' },
  ]},
]

const COMPONENTS = {
  gbm:      GBMSimulator,
  heston:   HestonSimulator,
  mc:       MCConvergence,
  bs:       BlackScholesDashboard,
  iv:       ImpliedVolSolver,
  frontier: EfficientFrontier,
  bond:     BondPricer,
  garch:    GARCHVaR,
}

export default function ModellingLab() {
  const [activeTool, setActiveTool] = useState('gbm')
  const ActiveComponent = COMPONENTS[activeTool]

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-text-primary">Modelling Lab</h1>
        <p className="text-xs text-text-muted mt-0.5">Interactive playground for the quantitative finance toolkit — every model is recomputed live as you drag sliders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Sidebar */}
        <aside className="card !p-3 self-start sticky top-32 max-h-[calc(100vh-160px)] overflow-y-auto">
          {TOOL_GROUPS.map(group => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="section-header mb-1.5 px-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.tools.map(tool => {
                  const active = activeTool === tool.id
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md transition-all duration-150 cursor-pointer border-l-2 ${
                        active
                          ? 'bg-accent-blue/12 border-accent-blue'
                          : 'border-transparent hover:bg-bg-hover'
                      }`}
                    >
                      <p className={`text-xs font-medium ${active ? 'text-accent-blue' : 'text-text-primary'}`}>{tool.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{tool.tagline}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Active tool */}
        <main className="min-w-0">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  )
}
