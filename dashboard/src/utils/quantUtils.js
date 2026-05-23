// ── Quant utilities — pure JS, no React ──────────────────────────────────────

// ── RNG ──────────────────────────────────────────────────────────────────────
export function boxMuller() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function normalArray(n) {
  const out = new Array(n)
  for (let i = 0; i < n; i++) out[i] = boxMuller()
  return out
}

// ── Normal CDF / PDF (Abramowitz-Stegun 7.1.26) ──────────────────────────────
export function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

export function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422804 * Math.exp(-0.5 * x * x)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - p : p
}

// ── Black-Scholes ────────────────────────────────────────────────────────────
function _d1d2(S, K, T, r, sigma) {
  const vt = sigma * Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / vt
  const d2 = d1 - vt
  return { d1, d2, vt }
}

export function bsPrice(S, K, T, r, sigma, type = 'call') {
  if (T <= 0 || sigma <= 0) return Math.max(type === 'call' ? S - K : K - S, 0)
  const { d1, d2 } = _d1d2(S, K, T, r, sigma)
  const disc = Math.exp(-r * T)
  if (type === 'call') return S * normalCDF(d1) - K * disc * normalCDF(d2)
  return K * disc * normalCDF(-d2) - S * normalCDF(-d1)
}

export function bsGreeks(S, K, T, r, sigma) {
  if (T <= 0 || sigma <= 0) {
    return { call: 0, put: 0, delta_call: 0, delta_put: 0, gamma: 0, vega: 0, theta_call: 0, theta_put: 0, rho_call: 0, rho_put: 0, d1: 0, d2: 0 }
  }
  const { d1, d2, vt } = _d1d2(S, K, T, r, sigma)
  const disc = Math.exp(-r * T)
  const Nd1 = normalCDF(d1), Nd2 = normalCDF(d2)
  const nd1 = normalPDF(d1)
  const call = S * Nd1 - K * disc * Nd2
  const put  = K * disc * normalCDF(-d2) - S * normalCDF(-d1)
  const gamma = nd1 / (S * vt)
  const vega  = S * nd1 * Math.sqrt(T) / 100  // per 1% change in vol
  const theta_call = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * disc * Nd2) / 365
  const theta_put  = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * disc * normalCDF(-d2)) / 365
  const rho_call =  K * T * disc * Nd2 / 100
  const rho_put  = -K * T * disc * normalCDF(-d2) / 100
  return {
    call, put,
    delta_call: Nd1,
    delta_put:  Nd1 - 1,
    gamma, vega,
    theta_call, theta_put,
    rho_call, rho_put,
    d1, d2,
  }
}

// Generator yielding each Newton-Raphson iteration
export function* impliedVolIterations(target, S, K, T, r, type = 'call', maxIter = 20, tol = 1e-5) {
  let sigma = 0.2
  for (let i = 0; i < maxIter; i++) {
    const price = bsPrice(S, K, T, r, sigma, type)
    const { vega } = bsGreeks(S, K, T, r, sigma)
    const err = price - target
    yield { iter: i, sigma, price, error: Math.abs(err) }
    if (Math.abs(err) < tol) return
    if (vega < 1e-8) return
    sigma = Math.max(0.001, sigma - err / (vega * 100))  // vega is per 1%
  }
}

// ── Paths ────────────────────────────────────────────────────────────────────
export function gbmPath(S0, mu, sigma, T, steps, shocks) {
  const dt = T / steps
  const drift = (mu - 0.5 * sigma * sigma) * dt
  const diff  = sigma * Math.sqrt(dt)
  const path = new Array(steps + 1)
  path[0] = S0
  for (let i = 1; i <= steps; i++) {
    const z = shocks ? shocks[i - 1] : boxMuller()
    path[i] = path[i - 1] * Math.exp(drift + diff * z)
  }
  return path
}

export function hestonPath(S0, v0, kappa, theta, xi, rho, mu, T, steps) {
  const dt = T / steps
  const sqrtdt = Math.sqrt(dt)
  const c = Math.sqrt(Math.max(0, 1 - rho * rho))
  const S = new Array(steps + 1)
  const v = new Array(steps + 1)
  S[0] = S0
  v[0] = v0
  for (let i = 1; i <= steps; i++) {
    const z1 = boxMuller()
    const z2 = boxMuller()
    const zS = z1
    const zV = rho * z1 + c * z2
    const vPrev = Math.max(0, v[i - 1])
    v[i] = Math.max(0, vPrev + kappa * (theta - vPrev) * dt + xi * Math.sqrt(vPrev) * sqrtdt * zV)
    S[i] = S[i - 1] * Math.exp((mu - 0.5 * vPrev) * dt + Math.sqrt(vPrev) * sqrtdt * zS)
  }
  return { S, v }
}

// ── Linear algebra (small N×N) ───────────────────────────────────────────────
export function inverseMatrix(M) {
  const n = M.length
  const A = M.map((r, i) => [...r, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))])
  for (let i = 0; i < n; i++) {
    let piv = i
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k
    if (piv !== i) [A[i], A[piv]] = [A[piv], A[i]]
    const d = A[i][i]
    if (Math.abs(d) < 1e-12) throw new Error('singular matrix')
    for (let j = 0; j < 2 * n; j++) A[i][j] /= d
    for (let k = 0; k < n; k++) {
      if (k === i) continue
      const f = A[k][i]
      for (let j = 0; j < 2 * n; j++) A[k][j] -= f * A[i][j]
    }
  }
  return A.map(r => r.slice(n))
}

export function matvec(M, v) {
  return M.map(row => row.reduce((s, x, j) => s + x * v[j], 0))
}

export function dot(a, b) {
  return a.reduce((s, x, i) => s + x * b[i], 0)
}

export function transpose(M) {
  return M[0].map((_, j) => M.map(r => r[j]))
}

// ── Bond math (annual frequency cash flows under freq compounding) ───────────
export function bondPrice(face, couponRate, freq, ytm, years) {
  const n = Math.round(years * freq)
  const c = face * (couponRate / freq)
  const y = ytm / freq
  let pv = 0
  for (let k = 1; k <= n; k++) pv += c / Math.pow(1 + y, k)
  pv += face / Math.pow(1 + y, n)
  return pv
}

export function bondYTM(face, couponRate, freq, marketPrice, years) {
  let lo = 0.0001, hi = 1.0
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    const p = bondPrice(face, couponRate, freq, mid, years)
    if (p > marketPrice) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function macaulayDuration(face, couponRate, freq, ytm, years) {
  const n = Math.round(years * freq)
  const c = face * (couponRate / freq)
  const y = ytm / freq
  let num = 0, denom = 0
  for (let k = 1; k <= n; k++) {
    const cf = c + (k === n ? face : 0)
    const pv = cf / Math.pow(1 + y, k)
    num += (k / freq) * pv
    denom += pv
  }
  return denom > 0 ? num / denom : 0
}

export function modifiedDuration(face, couponRate, freq, ytm, years) {
  const mac = macaulayDuration(face, couponRate, freq, ytm, years)
  return mac / (1 + ytm / freq)
}

export function convexity(face, couponRate, freq, ytm, years) {
  const n = Math.round(years * freq)
  const c = face * (couponRate / freq)
  const y = ytm / freq
  let num = 0, denom = 0
  for (let k = 1; k <= n; k++) {
    const cf = c + (k === n ? face : 0)
    const pv = cf / Math.pow(1 + y, k)
    num += k * (k + 1) * pv
    denom += pv
  }
  return denom > 0 ? num / (denom * Math.pow(1 + y, 2) * freq * freq) : 0
}

// ── GARCH(1,1) ───────────────────────────────────────────────────────────────
export function garchSimulate(omega, alpha, beta, T, sigma0) {
  const returns = new Array(T)
  const vol = new Array(T)
  let s2 = sigma0 * sigma0
  for (let i = 0; i < T; i++) {
    vol[i] = Math.sqrt(s2)
    const r = vol[i] * boxMuller()
    returns[i] = r
    s2 = omega + alpha * r * r + beta * s2
  }
  const persistence = alpha + beta
  const uncondVar = persistence < 1 ? omega / (1 - persistence) : null
  // 1-day 99% VaR using last vol
  const var99 = -2.326 * vol[T - 1]
  return { returns, vol, persistence, unconditional_vol: uncondVar ? Math.sqrt(uncondVar) : null, var99, last_vol: vol[T - 1] }
}

// Forecast vol path for next H days
export function garchForecast(omega, alpha, beta, sigmaT, rT, H) {
  const out = new Array(H)
  let s2 = omega + alpha * rT * rT + beta * sigmaT * sigmaT
  for (let h = 0; h < H; h++) {
    out[h] = Math.sqrt(s2)
    s2 = omega + (alpha + beta) * s2
  }
  return out
}

// ── Utility ──────────────────────────────────────────────────────────────────
export function percentile(arr, p) {
  const s = [...arr].sort((a, b) => a - b)
  const idx = Math.max(0, Math.min(s.length - 1, Math.floor(p / 100 * (s.length - 1))))
  return s[idx]
}

export function linspace(a, b, n) {
  if (n <= 1) return [a]
  const step = (b - a) / (n - 1)
  return Array.from({ length: n }, (_, i) => a + i * step)
}
