const TICKER_DATA = [
  { sym: 'AAPL', price: '182.63', chg: '+1.24%', up: true },
  { sym: 'MSFT', price: '415.32', chg: '+0.87%', up: true },
  { sym: 'NVDA', price: '875.42', chg: '+3.21%', up: true },
  { sym: 'GOOGL', price: '172.18', chg: '-0.34%', up: false },
  { sym: 'AMZN', price: '196.45', chg: '+1.56%', up: true },
  { sym: 'META', price: '508.23', chg: '+2.14%', up: true },
  { sym: 'TSLA', price: '172.82', chg: '-2.43%', up: false },
  { sym: 'BRK.B', price: '408.71', chg: '+0.31%', up: true },
  { sym: 'JPM', price: '218.54', chg: '+0.62%', up: true },
  { sym: 'V', price: '276.84', chg: '+0.45%', up: true },
  { sym: 'XOM', price: '112.35', chg: '-0.78%', up: false },
  { sym: 'UNH', price: '521.63', chg: '+1.02%', up: true },
  { sym: 'SPY', price: '524.38', chg: '+0.84%', up: true },
  { sym: 'QQQ', price: '449.27', chg: '+1.12%', up: true },
  { sym: 'GLD', price: '218.46', chg: '+0.23%', up: true },
  { sym: 'TLT', price: '89.34', chg: '-0.15%', up: false },
  { sym: 'DXY', price: '104.23', chg: '-0.21%', up: false },
  { sym: 'WTI', price: '72.18', chg: '+0.94%', up: true },
  { sym: 'NFLX', price: '632.74', chg: '+1.87%', up: true },
  { sym: 'AMD', price: '162.45', chg: '+2.63%', up: true },
]

export default function Ticker() {
  const doubled = [...TICKER_DATA, ...TICKER_DATA]

  return (
    <div className="ticker-wrap bg-bg-primary border-b border-border-subtle py-1 overflow-hidden">
      <div className="ticker-content">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 mr-6 text-xs">
            <span className="text-text-muted font-medium mono">{item.sym}</span>
            <span className="mono text-text-primary">{item.price}</span>
            <span className={item.up ? 'stat-up' : 'stat-down'}>{item.chg}</span>
            <span className="text-border-default ml-4">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}
