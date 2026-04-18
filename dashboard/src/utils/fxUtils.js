export const INTEREST_RATES = {
  USD: 5.33, EUR: 4.00, GBP: 5.25, JPY: 0.10,
  CHF: 1.50, AUD: 4.35, CAD: 5.00, NZD: 5.50,
  SEK: 3.75, NOK: 4.50, DKK: 3.85, CNY: 3.45,
  HKD: 5.75, SGD: 3.68, MXN: 11.25, BRL: 10.75,
  ZAR: 8.25, INR: 6.50, KRW: 3.50, TRY: 50.00,
}

export const INFLATION_RATES = {
  USD: 3.2, EUR: 2.9, GBP: 4.0, JPY: 2.8,
  CHF: 1.4, AUD: 3.6, CAD: 2.9, NZD: 4.0,
  SEK: 4.1, NOK: 3.8, CNY: 0.3, HKD: 1.7,
  SGD: 3.1, MXN: 4.4, BRL: 4.8, ZAR: 5.2,
  INR: 5.4, KRW: 2.6, TRY: 65.0,
}

export const TENORS = { '1M': 1/12, '3M': 3/12, '6M': 6/12, '1Y': 1.0 }

export const CURRENCY_META = {
  USD: { name: 'US Dollar',        flag: '🇺🇸', region: 'Americas' },
  EUR: { name: 'Euro',             flag: '🇪🇺', region: 'Europe' },
  GBP: { name: 'British Pound',    flag: '🇬🇧', region: 'Europe' },
  JPY: { name: 'Japanese Yen',     flag: '🇯🇵', region: 'Asia' },
  CHF: { name: 'Swiss Franc',      flag: '🇨🇭', region: 'Europe' },
  AUD: { name: 'Australian Dollar',flag: '🇦🇺', region: 'Oceania' },
  CAD: { name: 'Canadian Dollar',  flag: '🇨🇦', region: 'Americas' },
  NZD: { name: 'New Zealand Dollar',flag:'🇳🇿', region: 'Oceania' },
  SEK: { name: 'Swedish Krona',    flag: '🇸🇪', region: 'Europe' },
  NOK: { name: 'Norwegian Krone',  flag: '🇳🇴', region: 'Europe' },
  DKK: { name: 'Danish Krone',     flag: '🇩🇰', region: 'Europe' },
  CNY: { name: 'Chinese Yuan',     flag: '🇨🇳', region: 'Asia' },
  HKD: { name: 'Hong Kong Dollar', flag: '🇭🇰', region: 'Asia' },
  SGD: { name: 'Singapore Dollar', flag: '🇸🇬', region: 'Asia' },
  MXN: { name: 'Mexican Peso',     flag: '🇲🇽', region: 'Americas' },
  BRL: { name: 'Brazilian Real',   flag: '🇧🇷', region: 'Americas' },
  ZAR: { name: 'South African Rand',flag:'🇿🇦', region: 'Africa' },
  INR: { name: 'Indian Rupee',     flag: '🇮🇳', region: 'Asia' },
  KRW: { name: 'South Korean Won', flag: '🇰🇷', region: 'Asia' },
  TRY: { name: 'Turkish Lira',     flag: '🇹🇷', region: 'Europe' },
}

export const FX_CURRENCIES = Object.keys(INTEREST_RATES)

export function calcForwardRate(spot, r_d, r_f, T) {
  const denom = 1 + r_f / 100 * T
  if (Math.abs(denom) < 1e-9) return null
  return spot * (1 + r_d / 100 * T) / denom
}

export function calcForwardPremiumAnn(spot, F, T) {
  if (!spot || !F || !T) return null
  return (F / spot - 1) / T * 100
}

export function calcPPP(spot, pi_d, pi_f) {
  if (pi_d == null || pi_f == null) return null
  return spot * (1 + pi_d / 100) / (1 + pi_f / 100)
}

export function calcUIP(spot, r_d, r_f) {
  if (r_d == null || r_f == null) return null
  return spot * (1 + r_d / 100) / (1 + r_f / 100)
}

export function fmtRate(r, currency = '') {
  if (r == null) return '—'
  if (r >= 100 || currency === 'JPY' || currency === 'KRW' || currency === 'INR') return r.toFixed(2)
  if (r >= 10) return r.toFixed(3)
  return r.toFixed(4)
}

export function fmtPct(v, dp = 2) {
  if (v == null) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(dp)}%`
}

export function getSignalColor(deviation) {
  const abs = Math.abs(deviation ?? 0)
  if (abs < 0.05) return 'text-text-muted'
  if (abs < 0.1) return 'text-accent-amber'
  return deviation > 0 ? 'stat-up' : 'stat-down'
}

export function getValuationColor(ovr) {
  if (ovr == null) return 'text-text-muted'
  const abs = Math.abs(ovr)
  if (abs < 1) return 'text-text-secondary'
  if (ovr > 5) return 'stat-down'
  if (ovr > 1) return 'text-accent-amber'
  if (ovr < -5) return 'stat-up'
  return 'text-accent-amber'
}

export function signalLabel(signal) {
  const map = {
    fairly_valued: 'FAIR',
    mildly_overvalued: 'MILD OVR',
    overvalued: 'OVERVALUED',
    significantly_overvalued: 'VERY OVR',
    mildly_undervalued: 'MILD UND',
    undervalued: 'UNDERVALUED',
    significantly_undervalued: 'VERY UND',
    no_data: 'N/A',
  }
  return map[signal] || signal?.toUpperCase() || '—'
}
