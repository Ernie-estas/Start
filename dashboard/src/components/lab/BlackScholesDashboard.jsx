import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { bsGreeks } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

export default function BlackScholesDashboard() {
  const [S, setS]     = useState(100)
  const [K, setK]     = useState(100)
  const [T, setT]     = useState(1)
  const [r, setR]     = useState(5)
  const [sigma, setSigma] = useState(20)

  const g = useMemo(() => bsGreeks(S, K, T, r / 100, sigma / 100), [S, K, T, r, sigma])

  const chartData = useMemo(() => {
    const lo = 0.5 * K, hi = 1.5 * K
    const out = []
    for (let i = 0; i <= 80; i++) {
      const s = lo + (hi - lo) * i / 80
      const gg = bsGreeks(s, K, T, r / 100, sigma / 100)
      out.push({ S: +s.toFixed(2), call: +gg.call.toFixed(3), put: +gg.put.toFixed(3), delta: +gg.delta_call.toFixed(4) })
    }
    return out
  }, [K, T, r, sigma])

  return (
    <div>
      <ToolHeader title="Black-Scholes Greeks" description="Closed-form European option pricer with all five sensitivities." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Price vs Spot</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="S" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="L" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="R" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <ReferenceLine x={S} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="L" />
                <ReferenceLine x={K} stroke="#f59e0b" strokeDasharray="3 3" yAxisId="L" label={{ value: 'K', fill: '#f59e0b', fontSize: 10 }} />
                <Line yAxisId="L" type="monotone" dataKey="call" stroke="#10b981" strokeWidth={2} dot={false} name="Call" />
                <Line yAxisId="L" type="monotone" dataKey="put"  stroke="#ef4444" strokeWidth={2} dot={false} name="Put"  />
                <Line yAxisId="R" type="monotone" dataKey="delta" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Δ call" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricTile label="Call" value={g.call.toFixed(3)} color="#10b981" />
            <MetricTile label="Put"  value={g.put.toFixed(3)} color="#ef4444" />
            <MetricTile label="Δ call / Δ put" value={`${g.delta_call.toFixed(3)} / ${g.delta_put.toFixed(3)}`} color="#3b82f6" />
            <MetricTile label="Γ"  value={g.gamma.toFixed(4)} color="#22d3ee" />
            <MetricTile label="Vega (per 1%)" value={g.vega.toFixed(3)} color="#a855f7" />
            <MetricTile label="Θ (call, per day)" value={g.theta_call.toFixed(4)} color={g.theta_call < 0 ? '#ef4444' : '#10b981'} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="Spot S"     value={S} onChange={setS} min={1} max={300} step={1} />
            <ParamSlider label="Strike K"   value={K} onChange={setK} min={1} max={300} step={1} />
            <ParamSlider label="Maturity T" value={T} onChange={setT} min={0.05} max={3} step={0.05} unit="y" format={v => v.toFixed(2)} />
            <ParamSlider label="Rate r"     value={r} onChange={setR} min={0} max={15} step={0.25} unit="%" format={v => v.toFixed(2)} />
            <ParamSlider label="Volatility σ" value={sigma} onChange={setSigma} min={1} max={150} step={1} unit="%" />
          </div>

          <div className="card text-[11px] text-text-secondary space-y-1.5">
            <div className="flex justify-between"><span className="text-text-muted">d1</span><span className="mono">{g.d1.toFixed(4)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">d2</span><span className="mono">{g.d2.toFixed(4)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Put-call parity check</span><span className="mono">{(g.call - g.put + K * Math.exp(-r / 100 * T) - S).toExponential(1)}</span></div>
          </div>
        </div>
      </div>

      <MathNote>
        C = S·N(d₁) − K·e<sup>−rT</sup>·N(d₂), &nbsp; d₁ = [ln(S/K) + (r+σ²/2)T] / (σ√T), &nbsp; d₂ = d₁ − σ√T
      </MathNote>
    </div>
  )
}
