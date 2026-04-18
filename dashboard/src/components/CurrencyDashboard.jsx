import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Activity, TrendingUp, BarChart2, Calculator } from 'lucide-react'
import { CURRENCY_META } from '../utils/fxUtils'
import SpotRatesPanel from './fx/SpotRatesPanel'
import ArbitrageScanner from './fx/ArbitrageScanner'
import PPPPanel from './fx/PPPPanel'
import ForwardRatePanel from './fx/ForwardRatePanel'

const BASE_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']

const SUB_TABS = [
  { id: 'spot',      label: 'Spot Rates',       icon: Activity },
  { id: 'arb',       label: 'Arbitrage',         icon: TrendingUp },
  { id: 'ppp',       label: 'PPP / Expectation', icon: BarChart2 },
  { id: 'forward',   label: 'Forward Rates',     icon: Calculator },
]

export default function CurrencyDashboard() {
  const [base, setBase] = useState('USD')
  const [activeTab, setActiveTab] = useState('spot')

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-text-primary">FX Arbitrage &amp; Rate Analysis</h2>
          <p className="text-xs text-text-muted">ECB fixing rates via Frankfurter API · CIP, PPP &amp; UIP models</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-text-muted">Base:</span>
          <div className="flex gap-1">
            {BASE_CURRENCIES.map(ccy => (
              <button
                key={ccy}
                onClick={() => setBase(ccy)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium mono ${
                  base === ccy
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover border border-transparent'
                }`}
              >
                {CURRENCY_META[ccy]?.flag} {ccy}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border-subtle pb-0 mb-4">
          {SUB_TABS.map(tab => {
            const Icon = tab.icon
            return (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'tab-active border-accent-blue'
                    : 'tab-inactive border-transparent'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>

        <Tabs.Content value="spot">
          <SpotRatesPanel base={base} />
        </Tabs.Content>
        <Tabs.Content value="arb">
          <ArbitrageScanner base={base} />
        </Tabs.Content>
        <Tabs.Content value="ppp">
          <PPPPanel base={base} />
        </Tabs.Content>
        <Tabs.Content value="forward">
          <ForwardRatePanel base={base} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
