import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { gbmPath, percentile, normalPDF } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

export default function GBMSimulator() {
  const [S0, setS0]    = useState(100)
  const [mu, setMu]    = useState(8)
  const [sigma, setSigma] = useState(20)
  const [T, setT]      = useState(2)
  const [N, setN]      = useState(60)
  const [seed, setSeed] = useState(0)

  const stepsPerYear = 52
  const steps = Math.max(20, Math.round(T * stepsPerYear))

  const paths = useMemo(() => {
    // seed unused, but referenced so re-rolling button triggers recompute
    void seed
    const out = []
    for (let i = 0; i < N; i++) out.push(gbmPath(S0, mu / 100, sigma / 100, T, steps))
    return out
  }, [S0, mu, sigma, T, N, steps, seed])

  const chartData = useMemo(() => {
    const data = []
    for (let t = 0; t <= steps; t++) {
      const row = { t: +(t * T / steps).toFixed(2) }
      paths.forEach((p, i) => { row['p' + i] = +p[t].toFixed(2) })
      data.push(row)
    }
    return data
  }, [paths, steps, T])

  const terminals = paths.map(p => p[p.length - 1])
  const meanT = terminals.reduce((s, x) => s + x, 0) / terminals.length
  const median = percentile(terminals, 50)
  const p5  = percentile(terminals, 5)
  const p95 = percentile(terminals, 95)
  const pUp = terminals.filter(v => v > S0).length / terminals.length
  const analyticalMean = S0 * Math.exp(mu / 100 * T)

  const histData = useMemo(() => {
    const min = Math.min(...terminals), max = Math.max(...terminals)
    const buckets = 24
    const bw = (max - min) / buckets || 1
    const hist = Array.from({ length: buckets }, (_, i) => ({
      x: +(min + (i + 0.5) * bw).toFixed(2),
      count: 0,
      pdf: 0,
    }))
    terminals.forEach(v => {
      const idx = Math.min(buckets - 1, Math.floor((v - min) / bw))
      if (idx >= 0) hist[idx].count++
    })
    // overlay theoretical log-normal PDF (scaled to histogram count)
    const muLog = Math.log(S0) + (mu / 100 - 0.5 * (sigma / 100) ** 2) * T
    const sigLog = (sigma / 100) * Math.sqrt(T)
    hist.forEach(b => {
      const z = (Math.log(b.x) - muLog) / sigLog
      const pdf = normalPDF(z) / (b.x * sigLog)
      b.pdf = +(pdf * terminals.length * bw).toFixed(2)
    })
    return hist
  }, [terminals, S0, mu, sigma, T])

  return (
    <div>
      <ToolHeader title="Geometric Brownian Motion" description="Simulate stock-price paths under log-normal dynamics with drift and diffusion." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-2">Sample Paths</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}y`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v?.toFixed(2)} labelFormatter={v => `t = ${v}y`} />
                {paths.map((_, i) => (
                  <Line key={i} type="monotone" dataKey={'p' + i} stroke="#3b82f6" strokeWidth={1} dot={false} opacity={0.18} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <p className="section-header mb-2">Terminal Distribution</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#3b82f6" opacity={0.5} />
                <Line type="monotone" dataKey="pdf" stroke="#10b981" strokeWidth={1.5} dot={false} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-text-muted mt-1">Bars: simulated. Green curve: theoretical log-normal PDF.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card">
            <p className="section-header mb-3">Parameters</p>
            <ParamSlider label="Initial price S₀" value={S0} onChange={setS0} min={10} max={500} step={5} unit="" />
            <ParamSlider label="Drift μ"     value={mu} onChange={setMu} min={-20} max={30} step={0.5} unit="%" format={v => v.toFixed(1)} />
            <ParamSlider label="Volatility σ" value={sigma} onChange={setSigma} min={1} max={80} step={1} unit="%" />
            <ParamSlider label="Horizon T"   value={T} onChange={setT} min={0.25} max={10} step={0.25} unit="y" format={v => v.toFixed(2)} />
            <ParamSlider label="Paths"       value={N} onChange={setN} min={10} max={200} step={10} />
            <button onClick={() => setSeed(s => s + 1)} className="btn-ghost w-full text-xs mt-2">Re-roll</button>
          </div>

          <div className="card">
            <p className="section-header mb-3">Output</p>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="Analytical E[S_T]" value={analyticalMean.toFixed(2)} color="#22d3ee" />
              <MetricTile label="Sim mean"   value={meanT.toFixed(2)} color="#3b82f6" />
              <MetricTile label="Median"     value={median.toFixed(2)} />
              <MetricTile label="P(S_T > S₀)" value={(pUp * 100).toFixed(1) + '%'} color={pUp >= 0.5 ? '#10b981' : '#ef4444'} />
              <MetricTile label="5th pctile" value={p5.toFixed(2)} color="#ef4444" />
              <MetricTile label="95th pctile" value={p95.toFixed(2)} color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      <MathNote>
        dS/S = μ dt + σ dW &nbsp;⟹&nbsp; S(t) = S₀·exp((μ - σ²/2)·t + σ·W(t))
        <br />
        The Itô correction (-σ²/2) ensures E[S(t)] = S₀·exp(μt), not S₀·exp((μ+σ²/2)t).
      </MathNote>
    </div>
  )
}
