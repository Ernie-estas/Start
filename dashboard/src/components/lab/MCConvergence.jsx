import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { boxMuller, bsPrice } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

const PATH_COUNTS = [200, 500, 1000, 2000, 5000, 10000, 25000, 50000]

function simulate(S, K, T, r, sigma, N) {
  const drift = (r - 0.5 * sigma * sigma) * T
  const diff  = sigma * Math.sqrt(T)
  let sumP = 0, sumP2 = 0
  let sumA = 0, sumA2 = 0
  let sumC = 0, sumC2 = 0
  const EST = S * Math.exp(r * T)  // E[S_T] under Q
  let n = 0, nA = 0
  for (let i = 0; i < N; i++) {
    const z = boxMuller()
    const ST = S * Math.exp(drift + diff * z)
    const payoff = Math.max(ST - K, 0) * Math.exp(-r * T)
    sumP += payoff
    sumP2 += payoff * payoff
    n++

    // Antithetic — pair with -z
    if (i % 2 === 0) {
      const ST2 = S * Math.exp(drift - diff * z)
      const p2 = Math.max(ST2 - K, 0) * Math.exp(-r * T)
      const avg = (payoff + p2) / 2
      sumA += avg
      sumA2 += avg * avg
      nA++
    }

    // Control variate using S_T
    const cv = payoff - 1 * (ST - EST) * Math.exp(-r * T)
    sumC += cv
    sumC2 += cv * cv
  }
  const meanP = sumP / n
  const meanA = sumA / nA
  const meanC = sumC / n
  const sdP = Math.sqrt(Math.max(0, sumP2 / n - meanP * meanP) / n)
  const sdA = Math.sqrt(Math.max(0, sumA2 / nA - meanA * meanA) / nA)
  const sdC = Math.sqrt(Math.max(0, sumC2 / n - meanC * meanC) / n)
  return { plain: meanP, antithetic: meanA, control: meanC, sdP, sdA, sdC }
}

export default function MCConvergence() {
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [T, setT] = useState(1)
  const [r, setR] = useState(5)
  const [sigma, setSigma] = useState(20)
  const [seed, setSeed] = useState(0)

  const analytical = useMemo(() => bsPrice(S, K, T, r / 100, sigma / 100, 'call'), [S, K, T, r, sigma])

  const data = useMemo(() => {
    void seed
    return PATH_COUNTS.map(N => {
      const m = simulate(S, K, T, r / 100, sigma / 100, N)
      return {
        N,
        plain:      +m.plain.toFixed(4),
        antithetic: +m.antithetic.toFixed(4),
        control:    +m.control.toFixed(4),
        sdP: m.sdP, sdA: m.sdA, sdC: m.sdC,
      }
    })
  }, [S, K, T, r, sigma, seed])

  const last = data[data.length - 1]
  const speedupA = last && last.sdA > 0 ? last.sdP / last.sdA : 0
  const speedupC = last && last.sdC > 0 ? last.sdP / last.sdC : 0

  return (
    <div>
      <ToolHeader title="Monte Carlo Convergence" description="European call estimates under plain MC, antithetic and control-variate variance reduction." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Estimate vs paths (log-x)</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="N" scale="log" domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={analytical} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: `BS = ${analytical.toFixed(3)}`, fill: '#f59e0b', fontSize: 10 }} />
                <Line type="monotone" dataKey="plain"      stroke="#ef4444" strokeWidth={2} name="Plain MC" />
                <Line type="monotone" dataKey="antithetic" stroke="#3b82f6" strokeWidth={2} name="Antithetic" />
                <Line type="monotone" dataKey="control"    stroke="#10b981" strokeWidth={2} name="Control variate" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="section-header mb-2">Std-Error Table</p>
            <table className="w-full text-xs">
              <thead><tr className="text-text-muted border-b border-border-subtle">
                <th className="text-left py-1">N</th><th className="text-right">Plain</th><th className="text-right">SE</th>
                <th className="text-right">Antith.</th><th className="text-right">SE</th>
                <th className="text-right">Control</th><th className="text-right">SE</th>
              </tr></thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.N} className="border-b border-border-subtle/40">
                    <td className="py-1 mono text-text-muted">{d.N.toLocaleString()}</td>
                    <td className="text-right mono">{d.plain.toFixed(4)}</td>
                    <td className="text-right mono text-text-muted">{d.sdP.toExponential(1)}</td>
                    <td className="text-right mono">{d.antithetic.toFixed(4)}</td>
                    <td className="text-right mono text-text-muted">{d.sdA.toExponential(1)}</td>
                    <td className="text-right mono">{d.control.toFixed(4)}</td>
                    <td className="text-right mono text-text-muted">{d.sdC.toExponential(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="Spot S"   value={S} onChange={setS} min={1} max={300} step={1} />
            <ParamSlider label="Strike K" value={K} onChange={setK} min={1} max={300} step={1} />
            <ParamSlider label="Maturity T" value={T} onChange={setT} min={0.05} max={3} step={0.05} unit="y" format={v => v.toFixed(2)} />
            <ParamSlider label="Rate r"   value={r} onChange={setR} min={0} max={15} step={0.25} unit="%" format={v => v.toFixed(2)} />
            <ParamSlider label="Vol σ"    value={sigma} onChange={setSigma} min={1} max={150} step={1} unit="%" />
            <button onClick={() => setSeed(s => s + 1)} className="btn-ghost w-full text-xs mt-2">Re-simulate</button>
          </div>

          <div className="card space-y-2">
            <p className="section-header mb-1">Output</p>
            <MetricTile label="BS analytical" value={analytical.toFixed(4)} color="#f59e0b" />
            <MetricTile label="Plain (largest N)"      value={last?.plain.toFixed(4)} />
            <MetricTile label="Antithetic"             value={last?.antithetic.toFixed(4)} color="#3b82f6" />
            <MetricTile label="Control variate"        value={last?.control.toFixed(4)} color="#10b981" />
            <MetricTile label="SE reduction (Antith.)" value={speedupA.toFixed(2) + '×'} color="#3b82f6" />
            <MetricTile label="SE reduction (Control)" value={speedupC.toFixed(2) + '×'} color="#10b981" />
          </div>
        </div>
      </div>

      <MathNote>
        Plain MC SE = O(σ/√N). Antithetic reduces variance when payoff is monotone in z. Control variate uses E[S<sub>T</sub>] = S·e<sup>rT</sup>.
      </MathNote>
    </div>
  )
}
