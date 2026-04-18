import { useState, useMemo } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Layers, AlertTriangle, DollarSign, X } from 'lucide-react'
import { ETF_BY_SYMBOL, ETF_UNIVERSE, DEFAULT_SELECTION } from '../utils/etfData'
import UniversePanel from './etf/UniversePanel'
import PortfolioPanel from './etf/PortfolioPanel'
import PerformancePanel from './etf/PerformancePanel'
import RiskPanel from './etf/RiskPanel'
import CostIncomePanel from './etf/CostIncomePanel'
import ScenariosPanel from './etf/ScenariosPanel'

const CATEGORY_GROUPS = [
  { label: 'US Broad', symbols: ['SPY', 'IVV', 'VOO', 'VTI', 'IWM'] },
  { label: 'Factor', symbols: ['QQQ', 'VIG', 'SCHD'] },
  { label: 'Sector', symbols: ['XLK', 'XLF', 'XLV', 'XLE', 'XLI'] },
  { label: 'Intl', symbols: ['VEA', 'EEM'] },
  { label: 'Fixed Income', symbols: ['AGG', 'TLT', 'HYG'] },
  { label: 'Alts', symbols: ['GLD', 'VNQ'] },
]

const TABS = [
  { id: 'universe', label: 'Universe' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'performance', label: 'Performance' },
  { id: 'risk', label: 'Risk' },
  { id: 'cost', label: 'Cost & Income' },
  { id: 'scenarios', label: 'Scenarios' },
]

function computeOverlapRisk(selectedETFs) {
  const counts = {}
  selectedETFs.forEach(sym => {
    const etf = ETF_BY_SYMBOL[sym]
    if (!etf) return
    etf.topHoldings.slice(0, 3).forEach(h => {
      counts[h.symbol] = (counts[h.symbol] || 0) + 1
    })
  })
  const high = Object.values(counts).filter(c => c >= 2).length
  if (high >= 3) return 'HIGH'
  if (high >= 1) return 'MEDIUM'
  return 'LOW'
}

export default function ETFExposure() {
  const [selectedETFs, setSelectedETFs] = useState(DEFAULT_SELECTION)
  const [activeTab, setActiveTab] = useState('universe')

  const addETF = (sym) => {
    if (!selectedETFs.includes(sym) && selectedETFs.length < 6) {
      setSelectedETFs(prev => [...prev, sym])
    }
  }
  const removeETF = (sym) => setSelectedETFs(prev => prev.filter(s => s !== sym))

  const overlapRisk = useMemo(() => computeOverlapRisk(selectedETFs), [selectedETFs])

  const portfolioER = useMemo(() => {
    const eq = 1 / selectedETFs.length
    return selectedETFs.reduce((acc, sym) => {
      const er = ETF_BY_SYMBOL[sym]?.er ?? 0
      return acc + er * eq
    }, 0)
  }, [selectedETFs])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-accent-blue/10 text-accent-blue flex-shrink-0"><Layers size={18} /></div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted">ETFs Selected</p>
            <p className="text-xl font-semibold mono">{selectedETFs.length} <span className="text-xs text-text-muted font-normal">/ 6 max</span></p>
            <p className="text-xs text-text-muted mt-0.5 truncate">{selectedETFs.join(' · ')}</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${overlapRisk === 'HIGH' ? 'bg-accent-red/10 text-accent-red' : overlapRisk === 'MEDIUM' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-accent-green/10 text-accent-green'}`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-xs text-text-muted">Overlap Risk</p>
            <p className={`text-xl font-semibold mono ${overlapRisk === 'HIGH' ? 'text-accent-red' : overlapRisk === 'MEDIUM' ? 'text-accent-amber' : 'text-accent-green'}`}>{overlapRisk}</p>
            <p className="text-xs text-text-muted mt-0.5">Top-3 holding duplication</p>
          </div>
        </div>
        <div className="card flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-accent-green/10 text-accent-green flex-shrink-0"><DollarSign size={18} /></div>
          <div>
            <p className="text-xs text-text-muted">Avg Expense Ratio</p>
            <p className={`text-xl font-semibold mono ${portfolioER <= 0.05 ? 'text-accent-green' : portfolioER <= 0.15 ? 'text-text-primary' : 'text-accent-amber'}`}>
              {(portfolioER * 100).toFixed(4)}%
            </p>
            <p className="text-xs text-text-muted mt-0.5">${(portfolioER * 100000).toFixed(0)}/yr on $100k</p>
          </div>
        </div>
      </div>

      {/* ETF multi-select chips */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="section-header">Selected ETFs</span>
          {selectedETFs.map((sym, i) => (
            <div key={sym} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold mono border border-accent-blue/30 bg-accent-blue/10 text-accent-blue">
              {sym}
              <button onClick={() => removeETF(sym)} className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity"><X size={10} /></button>
            </div>
          ))}
          {selectedETFs.length === 0 && <span className="text-xs text-text-muted">No ETFs selected</span>}
        </div>
        <div className="space-y-2">
          {CATEGORY_GROUPS.map(group => (
            <div key={group.label} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-text-muted w-20 font-medium">{group.label}</span>
              {group.symbols.map(sym => {
                const isSelected = selectedETFs.includes(sym)
                return (
                  <button
                    key={sym}
                    onClick={() => isSelected ? removeETF(sym) : addETF(sym)}
                    disabled={!isSelected && selectedETFs.length >= 6}
                    className={`text-xs px-2.5 py-1 rounded font-medium mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-blue text-white'
                        : selectedETFs.length >= 6
                        ? 'bg-bg-secondary text-text-muted opacity-40 cursor-not-allowed'
                        : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >{sym}</button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex items-center gap-0.5 border-b border-border-subtle mb-4">
          {TABS.map(tab => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={`px-4 py-2 text-xs font-medium transition-all duration-150 rounded-t-md cursor-pointer ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="universe">
          <UniversePanel selectedETFs={selectedETFs} onAdd={addETF} onRemove={removeETF} />
        </Tabs.Content>
        <Tabs.Content value="portfolio">
          <PortfolioPanel selectedETFs={selectedETFs} />
        </Tabs.Content>
        <Tabs.Content value="performance">
          <PerformancePanel selectedETFs={selectedETFs} />
        </Tabs.Content>
        <Tabs.Content value="risk">
          <RiskPanel selectedETFs={selectedETFs} />
        </Tabs.Content>
        <Tabs.Content value="cost">
          <CostIncomePanel selectedETFs={selectedETFs} />
        </Tabs.Content>
        <Tabs.Content value="scenarios">
          <ScenariosPanel selectedETFs={selectedETFs} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
