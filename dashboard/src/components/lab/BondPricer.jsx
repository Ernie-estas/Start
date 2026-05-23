import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { bondPrice, macaulayDuration, modifiedDuration, convexity } from '../../utils/quantUtils'
import { ParamSlider, MetricTile, ToolHeader, MathNote, TOOLTIP_STYLE } from './LabShell'

const TENORS = [1, 2, 3, 5, 7, 10]

function bootstrap(parYields) {
  // parYields[i] = par yield for TENORS[i], decimal. Annual coupons for simplicity.
  const zero = []
  for (let i = 0; i < TENORS.length; i++) {
    const t = TENORS[i]
    const c = parYields[i]
    // discount factors at integer year tenors — interpolate from known zeros for gaps
    let sumDF = 0
    for (let k = 1; k < t; k++) {
      // interpolate zero rate at year k from previous zeros
      const prev = zero.filter(z => z.t <= k)
      const z_k = prev.length ? prev[prev.length - 1].z : c
      sumDF += 1 / Math.pow(1 + z_k, k)
    }
    // price = c·Σ DF + (1+c)·DF(T) = 1 (par bond)
    // → DF(T) = (1 - c·sumDF) / (1+c)
    const dfT = (1 - c * sumDF) / (1 + c)
    const z = Math.pow(1 / dfT, 1 / t) - 1
    zero.push({ t, z, par: c })
  }
  return zero
}

export default function BondPricer() {
  const [mode, setMode] = useState('pricer')

  // Pricer state
  const [face, setFace]     = useState(1000)
  const [couponRate, setCR] = useState(5)
  const [freq, setFreq]     = useState(2)
  const [ytm, setYTM]       = useState(5)
  const [years, setYears]   = useState(10)

  const price = useMemo(() => bondPrice(face, couponRate / 100, freq, ytm / 100, years), [face, couponRate, freq, ytm, years])
  const macD  = useMemo(() => macaulayDuration(face, couponRate / 100, freq, ytm / 100, years), [face, couponRate, freq, ytm, years])
  const modD  = useMemo(() => modifiedDuration(face, couponRate / 100, freq, ytm / 100, years), [face, couponRate, freq, ytm, years])
  const conv  = useMemo(() => convexity(face, couponRate / 100, freq, ytm / 100, years), [face, couponRate, freq, ytm, years])

  const pyData = useMemo(() => {
    const out = []
    for (let y = 0.5; y <= 15; y += 0.25) {
      out.push({ y: +y.toFixed(2), price: +bondPrice(face, couponRate / 100, freq, y / 100, years).toFixed(2) })
    }
    return out
  }, [face, couponRate, freq, years])

  // Yield curve state
  const [parY, setParY] = useState([4.5, 4.6, 4.7, 4.85, 4.95, 5.05])
  const zeros = useMemo(() => bootstrap(parY.map(y => y / 100)), [parY])
  const curveData = TENORS.map((t, i) => ({
    tenor: t,
    par:  +parY[i].toFixed(3),
    zero: +(zeros[i]?.z * 100 || 0).toFixed(3),
  }))

  return (
    <div>
      <ToolHeader title={mode === 'pricer' ? 'Bond Pricer' : 'Yield Curve'} description={mode === 'pricer' ? 'Discounted-cash-flow valuation with duration and convexity.' : 'Bootstrap zero rates from a par yield curve.'} />

      <div className="flex gap-2 mb-4">
        {['pricer', 'curve'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${mode === m ? 'tab-active' : 'tab-inactive'}`}
          >
            {m === 'pricer' ? 'Bond Pricer' : 'Yield Curve'}
          </button>
        ))}
      </div>

      {mode === 'pricer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-3">
            <div className="card">
              <p className="section-header mb-2">Price vs Yield</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={pyData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                  <XAxis dataKey="y" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v?.toFixed(2)} labelFormatter={v => `YTM ${v}%`} />
                  <ReferenceLine x={ytm} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'YTM', fill: '#3b82f6', fontSize: 10 }} />
                  <ReferenceLine x={couponRate} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'coupon', fill: '#94a3b8', fontSize: 10 }} />
                  <ReferenceLine y={face} stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="Price" value={price.toFixed(2)} color={price >= face ? '#10b981' : '#ef4444'} sub={price >= face ? 'Premium' : 'Discount'} />
              <MetricTile label="Macaulay D"  value={macD.toFixed(3)} sub="years" />
              <MetricTile label="Modified D"  value={modD.toFixed(3)} color="#3b82f6" />
              <MetricTile label="Convexity"   value={conv.toFixed(3)} color="#a855f7" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="card">
              <p className="section-header mb-3">Parameters</p>
              <ParamSlider label="Face value"  value={face} onChange={setFace} min={100} max={10000} step={100} format={v => v.toLocaleString()} />
              <ParamSlider label="Coupon rate" value={couponRate} onChange={setCR} min={0} max={15} step={0.25} unit="%" format={v => v.toFixed(2)} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-text-secondary">Frequency</span>
                <div className="flex gap-1">
                  {[1, 2, 4].map(f => (
                    <button key={f} onClick={() => setFreq(f)} className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${freq === f ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-muted'}`}>
                      {f === 1 ? 'Annual' : f === 2 ? 'Semi' : 'Quarterly'}
                    </button>
                  ))}
                </div>
              </div>
              <ParamSlider label="YTM" value={ytm} onChange={setYTM} min={0.1} max={15} step={0.05} unit="%" format={v => v.toFixed(2)} accent="#a855f7" />
              <ParamSlider label="Years to maturity" value={years} onChange={setYears} min={0.5} max={30} step={0.5} unit="y" format={v => v.toFixed(1)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="card">
            <p className="section-header mb-2">Par vs Zero Curve</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={curveData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" vertical={false} />
                <XAxis dataKey="tenor" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}y`} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => v.toFixed(3) + '%'} />
                <Line type="monotone" dataKey="par"  stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} name="Par" />
                <Line type="monotone" dataKey="zero" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: '#a855f7' }} name="Zero" />
              </LineChart>
            </ResponsiveContainer>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead><tr className="text-text-muted border-b border-border-subtle">
                  <th className="text-left py-1">Tenor</th><th className="text-right">Par yield</th><th className="text-right">Zero rate</th><th className="text-right">Spread (bps)</th>
                </tr></thead>
                <tbody>
                  {curveData.map(d => (
                    <tr key={d.tenor} className="border-b border-border-subtle/40">
                      <td className="py-1 mono text-text-muted">{d.tenor}y</td>
                      <td className="text-right mono text-accent-blue">{d.par.toFixed(3)}%</td>
                      <td className="text-right mono text-accent-purple">{d.zero.toFixed(3)}%</td>
                      <td className="text-right mono text-text-muted">{((d.zero - d.par) * 100).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <p className="section-header mb-3">Par Yields</p>
            {TENORS.map((t, i) => (
              <ParamSlider
                key={t} label={`${t}-year`}
                value={parY[i]} onChange={v => setParY(prev => prev.map((x, k) => (k === i ? v : x)))}
                min={0.1} max={10} step={0.05} unit="%" format={v => v.toFixed(2)}
              />
            ))}
          </div>
        </div>
      )}

      <MathNote>
        P = Σ C/(1+y/m)<sup>k</sup> + F/(1+y/m)<sup>n</sup>. &nbsp; Bootstrap: solve DF(T) so that par bond prices to 1.
      </MathNote>
    </div>
  )
}
