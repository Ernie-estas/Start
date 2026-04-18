import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, Plus, X, ExternalLink } from 'lucide-react'
import { ETF_UNIVERSE, CATEGORIES } from '../../utils/etfData'
import { useETFInfo } from '../../hooks/useETFData'

function FlagBadge({ label, color = 'amber' }) {
  const cls = color === 'red'
    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  return <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${cls}`}>{label}</span>
}

function SearchAdd({ onAdd, selectedETFs }) {
  const [query, setQuery] = useState('')
  const { data: etfInfo, loading, error } = useETFInfo(query.length >= 1 ? query : null)

  const alreadyAdded = etfInfo && selectedETFs.includes(etfInfo.symbol)

  return (
    <div className="card mb-4">
      <p className="text-xs font-semibold text-text-secondary mb-2">Search any ETF by ticker</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            placeholder="ARKK, VXUS, JEPI…"
            className="input-dark w-full pl-8 uppercase"
          />
        </div>
        {loading && <span className="text-xs text-text-muted self-center">Searching…</span>}
      </div>
      {etfInfo && !error && (
        <div className="mt-2 p-2.5 bg-bg-secondary rounded-lg border border-border-subtle flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs font-bold text-text-primary mono">{etfInfo.symbol}</span>
            <span className="text-xs text-text-secondary ml-2">{etfInfo.name}</span>
            <div className="flex gap-3 mt-0.5">
              {etfInfo.er != null && <span className="text-[10px] text-text-muted">ER: {(etfInfo.er * 100).toFixed(2)}%</span>}
              {etfInfo.aum != null && <span className="text-[10px] text-text-muted">AUM: ${(etfInfo.aum / 1e9).toFixed(1)}B</span>}
              {etfInfo.category && <span className="text-[10px] text-text-muted">{etfInfo.category}</span>}
            </div>
          </div>
          <button
            disabled={alreadyAdded || selectedETFs.length >= 6}
            onClick={() => { onAdd(etfInfo.symbol); setQuery('') }}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              alreadyAdded || selectedETFs.length >= 6
                ? 'opacity-40 cursor-not-allowed bg-bg-hover text-text-muted'
                : 'bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 cursor-pointer'
            }`}
          >
            <Plus size={12} />
            {alreadyAdded ? 'Added' : 'Add'}
          </button>
        </div>
      )}
      {error && query.length > 0 && (
        <p className="mt-1.5 text-xs text-accent-red">{error}</p>
      )}
    </div>
  )
}

const SPY_IVV_VOO = [
  { symbol: 'SPY', issuer: 'State Street (SPDR)', er: 0.0945, aum: '504B', structure: 'Unit Investment Trust', founded: '1993', note: 'Oldest & highest AUM; UIT structure limits dividend reinvestment' },
  { symbol: 'IVV', issuer: 'iShares (BlackRock)', er: 0.03, aum: '478B', structure: 'Open-End Fund', founded: '2000', note: 'Reinvests dividends immediately; no UIT cap on holdings' },
  { symbol: 'VOO', issuer: 'Vanguard', er: 0.03, aum: '466B', structure: 'Open-End Fund', founded: '2010', note: 'Vanguard unique at-cost structure; mutual fund share class exists' },
]

export default function UniversePanel({ selectedETFs, onAdd, onRemove }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortKey, setSortKey] = useState('aum')
  const [sortDir, setSortDir] = useState('desc')

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = ETF_UNIVERSE
    if (category !== 'All') list = list.filter(e => e.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey]; let bv = b[sortKey]
      if (typeof av === 'string') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0 }
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [search, category, sortKey, sortDir])

  function SortIcon({ k }) {
    if (sortKey !== k) return <ChevronDown size={10} className="opacity-20" />
    return sortDir === 'asc' ? <ChevronUp size={10} className="text-accent-blue" /> : <ChevronDown size={10} className="text-accent-blue" />
  }

  const Th = ({ label, k }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left text-text-muted font-medium py-2 pr-3 cursor-pointer select-none hover:text-text-secondary whitespace-nowrap"
    >
      <span className="flex items-center gap-0.5">{label}<SortIcon k={k} /></span>
    </th>
  )

  return (
    <div className="space-y-4">
      <SearchAdd onAdd={onAdd} selectedETFs={selectedETFs} />

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
              category === c ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30' : 'bg-bg-secondary text-text-muted hover:text-text-secondary border border-border-subtle'
            }`}
          >{c}</button>
        ))}
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="input-dark pl-8 text-xs py-1 w-44"
            placeholder="Filter…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Screener table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              <Th label="Ticker" k="symbol" />
              <th className="text-left text-text-muted font-medium py-2 pr-3">Name</th>
              <Th label="Category" k="category" />
              <Th label="AUM" k="aum" />
              <Th label="ER %" k="er" />
              <Th label="Holdings" k="holdings" />
              <th className="text-left text-text-muted font-medium py-2 pr-3">Replication</th>
              <th className="text-left text-text-muted font-medium py-2 pr-3">Flags</th>
              <th className="text-left text-text-muted font-medium py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(etf => {
              const isSelected = selectedETFs.includes(etf.symbol)
              return (
                <tr key={etf.symbol} className={`border-b border-border-subtle/50 transition-colors ${isSelected ? 'bg-accent-blue/5' : 'hover:bg-bg-hover'}`}>
                  <td className="py-2.5 pr-3 font-bold mono text-text-primary">{etf.symbol}</td>
                  <td className="pr-3 text-text-secondary max-w-[200px] truncate">{etf.name}</td>
                  <td className="pr-3 text-text-muted whitespace-nowrap">{etf.category}</td>
                  <td className="pr-3 mono text-text-secondary whitespace-nowrap">${etf.aum}</td>
                  <td className={`pr-3 mono font-semibold whitespace-nowrap ${etf.er <= 0.05 ? 'text-accent-green' : etf.er <= 0.15 ? 'text-text-primary' : 'text-accent-amber'}`}>
                    {(etf.er).toFixed(4)}%
                  </td>
                  <td className="pr-3 mono text-text-muted">{etf.holdings?.toLocaleString()}</td>
                  <td className="pr-3 text-text-muted whitespace-nowrap">{etf.replication}</td>
                  <td className="pr-3">
                    <div className="flex gap-1 flex-wrap">
                      {etf.flags?.concentrationRisk && <FlagBadge label="Concentration" color="amber" />}
                      {etf.flags?.swapBased && <FlagBadge label="Swap" color="red" />}
                      {etf.flags?.currencyHedged && <FlagBadge label="Hedged" color="amber" />}
                    </div>
                  </td>
                  <td>
                    {isSelected ? (
                      <button onClick={() => onRemove(etf.symbol)} className="flex items-center gap-0.5 text-[10px] text-accent-red/70 hover:text-accent-red cursor-pointer transition-colors">
                        <X size={10} /> Remove
                      </button>
                    ) : (
                      <button
                        disabled={selectedETFs.length >= 6}
                        onClick={() => onAdd(etf.symbol)}
                        className={`flex items-center gap-0.5 text-[10px] transition-colors cursor-pointer ${selectedETFs.length >= 6 ? 'opacity-40 cursor-not-allowed text-text-muted' : 'text-accent-blue hover:text-accent-blue/80'}`}
                      >
                        <Plus size={10} /> Add
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">{filtered.length} ETFs shown · Max 6 selected</p>
      </div>

      {/* SPY vs IVV vs VOO equivalents */}
      <div className="card">
        <h3 className="section-header mb-3">S&P 500 Equivalents — SPY vs IVV vs VOO</h3>
        <div className="grid grid-cols-3 gap-3">
          {SPY_IVV_VOO.map(e => (
            <div key={e.symbol} className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold mono text-text-primary">{e.symbol}</span>
                <span className="text-[10px] text-text-muted">{e.issuer}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-text-muted">Expense Ratio</span><span className={`mono font-semibold ${e.er <= 0.03 ? 'text-accent-green' : 'text-accent-amber'}`}>{e.er}%</span></div>
                <div className="flex justify-between"><span className="text-text-muted">AUM</span><span className="mono text-text-secondary">${e.aum}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Structure</span><span className="text-text-secondary">{e.structure}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Founded</span><span className="text-text-secondary">{e.founded}</span></div>
              </div>
              <p className="text-[10px] text-text-muted mt-2 leading-relaxed">{e.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
