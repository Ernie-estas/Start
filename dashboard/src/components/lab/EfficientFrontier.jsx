import { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts'
import { inverseMatrix, matvec, dot } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

const ASSET_NAMES = ['Asset A', 'Asset B', 'Asset C', 'Asset D', 'Asset E']

function buildCov(sigmas, rho) {
  const n = sigmas.length
  const S = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      S[i][j] = (i === j ? 1 : rho) * sigmas[i] * sigmas[j]
  return S
}

export default function EfficientFrontier() {
  const [mus, setMus]       = useState([6, 8, 10, 12, 14])
  const [sigmas, setSigmas] = useState([12, 16, 20, 22, 28])
  const [rho, setRho]       = useState(20)  // 0–100 → -1..1 via /100*2-1? we'll use -1..1 range directly
  const [rf, setRf]         = useState(2)
  const [seed, setSeed]     = useState(0)

  const cov = useMemo(() => buildCov(sigmas.map(s => s / 100), rho / 100), [sigmas, rho])
  const muVec = mus.map(m => m / 100)

  const random = useMemo(() => {
    void seed
    const out = []
    const n = mus.length
    for (let i = 0; i < 2000; i++) {
      const w = Array.from({ length: n }, () => Math.random())
      const sum = w.reduce((s, x) => s + x, 0)
      const ws = w.map(x => x / sum)
      const muP = dot(ws, muVec)
      const varP = dot(ws, matvec(cov, ws))
      out.push({ sigma: Math.sqrt(varP) * 100, ret: muP * 100, ws })
    }
    return out
  }, [muVec, cov, seed])

  const minVar = useMemo(() => {
    try {
      const Sinv = inverseMatrix(cov)
      const ones = new Array(mus.length).fill(1)
      const Sinv1 = matvec(Sinv, ones)
      const denom = dot(ones, Sinv1)
      const w = Sinv1.map(x => x / denom)
      const muP = dot(w, muVec)
      const varP = dot(w, matvec(cov, w))
      return { w, sigma: Math.sqrt(varP) * 100, ret: muP * 100 }
    } catch {
      return null
    }
  }, [muVec, cov])

  const maxSharpe = useMemo(() => {
    let best = null
    random.forEach(p => {
      const sr = (p.ret - rf) / p.sigma
      if (!best || sr > best.sr) best = { ...p, sr }
    })
    return best
  }, [random, rf])

  // Frontier curve: bin random by sigma and take max return per bin
  const frontier = useMemo(() => {
    const bins = 30
    const ss = random.map(p => p.sigma)
    const min = Math.min(...ss), max = Math.max(...ss)
    const bw = (max - min) / bins
    const buckets = Array(bins).fill(null)
    random.forEach(p => {
      const idx = Math.min(bins - 1, Math.floor((p.sigma - min) / bw))
      if (!buckets[idx] || p.ret > buckets[idx].ret) buckets[idx] = p
    })
    return buckets.filter(Boolean).sort((a, b) => a.sigma - b.sigma)
  }, [random])

  function updateMu(i, v) { setMus(prev => prev.map((x, k) => (k === i ? v : x))) }
  function updateSig(i, v) { setSigmas(prev => prev.map((x, k) => (k === i ? v : x))) }

  return (
    <div>
      <ToolHeader title="Efficient Frontier" description="Mean-variance optimisation across 5 assets with adjustable correlation." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Risk-Return Plane</p>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" />
                <XAxis type="number" dataKey="sigma" name="σ" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="number" dataKey="ret"   name="E[R]" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v.toFixed(2) + '%'} cursor={{ stroke: '#3b82f6', strokeDasharray: '3 3' }} />
                <Scatter data={random} fill="#6b7280" opacity={0.35} />
                <Scatter data={frontier} fill="#3b82f6" opacity={0.9} shape="circle" />
                {minVar && <Scatter data={[minVar]} fill="#10b981" shape={({ cx, cy }) => <circle cx={cx} cy={cy} r={7} fill="#10b981" stroke="#fff" strokeWidth={2} />} />}
                {maxSharpe && <Scatter data={[maxSharpe]} fill="#f59e0b" shape={({ cx, cy }) => (
                  <polygon points={`${cx},${cy - 9} ${cx + 3},${cy - 3} ${cx + 9},${cy - 3} ${cx + 4},${cy + 2} ${cx + 6},${cy + 9} ${cx},${cy + 5} ${cx - 6},${cy + 9} ${cx - 4},${cy + 2} ${cx - 9},${cy - 3} ${cx - 3},${cy - 3}`} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
                )} />}
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 text-[10px] text-text-muted mt-1">
              <span><span className="inline-block w-2 h-2 rounded-full bg-text-muted opacity-50 mr-1" />Random portfolios</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-accent-blue mr-1" />Frontier</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-accent-green mr-1" />Min variance</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-accent-amber mr-1" />Max Sharpe</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Min Variance', d: minVar, c: '#10b981' },
              { name: 'Max Sharpe',   d: maxSharpe, c: '#f59e0b' },
            ].map(({ name, d, c }) => (
              <div key={name} className="card">
                <p className="section-header mb-2">{name} Weights</p>
                {d ? (
                  <>
                    <div className="flex justify-between text-[11px] mb-2">
                      <span>E[R] <span className="mono font-semibold" style={{ color: c }}>{d.ret.toFixed(2)}%</span></span>
                      <span>σ <span className="mono font-semibold" style={{ color: c }}>{d.sigma.toFixed(2)}%</span></span>
                    </div>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={d.w.map((w, i) => ({ asset: ASSET_NAMES[i].replace('Asset ', ''), w: w * 100 }))}>
                        <XAxis dataKey="asset" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v.toFixed(1) + '%'} />
                        <Bar dataKey="w" radius={[2, 2, 0, 0]}>
                          {d.w.map((_, i) => <Cell key={i} fill={c} opacity={0.85} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : <p className="text-xs text-text-muted">Singular Σ</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Expected Returns (per asset)</p>
            {mus.map((m, i) => (
              <ParamSlider key={i} label={ASSET_NAMES[i]} value={m} onChange={v => updateMu(i, v)} min={-10} max={30} step={0.5} unit="%" format={v => v.toFixed(1)} accent="#3b82f6" />
            ))}
          </div>
          <div className="card">
            <p className="section-header mb-3">Volatilities (per asset)</p>
            {sigmas.map((s, i) => (
              <ParamSlider key={i} label={ASSET_NAMES[i]} value={s} onChange={v => updateSig(i, v)} min={5} max={60} step={1} unit="%" accent="#a855f7" />
            ))}
            <ParamSlider label="Average correlation ρ" value={rho} onChange={setRho} min={-99} max={99} step={1} format={v => (v / 100).toFixed(2)} accent="#e879f9" />
            <ParamSlider label="Risk-free rate" value={rf} onChange={setRf} min={0} max={10} step={0.1} unit="%" format={v => v.toFixed(2)} accent="#22d3ee" />
            <button onClick={() => setSeed(s => s + 1)} className="btn-ghost w-full text-xs mt-2">Re-roll portfolios</button>
          </div>
        </div>
      </div>

      <MathNote>
        Min variance: w* = Σ⁻¹·1 / (1ᵀΣ⁻¹·1).&nbsp; Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub>; the tangent portfolio maximises it.
      </MathNote>
    </div>
  )
}
