import { useState } from 'react'
import { useIntelNews } from '../../hooks/useIntelligence'
import CBCalendar from './CBCalendar'

const FILTERS = ['All', 'Critical', 'High', 'Market']

function impactClass(score) {
  if (score >= 80) return 'impact-critical'
  if (score >= 60) return 'impact-high'
  if (score >= 40) return 'impact-medium'
  return 'impact-low'
}

function impactLabel(score) {
  if (score >= 80) return 'CRIT'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MED'
  return 'LOW'
}

function timeAgo(dtStr) {
  if (!dtStr || dtStr === '2025-01-01T12:00:00Z') return 'recent'
  try {
    const clean = dtStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z')
    const diff = (Date.now() - new Date(clean).getTime()) / 1000
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return ''
  }
}

function NewsCard({ article }) {
  return (
    <a
      href={article.url === '#' ? undefined : article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass-card glass-card-hover p-3 cursor-pointer group transition-all duration-200"
      style={{ borderRadius: 12 }}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${impactClass(article.impact_score)}`}
          style={{ borderRadius: 4 }}>
          {impactLabel(article.impact_score)} {article.impact_score}
        </span>
        <p className="text-[11px] text-nn-text leading-tight line-clamp-2 flex-1 group-hover:text-white transition-colors">
          {article.title}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-nn-muted">{article.domain} · {timeAgo(article.datetime)}</span>
        <span className="text-[9px] text-nn-purple opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
      </div>
    </a>
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card p-3 space-y-2 animate-pulse" style={{ borderRadius: 12 }}>
      <div className="h-3 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/6 rounded w-1/2" />
    </div>
  )
}

export default function NewsSidebar({ filterCountry }) {
  const { data, loading, lastUpdated } = useIntelNews(300000)
  const [activeFilter, setActiveFilter] = useState('All')

  let articles = data || []
  if (filterCountry) articles = articles.filter(a => a.country === filterCountry)

  if (activeFilter === 'Critical') articles = articles.filter(a => a.impact_score >= 80)
  else if (activeFilter === 'High') articles = articles.filter(a => a.impact_score >= 60)
  else if (activeFilter === 'Market') {
    const mkKw = ['market','stock','fed','rate','inflation','gdp','trade','economy']
    articles = articles.filter(a => mkKw.some(k => a.title.toLowerCase().includes(k)))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-nn-purple animate-pulse-dot" />
          <span className="text-[11px] font-bold text-nn-text tracking-wide">INTEL FEED</span>
        </div>
        {lastUpdated && (
          <span className="text-[9px] text-nn-muted mono">{lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 mb-2 flex-shrink-0 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer"
            style={{
              background: activeFilter === f ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === f ? '#a855f7' : '#6b7280',
              border: activeFilter === f ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* News list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading && !data
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.length === 0
            ? <p className="text-[10px] text-nn-muted text-center py-4">No articles found</p>
            : articles.map((a, i) => <NewsCard key={i} article={a} />)
        }
      </div>

      {/* CB Calendar at bottom */}
      <div className="flex-shrink-0 mt-3 pt-3 border-t border-white/5">
        <CBCalendar />
      </div>
    </div>
  )
}
