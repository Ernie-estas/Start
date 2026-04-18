export default function GPRGauge({ score = 0, label = 'Macro Stress Score' }) {
  const pct = Math.min(Math.max(score, 0), 100) / 100
  const R = 54
  const cx = 70, cy = 70
  const startAngle = Math.PI
  const endAngle = 0
  const totalArc = Math.PI

  function arcPath(from, to, r) {
    const sx = cx + r * Math.cos(Math.PI - from * totalArc)
    const sy = cy - r * Math.sin(Math.PI - from * totalArc)
    const ex = cx + r * Math.cos(Math.PI - to * totalArc)
    const ey = cy - r * Math.sin(Math.PI - to * totalArc)
    const large = (to - from) > 0.5 ? 1 : 0
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`
  }

  const needleAngle = Math.PI - pct * Math.PI
  const nx = cx + (R - 8) * Math.cos(needleAngle)
  const ny = cy - (R - 8) * Math.sin(needleAngle)

  const color = score >= 66 ? '#ef4444' : score >= 33 ? '#f59e0b' : '#10b981'
  const label2 = score >= 66 ? 'HIGH' : score >= 33 ? 'MED' : 'LOW'

  return (
    <div className="flex flex-col items-center">
      <svg width={140} height={80} viewBox="0 0 140 80">
        {/* Track segments */}
        <path d={arcPath(0, 0.33, R)} stroke="#10b981" strokeWidth={8} fill="none" opacity={0.35} />
        <path d={arcPath(0.33, 0.66, R)} stroke="#f59e0b" strokeWidth={8} fill="none" opacity={0.35} />
        <path d={arcPath(0.66, 1, R)} stroke="#ef4444" strokeWidth={8} fill="none" opacity={0.35} />

        {/* Filled arc up to score */}
        {pct > 0 && <path d={arcPath(0, pct, R)} stroke={color} strokeWidth={8} fill="none" />}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke="#f8fafc" strokeWidth={2} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="#f8fafc" />

        {/* Score */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill={color} fontSize={18} fontWeight="800"
          fontFamily="Inter, sans-serif">{Math.round(score)}</text>
        <text x={cx} y={cy - 1} textAnchor="middle" fill={color} fontSize={8} fontWeight="700"
          letterSpacing="1" fontFamily="Inter, sans-serif">{label2}</text>
      </svg>
      <p className="text-[10px] text-nn-muted tracking-widest uppercase mt-0.5">{label}</p>
    </div>
  )
}
