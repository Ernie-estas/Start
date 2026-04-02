import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Play, RefreshCw, Settings, TrendingUp, TrendingDown, Activity } from 'lucide-react'

const NUM_PATHS = 500
const YEARS = 10
const STEPS_PER_YEAR = 12

function generatePaths(initialValue, annualReturn, annualVol, numPaths, years, stepsPerYear) {
  const dt = 1 / stepsPerYear
  const drift = (annualReturn / 100 - 0.5 * (annualVol / 100) ** 2) * dt
  const diffusion = (annualVol / 100) * Math.sqrt(dt)
  const totalSteps = years * stepsPerYear
  const paths = []

  for (let p = 0; p < numPaths; p++) {
    const path = [initialValue]
    let value = initialValue
    for (let s = 0; s < totalSteps; s++) {
      const z = boxMuller()
      value = value * Math.exp(drift + diffusion * z)
      path.push(value)
    }
    paths.push(path)
  }
  return paths
}

function boxMuller() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function getPercentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((pct / 100) * (sorted.length - 1))
  return sorted[idx]
}

function buildTimeSeries(paths, years, stepsPerYear) {
  const totalSteps = years * stepsPerYear + 1
  const series = []
  for (let t = 0; t < totalSteps; t += stepsPerYear) {
    const vals = paths.map(p => p[t])
    series.push({
      year: t / stepsPerYear,
      p5: getPercentile(vals, 5),
      p25: getPercentile(vals, 25),
      median: getPercentile(vals, 50),
      p75: getPercentile(vals, 75),
      p95: getPercentile(vals, 95),
    })
  }
  return series
}

function buildFinalDist(paths) {
  const finals = paths.map(p => p[p.length - 1])
  const min = Math.min(...finals)
  const max = Math.max(...finals)
  const buckets = 30
  const bw = (max - min) / buckets
  const hist = Array(buckets).fill(0).map((_, i) => ({
    x: (min + i * bw) / 1000,
    count: 0,
  }))
  finals.forEach(v => {
    const i = Math.min(Math.floor((v - min) / bw), buckets - 1)
    hist[i].count++
  })
  return hist
}

const PRESETS = [
  { label: 'Conservative', ret: 5, vol: 8 },
  { label: 'Moderate', ret: 8, vol: 14 },
  { label: 'Aggressive', ret: 12, vol: 22 },
  { label: 'S&P 500 Hist.', ret: 10.5, vol: 18 },
  { label: 'NASDAQ Hist.', ret: 13, vol: 24 },
]

function MonteCarloCanvas({ paths, animFrame }) {
  const canvasRef = useRef(null)
  const W = 800, H = 300

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || paths.length === 0) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const allVals = paths.flatMap(p => p)
    const minV = Math.min(...allVals) * 0.95
    const maxV = Math.max(...allVals) * 1.05
    const totalSteps = paths[0].length - 1

    const toX = t => (t / totalSteps) * W
    const toY = v => H - ((v - minV) / (maxV - minV)) * H

    const drawCount = Math.min(animFrame, paths.length)

    // Draw background paths
    for (let p = 0; p < drawCount; p++) {
      const finalVal = paths[p][paths[p].length - 1]
      const initVal = paths[p][0]
      const isUp = finalVal > initVal

      ctx.beginPath()
      ctx.moveTo(toX(0), toY(paths[p][0]))
      for (let t = 1; t < paths[p].length; t++) {
        ctx.lineTo(toX(t), toY(paths[p][t]))
      }
      ctx.strokeStyle = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.10)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw percentile bands
    const finals = paths.map(p => p[p.length - 1])
    const p10 = getPercentile(finals, 10)
    const p50 = getPercentile(finals, 50)
    const p90 = getPercentile(finals, 90)

    const drawPercentilePath = (pct, color, width) => {
      const target = getPercentile(finals, pct)
      const bestPath = paths.reduce((best, p) => {
        return Math.abs(p[p.length - 1] - target) < Math.abs(best[best.length - 1] - target) ? p : best
      }, paths[0])

      ctx.beginPath()
      ctx.moveTo(toX(0), toY(bestPath[0]))
      for (let t = 1; t < bestPath.length; t++) {
        ctx.lineTo(toX(t), toY(bestPath[t]))
      }
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke()
    }

    if (drawCount > 50) {
      drawPercentilePath(10, 'rgba(239, 68, 68, 0.8)', 2)
      drawPercentilePath(90, 'rgba(16, 185, 129, 0.8)', 2)
    }
    if (drawCount > 100) {
      drawPercentilePath(50, 'rgba(59, 130, 246, 1)', 2.5)
    }

  }, [paths, animFrame])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="w-full h-full rounded-lg"
      style={{ aspectRatio: `${W}/${H}` }}
    />
  )
}

export default function MonteCarlo() {
  const [initialValue, setInitialValue] = useState(100000)
  const [annualReturn, setAnnualReturn] = useState(8)
  const [annualVol, setAnnualVol] = useState(14)
  const [years, setYears] = useState(10)
  const [numPaths, setNumPaths] = useState(NUM_PATHS)
  const [monthly, setMonthly] = useState(0)

  const [paths, setPaths] = useState([])
  const [animFrame, setAnimFrame] = useState(0)
  const [running, setRunning] = useState(false)
  const animRef = useRef(null)

  const run = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setRunning(true)
    setAnimFrame(0)

    const generated = generatePaths(initialValue, annualReturn, annualVol, numPaths, years, STEPS_PER_YEAR)
    // Apply monthly contributions
    if (monthly > 0) {
      for (let p = 0; p < generated.length; p++) {
        let extra = 0
        for (let t = 1; t < generated[p].length; t++) {
          extra = (extra + monthly) * Math.exp((annualReturn / 100 / STEPS_PER_YEAR))
          generated[p][t] += extra
        }
      }
    }
    setPaths(generated)

    let frame = 0
    const step = () => {
      frame += Math.ceil(numPaths / 60)
      setAnimFrame(Math.min(frame, numPaths))
      if (frame < numPaths) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setRunning(false)
      }
    }
    animRef.current = requestAnimationFrame(step)
  }, [initialValue, annualReturn, annualVol, years, numPaths, monthly])

  useEffect(() => {
    run()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  const stats = useMemo(() => {
    if (paths.length === 0) return null
    const finals = paths.map(p => p[p.length - 1])
    return {
      median: getPercentile(finals, 50),
      p10: getPercentile(finals, 10),
      p90: getPercentile(finals, 90),
      pctProfit: (finals.filter(v => v > initialValue).length / finals.length * 100).toFixed(1),
      mean: finals.reduce((a, b) => a + b, 0) / finals.length,
      cagr: ((getPercentile(finals, 50) / initialValue) ** (1 / years) - 1) * 100,
    }
  }, [paths, initialValue, years])

  const timeSeries = useMemo(() => paths.length > 0 ? buildTimeSeries(paths, years, STEPS_PER_YEAR) : [], [paths, years])
  const finalDist = useMemo(() => paths.length > 0 ? buildFinalDist(paths) : [], [paths])

  const applyPreset = (preset) => {
    setAnnualReturn(preset.ret)
    setAnnualVol(preset.vol)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Settings size={14} className="text-accent-purple" />
            Simulation Parameters
          </h3>
          <div className="flex gap-1.5 ml-auto flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-[11px] px-2.5 py-1 bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default rounded transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Portfolio Value ($)', value: initialValue, set: setInitialValue, min: 1000, max: 10000000, step: 1000, fmt: v => `$${(v/1000).toFixed(0)}k` },
            { label: 'Annual Return (%)', value: annualReturn, set: setAnnualReturn, min: -10, max: 30, step: 0.5, fmt: v => `${v}%` },
            { label: 'Volatility (%)', value: annualVol, set: setAnnualVol, min: 1, max: 60, step: 0.5, fmt: v => `${v}%` },
            { label: 'Time Horizon (yr)', value: years, set: setYears, min: 1, max: 30, step: 1, fmt: v => `${v}yr` },
            { label: 'Simulations', value: numPaths, set: setNumPaths, min: 100, max: 2000, step: 100, fmt: v => v.toLocaleString() },
            { label: 'Monthly Add ($)', value: monthly, set: setMonthly, min: 0, max: 10000, step: 100, fmt: v => `$${v}` },
          ].map(ctrl => (
            <div key={ctrl.label}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-text-muted">{ctrl.label}</label>
                <span className="text-[11px] mono text-text-primary font-medium">{ctrl.fmt(ctrl.value)}</span>
              </div>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={ctrl.value}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
                style={{ accentColor: '#3b82f6' }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={run} disabled={running} className="btn-primary flex items-center gap-2">
            {running ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? `Simulating ${Math.min(animFrame, numPaths).toLocaleString()} paths…` : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Median Outcome', value: `$${(stats.median / 1000).toFixed(1)}k`, up: stats.median > initialValue, icon: TrendingUp },
            { label: 'Best 10% (P90)', value: `$${(stats.p90 / 1000).toFixed(1)}k`, up: true, icon: TrendingUp },
            { label: 'Worst 10% (P10)', value: `$${(stats.p10 / 1000).toFixed(1)}k`, up: stats.p10 > initialValue, icon: TrendingDown },
            { label: '% Profitable', value: `${stats.pctProfit}%`, up: stats.pctProfit > 50, icon: Activity },
            { label: 'Expected Value', value: `$${(stats.mean / 1000).toFixed(1)}k`, up: stats.mean > initialValue, icon: TrendingUp },
            { label: 'Implied CAGR', value: `${stats.cagr.toFixed(1)}%`, up: stats.cagr > 0, icon: Activity },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-[11px] text-text-muted mb-1">{s.label}</p>
              <p className={`text-lg font-bold mono ${s.up ? 'stat-up' : 'stat-down'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas simulation */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Activity size={14} className="text-accent-blue" />
              Monte Carlo Paths — {numPaths.toLocaleString()} Simulations
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-blue inline-block rounded" /> Median</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-green inline-block rounded" /> P90</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent-red inline-block rounded" /> P10</span>
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg overflow-hidden">
            <MonteCarloCanvas paths={paths} animFrame={animFrame} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-muted">
            <span>Year 0</span>
            {Array.from({ length: years - 1 }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
            <span>Year {years}</span>
          </div>
        </div>

        {/* Right charts */}
        <div className="space-y-4">
          {/* Percentile band chart */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Percentile Bands</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={timeSeries} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `Y${v}`} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={45} />
                <Tooltip
                  contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v, name) => [`$${(v/1000).toFixed(1)}k`, name]}
                />
                <Area type="monotone" dataKey="p95" stroke="none" fill="#10b981" fillOpacity={0.08} />
                <Area type="monotone" dataKey="p75" stroke="none" fill="#10b981" fillOpacity={0.12} />
                <Area type="monotone" dataKey="p25" stroke="none" fill="#ef4444" fillOpacity={0.08} />
                <Area type="monotone" dataKey="p5" stroke="none" fill="#ef4444" fillOpacity={0.05} />
                <Area type="monotone" dataKey="median" stroke="#3b82f6" fill="none" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Final distribution */}
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Final Value Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={finalDist} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}k`} interval={4} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1d26', border: '1px solid #252836', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(v, _, { payload }) => [v, `~$${payload.x.toFixed(0)}k`]}
                  labelFormatter={() => 'Paths'}
                />
                <Bar dataKey="count" name="Paths" radius={[2, 2, 0, 0]} fill="#3b82f6" fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-xs text-text-muted space-y-1">
              {stats && (
                <>
                  <div className="flex justify-between">
                    <span>Prob. of doubling:</span>
                    <span className="mono stat-up">
                      {(paths.filter(p => p[p.length - 1] > initialValue * 2).length / paths.length * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prob. of halving:</span>
                    <span className="mono stat-down">
                      {(paths.filter(p => p[p.length - 1] < initialValue * 0.5).length / paths.length * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max drawdown (median):</span>
                    <span className="mono stat-down">~{(annualVol * 1.5).toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
