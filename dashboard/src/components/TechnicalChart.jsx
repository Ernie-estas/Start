import { useState, useEffect } from 'react'
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useTechnical, useInfo, useDebouncedInfo } from '../hooks/useMarketData'
import { Search, TrendingUp, TrendingDown, Activity, BarChart2, Loader, Clock, X } from 'lucide-react'

const PERIODS = ['3mo', '6mo', '1y', '2y', '5y']

const POPULAR = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN',
  'GOOGL', 'META', 'AMD', 'SPY', 'QQQ',
  'BRK-B', 'JPM', 'V', 'UNH', 'XOM',
]

const RECENT_KEY = 'tc_recent_searches'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function saveRecent(sym, prev) {
  const next = [sym, ...prev.filter(s => s !== sym)].slice(0, 8)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch {}
  return next
}

function Badge({ value, label, up, format = v => v }) {
  if (value == null) return null
  return (
    <div className="metric-card text-center">
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className={`mono font-semibold text-sm ${up === true ? 'stat-up' : up === false ? 'stat-down' : 'text-text-primary'}`}>
        {format(value)}
      </p>
    </div>
  )
}

function RSIPanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <ComposedChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
        <XAxis dataKey="date" hide />
        <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} ticks={[30, 50, 70]} width={25} />
        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
        <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="2 2" strokeOpacity={0.4} />
        <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '10px' }} formatter={v => [v?.toFixed(1), 'RSI']} labelFormatter={() => ''} />
        <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function MACDPanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <ComposedChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
        <XAxis dataKey="date" hide />
        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => v?.toFixed(1)} />
        <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="2 2" />
        <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '10px' }} formatter={(v, name) => [v?.toFixed(3), name]} labelFormatter={() => ''} />
        <Bar dataKey="macd_hist" name="Histogram" radius={[1, 1, 0, 0]} fill="#3b82f6" />
        <Line type="monotone" dataKey="macd" name="MACD" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="macd_signal" name="Signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function VolumePanel({ data }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <ComposedChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
        <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #2a2f45', borderRadius: '8px', fontSize: '10px' }} formatter={v => [`${(v / 1e6).toFixed(2)}M`, 'Volume']} labelFormatter={() => ''} />
        <Bar dataKey="volume" fill="#3b82f6" fillOpacity={0.4} radius={[1, 1, 0, 0]} />
        <Line type="monotone" dataKey="vol_sma20" stroke="#f59e0b" strokeWidth={1} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="custom-tooltip text-xs space-y-0.5 min-w-[160px]">
      <p className="text-text-muted border-b border-border-default pb-1 mb-1">{label}</p>
      {d.close != null && <p>Close: <span className="mono text-text-primary font-semibold">${d.close?.toFixed(2)}</span></p>}
      {d.sma20  != null && <p>SMA20: <span className="mono text-accent-cyan">${d.sma20?.toFixed(2)}</span></p>}
      {d.sma50  != null && <p>SMA50: <span className="mono text-accent-amber">${d.sma50?.toFixed(2)}</span></p>}
      {d.sma200 != null && <p>SMA200: <span className="mono text-accent-red">${d.sma200?.toFixed(2)}</span></p>}
      {d.bb_upper != null && <p>BB Upper: <span className="mono text-text-muted">${d.bb_upper?.toFixed(2)}</span></p>}
      {d.bb_lower != null && <p>BB Lower: <span className="mono text-text-muted">${d.bb_lower?.toFixed(2)}</span></p>}
    </div>
  )
}

export default function TechnicalChart() {
  const [symbol, setSymbol]   = useState('AAPL')
  const [draft, setDraft]     = useState('')
  const [period, setPeriod]   = useState('1y')
  const [showBB, setShowBB]   = useState(true)
  const [showSMAs, setShowSMAs] = useState(true)
  const [recent, setRecent]   = useState(loadRecent)

  const { data: techData, loading: techLoading, error: techError } = useTechnical(symbol, period)
  const { data: info } = useInfo(symbol)
  const { data: preview, loading: previewLoading, error: previewError } = useDebouncedInfo(draft, 500)

  const handleLoad = (sym) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setSymbol(s)
    setDraft('')
    setRecent(prev => saveRecent(s, prev))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (preview && !previewError) handleLoad(draft)
  }

  const latest  = techData?.[techData.length - 1]
  const prev    = techData?.[techData.length - 2]
  const priceChange    = latest && prev ? latest.close - prev.close : null
  const priceChangePct = priceChange && prev?.close ? (priceChange / prev.close) * 100 : null

  const displayData = techData
    ? (techData.length > 300 ? techData.filter((_, i) => i % 2 === 0) : techData)
    : []

  const rsiLatest = latest?.rsi
  const rsiSignal = rsiLatest > 70 ? { label: 'Overbought', color: 'stat-down' }
    : rsiLatest < 30 ? { label: 'Oversold', color: 'stat-up' }
    : { label: 'Neutral', color: 'text-text-muted' }

  const macdBull = latest?.macd > latest?.macd_signal

  const canLoad = draft.length > 0 && !previewLoading && !previewError && preview

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search bar */}
      <div className="card space-y-3">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Search form */}
          <div className="flex-1 min-w-[280px]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search any ticker — TSLA, MSFT, SPY…"
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
              <button
                type="submit"
                disabled={!canLoad}
                className={`btn-primary transition-all ${canLoad ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                Load
              </button>
            </form>

            {/* Inline validation feedback */}
            {draft.length > 0 && (
              <div className="mt-2 h-8 flex items-center">
                {previewLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Loader size={11} className="animate-spin" /> Validating…
                  </div>
                )}
                {!previewLoading && previewError && (
                  <p className="text-xs text-accent-red">Symbol not found — check the ticker and try again</p>
                )}
                {!previewLoading && preview && !previewError && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-text-primary font-semibold">{preview.name}</span>
                    {preview.sector && <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full">{preview.sector}</span>}
                    <span className="text-accent-green text-[10px] font-semibold">✓ Valid</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Period selector */}
          <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-medium ${period === p ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border-default'}`}>
                {p}
              </button>
            ))}
          </div>

          {/* Overlay toggles */}
          <div className="flex gap-3 flex-shrink-0 mt-0.5 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
              <input type="checkbox" checked={showSMAs} onChange={e => setShowSMAs(e.target.checked)} className="accent-blue-500" /> SMAs
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
              <input type="checkbox" checked={showBB} onChange={e => setShowBB(e.target.checked)} className="accent-blue-500" /> Bollinger
            </label>
          </div>
        </div>

        {/* Popular quick-select */}
        <div>
          <p className="section-header mb-1.5">Popular</p>
          <div className="flex gap-1 flex-wrap">
            {POPULAR.map(sym => (
              <button key={sym} onClick={() => handleLoad(sym)} className={`text-[10px] px-2 py-1 rounded-md transition-all duration-150 cursor-pointer mono font-medium ${symbol === sym && !draft ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'text-text-muted hover:text-text-primary border border-border-default hover:border-border-default/80'}`}>
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Recent searches */}
        {recent.length > 0 && (
          <div>
            <p className="section-header mb-1.5 flex items-center gap-1"><Clock size={9} /> Recent</p>
            <div className="flex gap-1 flex-wrap">
              {recent.map(sym => (
                <button key={sym} onClick={() => handleLoad(sym)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition-all duration-150 cursor-pointer mono">
                  {sym}
                </button>
              ))}
              <button onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY) }} className="text-[10px] px-2 py-1 rounded-md text-text-muted hover:text-accent-red transition-colors cursor-pointer">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock header */}
      {(info || latest) && (
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold mono">{symbol}</h2>
                {info?.name && <span className="text-text-secondary text-sm">{info.name}</span>}
                {info?.sector && <span className="text-xs px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md border border-accent-blue/20">{info.sector}</span>}
              </div>
              {latest && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-3xl font-bold mono">${latest.close?.toFixed(2)}</span>
                  {priceChange != null && (
                    <span className={`flex items-center gap-1 text-sm font-semibold ${priceChange >= 0 ? 'stat-up' : 'stat-down'}`}>
                      {priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePct >= 0 ? '+' : ''}{priceChangePct?.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              <Badge label="P/E"      value={info?.pe}         format={v => v.toFixed(1) + 'x'} />
              <Badge label="Fwd P/E"  value={info?.fwd_pe}     format={v => v.toFixed(1) + 'x'} />
              <Badge label="Mkt Cap"  value={info?.market_cap} format={v => v >= 1e12 ? `$${(v/1e12).toFixed(2)}T` : `$${(v/1e9).toFixed(1)}B`} />
              <Badge label="Beta"     value={info?.beta}       format={v => v.toFixed(2)} />
              <Badge label="Div Yld"  value={info?.div_yield}  format={v => (v*100).toFixed(2)+'%'} up={true} />
              <Badge label="Short %"  value={info?.short_pct}  format={v => (v*100).toFixed(1)+'%'} up={false} />
            </div>
          </div>
        </div>
      )}

      {techLoading && (
        <div className="card flex items-center justify-center py-16 gap-3 text-text-muted">
          <Loader size={18} className="animate-spin text-accent-blue" />
          <span className="text-sm">Fetching {symbol} data…</span>
        </div>
      )}

      {techError && !techLoading && (
        <div className="card py-10 text-center space-y-2">
          <p className="text-accent-red text-sm">Could not load data for {symbol}</p>
          <p className="text-text-muted text-xs">Check the symbol is valid or ensure the backend is running.</p>
        </div>
      )}

      {techData && !techLoading && (
        <>
          {/* Signal badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'RSI (14)',     value: rsiLatest?.toFixed(1), sub: rsiSignal.label,  color: rsiSignal.color, icon: Activity },
              { label: 'MACD Signal', value: macdBull ? 'BULLISH' : 'BEARISH', sub: `${latest?.macd?.toFixed(2)} / ${latest?.macd_signal?.toFixed(2)}`, color: macdBull ? 'stat-up' : 'stat-down', icon: TrendingUp },
              { label: 'vs SMA 50',   value: latest?.sma50 ? (latest.close > latest.sma50 ? 'ABOVE' : 'BELOW') : '—', sub: latest?.sma50 ? `SMA50 $${latest.sma50.toFixed(2)}` : '', color: latest?.close > latest?.sma50 ? 'stat-up' : 'stat-down', icon: BarChart2 },
              { label: 'vs SMA 200',  value: latest?.sma200 ? (latest.close > latest.sma200 ? 'ABOVE' : 'BELOW') : '—', sub: latest?.sma200 ? `SMA200 $${latest.sma200.toFixed(2)}` : '', color: latest?.close > latest?.sma200 ? 'stat-up' : 'stat-down', icon: TrendingUp },
            ].map(s => (
              <div key={s.label} className="card flex items-start gap-3">
                <div className="p-2 rounded-lg bg-bg-hover flex-shrink-0">
                  <s.icon size={14} className="text-text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">{s.label}</p>
                  <p className={`font-bold text-sm mono ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main price chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <BarChart2 size={14} className="text-accent-blue" />
                Price + Moving Averages {showBB && '+ Bollinger Bands'}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-blue inline-block rounded" /> Price</span>
                {showSMAs && <>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-cyan inline-block rounded" /> SMA20</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-amber inline-block rounded" /> SMA50</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-red inline-block rounded" /> SMA200</span>
                </>}
                {showBB && <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-text-muted inline-block" /> BB Bands</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(displayData.length / 6)} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} domain={['auto', 'auto']} width={50} />
                <Tooltip content={<CustomTooltip />} />
                {showBB && <>
                  <Area type="monotone" dataKey="bb_upper" stroke="#4b5563" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} />
                  <Area type="monotone" dataKey="bb_lower" stroke="#4b5563" strokeWidth={1} strokeDasharray="3 3" fill="none" dot={false} />
                </>}
                <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                {showSMAs && <>
                  <Line type="monotone" dataKey="sma20"  stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="sma50"  stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="sma200" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </>}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sub-charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-primary">RSI (14)</h4>
                <span className={`text-xs font-bold mono ${rsiSignal.color}`}>{rsiLatest?.toFixed(1)} — {rsiSignal.label}</span>
              </div>
              <RSIPanel data={displayData} />
              <p className="text-[10px] text-text-muted mt-1">Above 70 = overbought · Below 30 = oversold</p>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-primary">MACD (12/26/9)</h4>
                <span className={`text-xs font-bold mono ${macdBull ? 'stat-up' : 'stat-down'}`}>{macdBull ? '↑ BULLISH' : '↓ BEARISH'}</span>
              </div>
              <MACDPanel data={displayData} />
              <p className="text-[10px] text-text-muted mt-1">Blue = MACD · Amber = Signal · Bars = Histogram</p>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-text-primary">Volume</h4>
                <span className="text-xs text-text-muted mono">{latest?.volume ? `${(latest.volume / 1e6).toFixed(2)}M` : '—'}</span>
              </div>
              <VolumePanel data={displayData} />
              <p className="text-[10px] text-text-muted mt-1">Bars = daily · Amber = 20-day avg volume</p>
            </div>
          </div>

          {/* Key levels */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Key Technical Levels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {[
                { label: 'Current Price', value: latest?.close != null ? `$${latest.close.toFixed(2)}` : '—' },
                { label: 'SMA 20',  value: latest?.sma20  != null ? `$${latest.sma20.toFixed(2)}`  : '—', up: latest?.close > latest?.sma20 },
                { label: 'SMA 50',  value: latest?.sma50  != null ? `$${latest.sma50.toFixed(2)}`  : '—', up: latest?.close > latest?.sma50 },
                { label: 'SMA 200', value: latest?.sma200 != null ? `$${latest.sma200.toFixed(2)}` : '—', up: latest?.close > latest?.sma200 },
                { label: 'BB Upper', value: latest?.bb_upper != null ? `$${latest.bb_upper.toFixed(2)}` : '—' },
                { label: 'BB Lower', value: latest?.bb_lower != null ? `$${latest.bb_lower.toFixed(2)}` : '—' },
                { label: 'RSI',         value: latest?.rsi  != null ? latest.rsi.toFixed(1)   : '—', up: latest?.rsi < 50 },
                { label: 'MACD',        value: latest?.macd != null ? latest.macd.toFixed(3)  : '—', up: latest?.macd > 0 },
                { label: 'MACD Signal', value: latest?.macd_signal != null ? latest.macd_signal.toFixed(3) : '—' },
                { label: 'MACD Hist',   value: latest?.macd_hist   != null ? latest.macd_hist.toFixed(3)   : '—', up: latest?.macd_hist > 0 },
                { label: '52W High', value: info?.fifty_two_week_high != null ? `$${info.fifty_two_week_high.toFixed(2)}` : '—' },
                { label: '52W Low',  value: info?.fifty_two_week_low  != null ? `$${info.fifty_two_week_low.toFixed(2)}`  : '—' },
              ].map(item => (
                <div key={item.label} className="metric-card">
                  <p className="text-text-muted text-[10px] mb-0.5">{item.label}</p>
                  <p className={`mono font-semibold ${item.up === true ? 'stat-up' : item.up === false ? 'stat-down' : 'text-text-primary'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
