import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { hestonPath } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

export default function HestonSimulator() {
  const [S0, setS0]     = useState(100)
  const [v0, setV0]     = useState(0.04)
  const [kappa, setKappa] = useState(2)
  const [theta, setTheta] = useState(0.04)
  const [xi, setXi]     = useState(0.5)
  const [rho, setRho]   = useState(-0.5)
  const [mu, setMu]     = useState(5)
  const [T, setT]       = useState(1)
  const [seed, setSeed] = useState(0)

  const N = 30
  const steps = 252

  const paths = useMemo(() => {
    void seed
    return Array.from({ length: N }, () => hestonPath(S0, v0, kappa, theta, xi, rho, mu / 100, T, steps))
  }, [S0, v0, kappa, theta, xi, rho, mu, T, seed])

  const chartS = useMemo(() => {
    const out = []
    for (let i = 0; i <= steps; i++) {
      const row = { t: +(i * T / steps).toFixed(3) }
      paths.forEach((p, k) => { row['p' + k] = +p.S[i].toFixed(2) })
      out.push(row)
    }
    return out
  }, [paths, steps, T])

  const chartV = useMemo(() => {
    const out = []
    for (let i = 0; i <= steps; i++) {
      const row = { t: +(i * T / steps).toFixed(3) }
      paths.forEach((p, k) => { row['v' + k] = +(p.v[i] * 100).toFixed(2) })
      out.push(row)
    }
    return out
  }, [paths, steps, T])

  const terminals = paths.map(p => p.S[p.S.length - 1])
  const logReturns = terminals.map(s => Math.log(s / S0))
  const mean = logReturns.reduce((s, x) => s + x, 0) / logReturns.length
  const variance = logReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / logReturns.length
  const skew = logReturns.reduce((s, x) => s + Math.pow(x - mean, 3), 0) / (logReturns.length * Math.pow(variance, 1.5))
  const realisedVol = Math.sqrt(variance / T) * 100

  return (
    <div>
      <ToolHeader title="Heston Stochastic Volatility" description="Coupled SDEs for stock price and instantaneous variance with mean-reverting vol." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Price paths S(t)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartS} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}y`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v?.toFixed(2)} labelFormatter={v => `t = ${v}y`} />
                {paths.map((_, i) => (
                  <Line key={i} type="monotone" dataKey={'p' + i} stroke="#3b82f6" strokeWidth={1} dot={false} opacity={0.3} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="section-header mb-2">Variance paths v(t) — %</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartV} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}y`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `${v?.toFixed(2)}%`} />
                {paths.map((_, i) => (
                  <Line key={i} type="monotone" dataKey={'v' + i} stroke="#a855f7" strokeWidth={1} dot={false} opacity={0.35} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="κ mean-reversion"  value={kappa} onChange={setKappa} min={0.1} max={5} step={0.1} format={v => v.toFixed(1)} />
            <ParamSlider label="θ long-run var"    value={theta} onChange={setTheta} min={0.005} max={0.25} step={0.005} format={v => v.toFixed(3)} />
            <ParamSlider label="ξ vol-of-vol"      value={xi} onChange={setXi} min={0} max={1.5} step={0.05} format={v => v.toFixed(2)} accent="#a855f7" />
            <ParamSlider label="ρ correlation"     value={rho} onChange={setRho} min={-1} max={1} step={0.05} format={v => v.toFixed(2)} accent={rho < 0 ? '#ef4444' : '#10b981'} />
            <ParamSlider label="v₀ initial var"    value={v0} onChange={setV0} min={0.005} max={0.25} step={0.005} format={v => v.toFixed(3)} />
            <ParamSlider label="μ drift"           value={mu} onChange={setMu} min={-10} max={20} step={0.5} unit="%" format={v => v.toFixed(1)} />
            <ParamSlider label="Horizon T"         value={T} onChange={setT} min={0.25} max={5} step={0.25} unit="y" format={v => v.toFixed(2)} />
            <button onClick={() => setSeed(s => s + 1)} className="btn-ghost w-full text-xs mt-2">Re-roll</button>
          </div>

          <div className="card space-y-2">
            <p className="section-header mb-1">Output</p>
            <MetricTile label="Realised vol" value={realisedVol.toFixed(2) + '%'} color="#3b82f6" />
            <MetricTile label="Long-run vol √θ" value={(Math.sqrt(theta) * 100).toFixed(2) + '%'} color="#22d3ee" />
            <MetricTile label="Skew (log-ret)" value={skew.toFixed(3)} color={skew < 0 ? '#ef4444' : '#10b981'} sub={rho < 0 ? 'Negative ρ → negative skew' : ''} />
            <MetricTile label="Mean log-return" value={(mean * 100).toFixed(2) + '%'} />
          </div>
        </div>
      </div>

      <MathNote>
        dS/S = μ dt + √v dW<sub>S</sub>;&nbsp; dv = κ(θ − v) dt + ξ√v dW<sub>v</sub>;&nbsp; corr(dW<sub>S</sub>, dW<sub>v</sub>) = ρ.
        Feller condition: 2κθ &gt; ξ² → variance stays positive. Negative ρ produces the equity vol smile.
      </MathNote>
    </div>
  )
}
