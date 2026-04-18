import { useIntelCorrelations } from '../../hooks/useIntelligence'

function cellColor(v) {
  if (v === null) return 'rgba(255,255,255,0.04)'
  if (v === 1) return 'rgba(248,250,252,0.12)'
  if (v >= 0.6)  return `rgba(239,68,68,${0.15 + (v - 0.6) * 0.6})`
  if (v >= 0.2)  return `rgba(245,158,11,${0.1 + (v - 0.2) * 0.3})`
  if (v >= -0.2) return 'rgba(255,255,255,0.05)'
  return `rgba(34,211,238,${0.1 + Math.abs(v + 0.2) * 0.4})`
}

function textColor(v) {
  if (v === null) return '#4b5563'
  if (v === 1)   return '#f8fafc'
  if (v >= 0.6)  return '#ef4444'
  if (v >= 0.2)  return '#f59e0b'
  if (v <= -0.2) return '#22d3ee'
  return '#94a3b8'
}

function Skeleton() {
  return (
    <div className="grid grid-cols-7 gap-0.5">
      {Array.from({ length: 49 }).map((_, i) => (
        <div key={i} className="h-7 bg-white/5 rounded animate-pulse" />
      ))}
    </div>
  )
}

export default function CorrelationMatrix() {
  const { data, loading } = useIntelCorrelations()

  const symbols = data?.symbols || ['SPY','TLT','GLD','HYG','EEM','USO']
  const matrix  = data?.matrix  || []

  return (
    <div>
      <p className="text-[10px] text-nn-muted tracking-widest uppercase mb-2">Cross-Asset Correlation (1Y)</p>
      {loading && !data ? <Skeleton /> : (
        <div className="overflow-x-auto">
          <table className="text-[10px] border-collapse w-full">
            <thead>
              <tr>
                <th className="w-8" />
                {symbols.map(s => (
                  <th key={s} className="text-nn-muted font-mono pb-1 text-center w-9">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((s1, i) => (
                <tr key={s1}>
                  <td className="text-nn-muted font-mono pr-1 text-right">{s1}</td>
                  {symbols.map((s2, j) => {
                    const v = matrix[i]?.[j] ?? null
                    return (
                      <td
                        key={s2}
                        className="text-center py-1 px-0.5 rounded font-mono font-semibold"
                        style={{ background: cellColor(v), color: textColor(v), fontSize: 9 }}
                      >
                        {v !== null ? (v === 1 ? '1.00' : v.toFixed(2)) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
