import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useIntelVix } from '../../hooks/useIntelligence'

function vixColor(v) {
  if (v == null) return '#6b7280'
  if (v >= 25)  return '#ef4444'
  if (v >= 20)  return '#f59e0b'
  return '#10b981'
}

function TermBar({ label, value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = vixColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-nn-muted w-6 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-semibold flex-shrink-0" style={{ color }}>{value?.toFixed(1) ?? '—'}</span>
    </div>
  )
}

export default function VolSurface() {
  const { data } = useIntelVix()
  const spot    = data?.spot
  const term3m  = data?.term_3m
  const history = data?.history || []
  const move    = data?.move_proxy
  const est6m   = term3m ? term3m * 1.04 : null

  const maxVol  = Math.max(spot ?? 0, term3m ?? 0, est6m ?? 0, 1) * 1.1
  const color   = vixColor(spot)

  return (
    <div className="space-y-3">
      {/* Spot VIX */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] text-nn-muted tracking-widest uppercase">VIX Spot</p>
          <span className="text-2xl font-extrabold" style={{ color }}>{spot?.toFixed(1) ?? '—'}</span>
        </div>
        {move != null && (
          <div className="text-right">
            <p className="text-[9px] text-nn-muted tracking-widest uppercase">MOVE Est.</p>
            <span className="text-sm font-bold text-nn-cyan mono">{move.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Term structure */}
      <div className="space-y-1.5">
        <TermBar label="30d"  value={spot}   max={maxVol} />
        <TermBar label="3M"   value={term3m} max={maxVol} />
        <TermBar label="6Me"  value={est6m}  max={maxVol} />
      </div>

      {/* Sparkline */}
      {history.length > 0 && (
        <div className="h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="vixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v) => [v?.toFixed(2), 'VIX']}
                contentStyle={{ background: '#0f1117', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, fontSize: 10 }}
                labelStyle={{ color: '#6b7280', fontSize: 9 }}
              />
              <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={1.5} fill="url(#vixGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
