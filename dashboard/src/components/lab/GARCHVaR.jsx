import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { garchSimulate, garchForecast } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

export default function GARCHVaR() {
  const [omega, setOmega] = useState(0.00002)
  const [alpha, setAlpha] = useState(0.09)
  const [beta, setBeta]   = useState(0.89)
  const [sigma0, setSigma0] = useState(1)
  const [T, setT]         = useState(500)
  const [seed, setSeed]   = useState(0)

  const sim = useMemo(() => {
    void seed
    return garchSimulate(omega, alpha, beta, T, sigma0 / 100)
  }, [omega, alpha, beta, sigma0, T, seed])

  const histData = useMemo(() => sim.returns.map((r, i) => ({
    t: i, ret: +(r * 100).toFixed(3), vol: +(sim.vol[i] * 100).toFixed(3), volNeg: -(sim.vol[i] * 100).toFixed(3),
  })), [sim])

  const forecast = useMemo(() => {
    const fc = garchForecast(omega, alpha, beta, sim.last_vol, sim.returns[sim.returns.length - 1], 30)
    return fc.map((v, i) => ({ t: i + 1, vol: +(v * 100).toFixed(3), upper: +(2.326 * v * 100).toFixed(3), lower: -(2.326 * v * 100).toFixed(3) }))
  }, [omega, alpha, beta, sim])

  const persistence = sim.persistence
  const persistColor = persistence >= 1 ? '#ef4444' : persistence >= 0.99 ? '#f59e0b' : '#10b981'

  return (
    <div>
      <ToolHeader title="GARCH(1,1) & 99% VaR" description="Conditional volatility with mean-reverting persistence and value-at-risk forecasting." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Returns + Conditional Vol (%)</p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={histData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v?.toFixed(3) + '%'} />
                <ReferenceLine y={0} stroke="#2a2f45" />
                <Line type="monotone" dataKey="ret" stroke="#94a3b8" strokeWidth={0.7} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="vol" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="volNeg" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="section-header mb-2">30-Day Vol Forecast + 99% VaR Band</p>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={forecast} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `+${v}d`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v?.toFixed(3) + '%'} />
                <ReferenceLine y={0} stroke="#2a2f45" />
                <Area type="monotone" dataKey="upper" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeOpacity={0.4} />
                <Area type="monotone" dataKey="lower" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeOpacity={0.4} />
                <Line type="monotone" dataKey="vol" stroke="#a855f7" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="ω (intercept × 10⁵)" value={omega * 100000} onChange={v => setOmega(v / 100000)} min={0.1} max={20} step={0.1} format={v => v.toFixed(2)} />
            <ParamSlider label="α (ARCH)" value={alpha} onChange={setAlpha} min={0} max={0.3} step={0.005} format={v => v.toFixed(3)} accent="#a855f7" />
            <ParamSlider label="β (GARCH)" value={beta} onChange={setBeta} min={0.5} max={0.999} step={0.005} format={v => v.toFixed(3)} accent="#22d3ee" />
            <ParamSlider label="Initial vol σ₀" value={sigma0} onChange={setSigma0} min={0.1} max={5} step={0.1} unit="%" format={v => v.toFixed(2)} />
            <ParamSlider label="Days T" value={T} onChange={setT} min={100} max={2000} step={50} />
            <button onClick={() => setSeed(s => s + 1)} className="btn-ghost w-full text-xs mt-2">Re-simulate</button>
          </div>

          <div className="card space-y-2">
            <p className="section-header mb-1">Output</p>
            <MetricTile label="Persistence α+β" value={persistence.toFixed(4)} color={persistColor} sub={persistence >= 1 ? 'Non-stationary' : persistence >= 0.99 ? 'Near unit-root' : 'Stationary'} />
            <MetricTile label="Unconditional vol" value={sim.unconditional_vol ? (sim.unconditional_vol * 100).toFixed(2) + '%' : '—'} color="#22d3ee" />
            <MetricTile label="Current σ_T" value={(sim.last_vol * 100).toFixed(3) + '%'} color="#3b82f6" />
            <MetricTile label="1-day 99% VaR" value={(sim.var99 * 100).toFixed(3) + '%'} color="#ef4444" sub="loss threshold" />
          </div>
        </div>
      </div>

      <MathNote>
        σ²<sub>t</sub> = ω + α·r²<sub>t-1</sub> + β·σ²<sub>t-1</sub>. Persistence α+β controls how slowly shocks decay; if ≥ 1 the variance process is non-stationary.
      </MathNote>
    </div>
  )
}
