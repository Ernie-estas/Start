import { useState, useMemo, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { impliedVolIterations, bsPrice } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

export default function ImpliedVolSolver() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T, setT] = useState(1)
  const [r, setR] = useState(5)
  const [target, setTarget] = useState(10.45)
  const [iterations, setIterations] = useState([])
  const [running, setRunning] = useState(false)
  const timer = useRef(null)

  // Reference BS prices for slider context
  const bsAt20 = useMemo(() => bsPrice(S, K, T, r / 100, 0.2, 'call'), [S, K, T, r])

  useEffect(() => () => clearInterval(timer.current), [])

  function start() {
    clearInterval(timer.current)
    setIterations([])
    setRunning(true)
    const gen = impliedVolIterations(target, S, K, T, r / 100, 'call')
    const collected = []
    timer.current = setInterval(() => {
      const next = gen.next()
      if (next.done) {
        clearInterval(timer.current)
        setRunning(false)
        return
      }
      collected.push(next.value)
      setIterations([...collected])
      if (next.value.error < 1e-5) {
        clearInterval(timer.current)
        setRunning(false)
      }
    }, 250)
  }

  function runAll() {
    clearInterval(timer.current)
    const out = []
    for (const it of impliedVolIterations(target, S, K, T, r / 100, 'call')) {
      out.push(it)
      if (it.error < 1e-5) break
    }
    setIterations(out)
    setRunning(false)
  }

  const last = iterations[iterations.length - 1]
  const converged = last && last.error < 1e-5

  return (
    <div>
      <ToolHeader title="Implied Volatility — Newton-Raphson" description="Invert Black-Scholes to recover σ from an observed call price." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Convergence (error vs iteration)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={iterations} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="iter" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis scale="log" domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [typeof v === 'number' ? v.toExponential(2) : v, name]} />
                <ReferenceLine y={1e-5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'tol', fill: '#10b981', fontSize: 9 }} />
                <Line type="monotone" dataKey="error" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, fill: '#a855f7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="section-header mb-2">Iteration Trace</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border-subtle">
                    <th className="text-left py-1 font-medium">i</th>
                    <th className="text-right py-1 font-medium">σᵢ</th>
                    <th className="text-right py-1 font-medium">BS(σᵢ)</th>
                    <th className="text-right py-1 font-medium">|err|</th>
                  </tr>
                </thead>
                <tbody>
                  {iterations.map((it, i) => (
                    <tr key={i} className="border-b border-border-subtle/40">
                      <td className="py-1 mono text-text-muted">{it.iter}</td>
                      <td className="text-right mono">{(it.sigma * 100).toFixed(4)}%</td>
                      <td className="text-right mono">{it.price.toFixed(4)}</td>
                      <td className="text-right mono" style={{ color: it.error < 1e-5 ? '#10b981' : '#94a3b8' }}>{it.error.toExponential(2)}</td>
                    </tr>
                  ))}
                  {!iterations.length && (
                    <tr><td colSpan={4} className="py-3 text-center text-text-muted">Press Run to solve.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="Observed call price" value={target} onChange={setTarget} min={0.1} max={Math.max(50, S * 0.5)} step={0.1} format={v => v.toFixed(2)} accent="#a855f7" />
            <p className="text-[10px] text-text-muted mb-2 -mt-2">BS(σ=20%) = {bsAt20.toFixed(3)}</p>
            <ParamSlider label="Spot S"     value={S} onChange={setS} min={1} max={300} step={1} />
            <ParamSlider label="Strike K"   value={K} onChange={setK} min={1} max={300} step={1} />
            <ParamSlider label="Maturity T" value={T} onChange={setT} min={0.05} max={3} step={0.05} unit="y" format={v => v.toFixed(2)} />
            <ParamSlider label="Rate r"     value={r} onChange={setR} min={0} max={15} step={0.25} unit="%" format={v => v.toFixed(2)} />
            <div className="flex gap-2 mt-3">
              <button onClick={start} disabled={running} className="btn-primary flex-1 text-xs disabled:opacity-50">{running ? 'Running…' : 'Run animated'}</button>
              <button onClick={runAll} className="btn-ghost flex-1 text-xs">Run all</button>
            </div>
          </div>

          <div className="card">
            <p className="section-header mb-3">Result</p>
            <div className="space-y-2">
              <MetricTile label="Implied σ" value={last ? (last.sigma * 100).toFixed(3) + '%' : '—'} color={converged ? '#10b981' : '#94a3b8'} />
              <MetricTile label="Iterations" value={iterations.length || '—'} />
              <MetricTile label="Final error" value={last ? last.error.toExponential(2) : '—'} color={converged ? '#10b981' : '#ef4444'} />
            </div>
          </div>
        </div>
      </div>

      <MathNote>
        σ<sub>i+1</sub> = σ<sub>i</sub> − (BS(σ<sub>i</sub>) − C*) / Vega(σ<sub>i</sub>). Quadratic convergence near the root.
      </MathNote>
    </div>
  )
}
