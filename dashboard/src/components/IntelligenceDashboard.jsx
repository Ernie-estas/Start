import { useState } from 'react'
import GeoGlobe from './intel/GeoGlobe'
import NewsSidebar from './intel/NewsSidebar'
import CorrelationMatrix from './intel/CorrelationMatrix'
import VolSurface from './intel/VolSurface'
import GPRGauge from './intel/GPRGauge'
import { useIntelConflicts, useIntelVix } from '../hooks/useIntelligence'

function MetricPill({ label, value, sub, color }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
      style={{ background: 'rgba(10,8,25,0.7)', border: `1px solid ${color}33` }}
    >
      <span className="text-[9px] text-nn-muted tracking-widest uppercase">{label}</span>
      <span className="font-extrabold mono text-sm" style={{ color }}>{value}</span>
      {sub && <span className="text-[9px]" style={{ color }}>{sub}</span>}
    </div>
  )
}

function stressLabel(gpr) {
  if (gpr >= 66) return { text: 'HIGH', color: '#ef4444' }
  if (gpr >= 33) return { text: 'MED', color: '#f59e0b' }
  return { text: 'LOW', color: '#10b981' }
}

function vixColor(v) {
  if (v == null) return '#6b7280'
  if (v >= 25) return '#ef4444'
  if (v >= 20) return '#f59e0b'
  return '#10b981'
}

export default function IntelligenceDashboard() {
  const [filterCountry, setFilterCountry] = useState(null)
  const { data: conflictData } = useIntelConflicts()
  const { data: vixData }      = useIntelVix()

  const gpr     = conflictData?.gpr_score ?? 68
  const stress  = stressLabel(gpr)
  const numConf = conflictData?.conflicts?.length ?? 15
  const vixSpot = vixData?.spot
  const move    = vixData?.move_proxy

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{ minHeight: 'calc(100vh - 130px)', background: '#07070f', margin: '-24px -24px 0', padding: '12px 16px 16px' }}
    >
      {/* ── Top metrics bar ── */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
        <MetricPill label="Macro Stress" value={Math.round(gpr)} sub={stress.text} color={stress.color} />
        <MetricPill label="GPR Index"    value={Math.round(gpr)} color="#a855f7" />
        <MetricPill label="VIX"          value={vixSpot?.toFixed(1) ?? '—'} color={vixColor(vixSpot)} />
        <MetricPill label="MOVE Est."    value={move?.toFixed(0) ?? '—'} color="#22d3ee" />
        <MetricPill label="Active Zones" value={numConf} color="#e879f9" />
        <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
          {filterCountry && (
            <button
              onClick={() => setFilterCountry(null)}
              className="text-[9px] px-2 py-1 rounded-full cursor-pointer transition-colors"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              Filter: {filterCountry} ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">

        {/* Left: News sidebar */}
        <div
          className="glass-card p-3 overflow-hidden flex flex-col"
          style={{ width: 270, minWidth: 270, flexShrink: 0 }}
        >
          <NewsSidebar filterCountry={filterCountry} />
        </div>

        {/* Center: Globe */}
        <div
          className="flex-1 relative overflow-hidden rounded-2xl"
          style={{ background: 'rgba(10,8,25,0.4)', border: '1px solid rgba(168,85,247,0.08)', minWidth: 0 }}
        >
          <GeoGlobe onPointClick={d => setFilterCountry(d.country || null)} />

          {/* Globe footer strip */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center gap-4"
            style={{ background: 'linear-gradient(0deg, rgba(7,7,15,0.9) 0%, transparent 100%)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
              <span className="text-[9px] text-nn-muted">Conflict</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 opacity-80" />
              <span className="text-[9px] text-nn-muted">Tension</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
              <span className="text-[9px] text-nn-muted">Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-0.5 bg-nn-cyan opacity-60" />
              <span className="text-[9px] text-nn-muted">Trade Arc</span>
            </div>
            <span className="text-[9px] text-nn-muted ml-auto italic">Click marker to filter news</span>
          </div>
        </div>

        {/* Right: Quant panels */}
        <div
          className="flex flex-col gap-3 overflow-y-auto"
          style={{ width: 300, minWidth: 300, flexShrink: 0 }}
        >
          {/* GPR Gauge */}
          <div className="glass-card p-4 flex flex-col items-center">
            <GPRGauge score={gpr} />
          </div>

          {/* VIX Surface */}
          <div className="glass-card p-4">
            <VolSurface />
          </div>

          {/* Correlation matrix */}
          <div className="glass-card p-4">
            <CorrelationMatrix />
          </div>
        </div>
      </div>
    </div>
  )
}
