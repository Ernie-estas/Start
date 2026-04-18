import { useState, useMemo } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Area, AreaChart,
} from 'recharts'
import { Search, TrendingUp, TrendingDown, Users, Star, BarChart2, Loader, X, AlertCircle } from 'lucide-react'
import { useInfo, useQuote, useHistory, useInsiders, useAnalystRatings, useDebouncedInfo } from '../hooks/useMarketData'

const POPULAR = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN',
  'GOOGL', 'META', 'JPM', 'V', 'BRK-B',
]

const RECENT_KEY = 'sr_recent_searches'
function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }
function saveRecent(sym, prev) {
  const next = [sym, ...prev.filter(s => s !== sym)].slice(0, 6)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch {}
  return next
}

function fmt(v, suffix = '', dp = 1) { if (v == null) return '—'; return v.toFixed(dp) + suffix }
function fmtCap(v) {
  if (v == null) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`
  return `$${(v / 1e6).toFixed(0)}M`
}

function Skeleton({ rows = 5 }) {
  return <div className="space-y-1.5">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-6 bg-bg-hover rounded animate-pulse" />)}</div>
}

function MetricRow({ label, value, up }) {
  return (
    <div className="flex items-center justify-between text-xs border-b border-border-subtle pb-2 last:border-0 last:pb-0">
      <span className="text-text-muted">{label}</span>
      <span className={`mono font-semibold ${up === true ? 'stat-up' : up === false ? 'stat-down' : 'text-text-primary'}`}>{value}</span>
    </div>
  )
}

function RecommendationBadge({ rec }) {
  if (!rec) return null
  const map = {
    strong_buy:   { label: 'STRONG BUY',   cls: 'badge-bull' },
    buy:          { label: 'BUY',           cls: 'badge-bull' },
    hold:         { label: 'HOLD',          cls: 'badge-neutral' },
    underperform: { label: 'UNDERPERFORM',  cls: 'badge-bear' },
    sell:         { label: 'SELL',          cls: 'badge-bear' },
  }
  const cfg = map[rec] || { label: rec.toUpperCase(), cls: 'badge-neutral' }
  return <span className={`${cfg.cls} text-[10px] px-2 py-0.5 rounded-full font-semibold`}>{cfg.label}</span>
}

export default function StockResearch() {
  const [symbol, setSymbol] = useState('AAPL')
  const [draft, setDraft]   = useState('')
  const [recent, setRecent] = useState(loadRecent)

  const { data: info,     loading: infoLoading,  error: infoError }  = useInfo(symbol)
  const { data: quote,    loading: quoteLoading }                     = useQuote(symbol)
  const { data: history,  loading: histLoading }                      = useHistory(symbol, '6mo')
  const { data: insiders, loading: insLoading }                       = useInsiders(symbol)
  const { data: ratings,  loading: ratLoading }                       = useAnalystRatings(symbol)
  const { data: preview,  loading: previewLoading, error: previewError } = useDebouncedInfo(draft, 500)

  const load = (sym) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setSymbol(s)
    setDraft('')
    setRecent(prev => saveRecent(s, prev))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (preview && !previewError) load(draft)
  }

  const price     = quote?.price
  const change    = quote?.change
  const changePct = quote?.change_pct
  const upside    = info?.target_mean && price
    ? (((info.target_mean - price) / price) * 100).toFixed(1)
    : null

  const radarData = useMemo(() => {
    if (!info) return []
    return [
      { subject: 'Growth',       A: Math.min(Math.max((info.revenue_growth ?? 0) * 2, 0), 100) },
      { subject: 'Profitability',A: Math.min(Math.max((info.net_margin ?? 0) * 2, 0), 100) },
      { subject: 'Value',        A: info.pe != null ? Math.max(100 - info.pe, 5) : 50 },
      { subject: 'Quality',      A: Math.min(Math.max((info.roe ?? 0) / 1.5, 0), 100) },
      { subject: 'Dividend',     A: Math.min((info.div_yield ?? 0) * 100 * 20, 100) },
      { subject: 'Beta Risk',    A: info.beta != null ? Math.max(100 - info.beta * 40, 0) : 50 },
    ]
  }, [info])

  const histData = useMemo(() =>
    (history || []).map(d => ({ date: d.date?.slice(0, 7), price: d.close }))
  , [history])

  const canLoad = draft.length > 0 && !previewLoading && !previewError && preview

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Search */}
      <div className="card space-y-3">
        <div className="flex items-start gap-4 flex-wrap">
          <form onSubmit={handleSubmit} className="flex gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search any stock — NVDA, TSLA, JPM…"
                value={draft}
                onChange={e => setDraft(e.target.value.toUpperCase())}
                className="input-dark w-full pl-8 pr-8"
                autoComplete="off"
                spellCheck={false}
              />
              {draft && (
                <button type="button" onClick={() => setDraft('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="submit" disabled={!canLoad} className={`btn-primary ${canLoad ? '' : 'opacity-40 cursor-not-allowed'}`}>
              Research
            </button>
          </form>

          <div className="flex gap-1 flex-wrap">
            {POPULAR.map(sym => (
              <button key={sym} onClick={() => load(sym)} className={`text-[10px] px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer mono font-medium ${symbol === sym && !draft ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'text-text-muted hover:text-text-primary border border-border-default'}`}>
                {sym}
              </button>
            ))}
          </div>
        </div>

        {draft.length > 0 && (
          <div className="h-6 flex items-center">
            {previewLoading && <div className="flex items-center gap-1.5 text-xs text-text-muted"><Loader size={11} className="animate-spin" /> Validating…</div>}
            {!previewLoading && previewError && <p className="text-xs text-accent-red">Symbol not found</p>}
            {!previewLoading && preview && !previewError && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-primary font-semibold">{preview.name}</span>
                {preview.sector && <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full">{preview.sector}</span>}
                <span className="text-accent-green text-[10px] font-semibold">✓ Valid</span>
              </div>
            )}
          </div>
        )}

        {recent.length > 0 && !draft && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="section-header">Recent:</span>
            {recent.map(sym => (
              <button key={sym} onClick={() => load(sym)} className="text-[10px] px-2 py-0.5 rounded border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition-all mono cursor-pointer">
                {sym}
              </button>
            ))}
            <button onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY) }} className="text-[10px] text-text-muted hover:text-accent-red transition-colors cursor-pointer ml-1">Clear</button>
          </div>
        )}
      </div>

      {infoError && !infoLoading && (
        <div className="card py-10 text-center space-y-2">
          <AlertCircle size={24} className="text-accent-red mx-auto" />
          <p className="text-sm text-accent-red">Could not load data for {symbol}</p>
          <p className="text-xs text-text-muted">Backend may be offline or symbol invalid.</p>
        </div>
      )}

      {!infoError && (
        <>
          {/* Header */}
          <div className="card">
            {infoLoading || quoteLoading ? <Skeleton rows={3} /> : (
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold mono">{symbol}</h2>
                    {info?.name && <span className="text-text-secondary text-sm">{info.name}</span>}
                    {info?.sector && <span className="text-xs px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md border border-accent-blue/20">{info.sector}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {price != null && <span className="text-3xl font-bold mono">${price.toFixed(2)}</span>}
                    {change != null && (
                      <span className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? 'stat-up' : 'stat-down'}`}>
                        {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct?.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                  {info?.description && <p className="text-xs text-text-muted mt-2 max-w-2xl line-clamp-2">{info.description}</p>}
                </div>
                {(info?.target_mean || info?.recommendation) && (
                  <div className="text-right space-y-1">
                    <p className="text-xs text-text-muted">Analyst Consensus</p>
                    <RecommendationBadge rec={info?.recommendation} />
                    {info?.target_mean && (
                      <>
                        <p className="text-2xl font-bold mono">${info.target_mean.toFixed(2)}</p>
                        {upside && <p className={`text-sm font-semibold ${upside > 0 ? 'stat-up' : 'stat-down'}`}>{upside > 0 ? '+' : ''}{upside}% upside</p>}
                        <p className="text-[10px] text-text-muted">{info.num_analyst_opinions} analysts</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              {/* Price chart */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Price History — 6 Months</h3>
                {histLoading ? (
                  <div className="h-40 flex items-center justify-center"><Loader size={16} className="animate-spin text-accent-blue" /></div>
                ) : histData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={histData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} domain={['auto', 'auto']} width={50} />
                      <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '11px' }} formatter={v => [`$${v?.toFixed(2)}`, 'Price']} />
                      <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fill="url(#histGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-text-muted py-8 text-center">No history available.</p>
                )}
              </div>

              {/* Fundamentals */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <BarChart2 size={14} className="text-accent-cyan" /> Valuation &amp; Fundamentals
                </h3>
                {infoLoading ? <Skeleton rows={6} /> : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8">
                    {[
                      { label: 'P/E Ratio',    value: fmt(info?.pe, 'x') },
                      { label: 'Fwd P/E',      value: fmt(info?.fwd_pe, 'x') },
                      { label: 'P/S Ratio',    value: fmt(info?.ps, 'x') },
                      { label: 'P/B Ratio',    value: fmt(info?.pb, 'x') },
                      { label: 'EV/EBITDA',    value: fmt(info?.ev_ebitda, 'x') },
                      { label: 'Market Cap',   value: fmtCap(info?.market_cap) },
                      { label: 'Revenue YoY',  value: info?.revenue_growth != null ? `${info.revenue_growth > 0 ? '+' : ''}${info.revenue_growth.toFixed(1)}%` : '—', up: (info?.revenue_growth ?? 0) > 0 },
                      { label: 'Gross Margin', value: fmt(info?.gross_margin, '%'), up: true },
                      { label: 'Net Margin',   value: fmt(info?.net_margin, '%'),   up: true },
                      { label: 'ROE',          value: fmt(info?.roe, '%'),           up: true },
                      { label: 'Div Yield',    value: info?.div_yield != null ? (info.div_yield * 100).toFixed(2) + '%' : '—' },
                      { label: 'Beta',         value: fmt(info?.beta, '', 2) },
                      { label: '52W High',     value: info?.fifty_two_week_high != null ? `$${info.fifty_two_week_high.toFixed(2)}` : '—' },
                      { label: '52W Low',      value: info?.fifty_two_week_low  != null ? `$${info.fifty_two_week_low.toFixed(2)}`  : '—' },
                      { label: 'Short Float',  value: info?.short_pct != null ? `${(info.short_pct * 100).toFixed(1)}%` : '—', up: false },
                    ].map(m => <MetricRow key={m.label} {...m} />)}
                  </div>
                )}
              </div>

              {/* Insiders */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Users size={14} className="text-accent-purple" /> Insider Transactions
                </h3>
                {insLoading ? <Skeleton rows={4} /> : insiders?.length > 0 ? (
                  <div className="space-y-2">
                    {insiders.slice(0, 8).map((ins, i) => {
                      const isBuy = ins.transaction?.toLowerCase().includes('purchase') || ins.transaction?.toLowerCase().includes('buy')
                      const val = ins.value != null ? `$${(ins.value / 1e6).toFixed(2)}M` : ins.shares ? `${ins.shares?.toLocaleString()} sh` : '—'
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${isBuy ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}>
                            {isBuy ? '↑' : '↓'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-primary truncate">{ins.name || 'Insider'}</p>
                            <p className="text-text-muted truncate">{ins.title}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-semibold ${isBuy ? 'stat-up' : 'stat-down'}`}>{ins.transaction}</p>
                            <p className="text-text-muted">{val}</p>
                          </div>
                          <p className="text-text-muted min-w-[68px] text-right">{ins.date?.slice(0, 10)}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-xs text-text-muted py-4 text-center">No recent insider transactions.</p>}
              </div>

              {/* Analyst actions */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Star size={14} className="text-accent-amber" /> Recent Analyst Actions
                </h3>
                {ratLoading ? <Skeleton rows={4} /> : ratings?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          {['Date', 'Firm', 'Action', 'From', 'To'].map(h => (
                            <th key={h} className="text-left text-text-muted font-medium py-2 pr-4 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ratings.slice(0, 10).map((r, i) => {
                          const isUp = r.action?.toLowerCase() === 'up' || r.to_grade?.toLowerCase().includes('buy')
                          return (
                            <tr key={i} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                              <td className="py-2 pr-4 text-text-muted mono">{r.date}</td>
                              <td className="pr-4 font-medium text-text-primary">{r.firm}</td>
                              <td className={`pr-4 font-semibold ${isUp ? 'stat-up' : 'stat-down'}`}>{r.action?.toUpperCase()}</td>
                              <td className="pr-4 text-text-muted">{r.from_grade || '—'}</td>
                              <td className={`font-semibold ${isUp ? 'stat-up' : 'text-text-secondary'}`}>{r.to_grade || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-xs text-text-muted py-4 text-center">No recent analyst actions.</p>}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {!infoLoading && info?.target_mean && (
                <div className="card space-y-2.5">
                  <h3 className="text-sm font-semibold text-text-primary">Price Targets</h3>
                  {[
                    { label: 'High Target',   value: info.target_high != null ? `$${info.target_high.toFixed(2)}` : '—', up: true },
                    { label: 'Mean Target',   value: info.target_mean != null ? `$${info.target_mean.toFixed(2)}` : '—' },
                    { label: 'Low Target',    value: info.target_low  != null ? `$${info.target_low.toFixed(2)}`  : '—', up: false },
                    { label: 'Current Price', value: price != null ? `$${price.toFixed(2)}` : '—' },
                    { label: 'Upside (Mean)', value: upside != null ? `${upside > 0 ? '+' : ''}${upside}%` : '—', up: upside > 0 },
                  ].map(m => <MetricRow key={m.label} {...m} />)}
                </div>
              )}

              <div className="card space-y-2.5">
                <h3 className="text-sm font-semibold text-text-primary">Company Info</h3>
                {infoLoading ? <Skeleton rows={4} /> : (
                  <>
                    {[
                      { label: 'Market Cap',  value: fmtCap(info?.market_cap) },
                      { label: 'Employees',   value: info?.employees ? info.employees.toLocaleString() : '—' },
                      { label: 'Country',     value: info?.country   || '—' },
                      { label: 'Exchange',    value: info?.exchange   || '—' },
                      { label: 'Industry',    value: info?.industry   || '—' },
                    ].map(m => <MetricRow key={m.label} {...m} />)}
                  </>
                )}
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Quality Score</h3>
                {infoLoading ? (
                  <div className="h-48 flex items-center justify-center"><Loader size={16} className="animate-spin text-accent-blue" /></div>
                ) : radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1f2333" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar name={symbol} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
