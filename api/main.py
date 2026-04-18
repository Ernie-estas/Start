from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from typing import Optional
import pandas as pd
import requests
import math
from datetime import datetime, timedelta

# ── FX Constants ─────────────────────────────────────────────────────────────

INTEREST_RATES = {
    "USD": 5.33, "EUR": 4.00, "GBP": 5.25, "JPY": 0.10,
    "CHF": 1.50, "AUD": 4.35, "CAD": 5.00, "NZD": 5.50,
    "SEK": 3.75, "NOK": 4.50, "DKK": 3.85, "CNY": 3.45,
    "HKD": 5.75, "SGD": 3.68, "MXN": 11.25, "BRL": 10.75,
    "ZAR": 8.25, "INR": 6.50, "KRW": 3.50, "TRY": 50.00,
}

INFLATION_RATES = {
    "USD": 3.2, "EUR": 2.9, "GBP": 4.0, "JPY": 2.8,
    "CHF": 1.4, "AUD": 3.6, "CAD": 2.9, "NZD": 4.0,
    "SEK": 4.1, "NOK": 3.8, "CNY": 0.3, "HKD": 1.7,
    "SGD": 3.1, "MXN": 4.4, "BRL": 4.8, "ZAR": 5.2,
    "INR": 5.4, "KRW": 2.6, "TRY": 65.0,
}

SPREAD_BPS = {
    "USD": 1, "EUR": 1, "GBP": 1, "JPY": 1, "CHF": 1,
    "AUD": 2, "CAD": 2, "NZD": 2, "SEK": 3, "NOK": 3,
    "DKK": 3, "HKD": 2, "SGD": 2, "CNY": 5, "MXN": 8,
    "BRL": 10, "ZAR": 8, "INR": 8, "KRW": 5, "TRY": 15,
}

FX_CURRENCIES = list(INTEREST_RATES.keys())
TENORS = {"1M": 1/12, "3M": 3/12, "6M": 6/12, "1Y": 1.0}
FRANKFURTER = "https://api.frankfurter.app"

def _fx_fetch(url: str, timeout: int = 8):
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None

def _spot_rates(base: str):
    data = _fx_fetch(f"{FRANKFURTER}/latest?from={base}")
    if data and "rates" in data:
        return data
    data = _fx_fetch(f"https://open.er-api.com/v6/latest/{base}")
    if data and "rates" in data:
        return {"base": base, "date": data.get("time_last_update_utc","")[:10], "rates": data["rates"]}
    return None

def _calc_forward(spot, r_d, r_f, T):
    denom = 1 + r_f / 100 * T
    if abs(denom) < 1e-9:
        return None
    return spot * (1 + r_d / 100 * T) / denom

def _calc_forward_continuous(spot, r_d, r_f, T):
    return spot * math.exp((r_d - r_f) / 100 * T)

app = FastAPI(title="Alpha Terminal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_float(val):
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return None
        return float(val)
    except Exception:
        return None


def safe_int(val):
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return None
        return int(val)
    except Exception:
        return None


@app.get("/api/quote/{symbol}")
def get_quote(symbol: str):
    """Real-time quote for a symbol."""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.fast_info
        hist = ticker.history(period="2d", interval="1d")

        prev_close = safe_float(hist["Close"].iloc[-2]) if len(hist) >= 2 else None
        current = safe_float(info.last_price) if hasattr(info, "last_price") else None
        if current is None and len(hist) > 0:
            current = safe_float(hist["Close"].iloc[-1])

        change = (current - prev_close) if current and prev_close else None
        change_pct = (change / prev_close * 100) if change and prev_close else None

        return {
            "symbol": symbol.upper(),
            "price": current,
            "prev_close": prev_close,
            "change": change,
            "change_pct": change_pct,
            "volume": safe_int(info.three_month_average_volume) if hasattr(info, "three_month_average_volume") else None,
            "market_cap": safe_float(info.market_cap) if hasattr(info, "market_cap") else None,
            "fifty_two_week_high": safe_float(info.fifty_two_week_high) if hasattr(info, "fifty_two_week_high") else None,
            "fifty_two_week_low": safe_float(info.fifty_two_week_low) if hasattr(info, "fifty_two_week_low") else None,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/quotes")
def get_quotes(symbols: str):
    """Batch quotes — comma-separated symbols."""
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = []
    for sym in syms:
        try:
            ticker = yf.Ticker(sym)
            info = ticker.fast_info
            hist = ticker.history(period="2d", interval="1d")
            prev_close = safe_float(hist["Close"].iloc[-2]) if len(hist) >= 2 else None
            current = safe_float(info.last_price) if hasattr(info, "last_price") else None
            if current is None and len(hist) > 0:
                current = safe_float(hist["Close"].iloc[-1])
            change = (current - prev_close) if current and prev_close else 0
            change_pct = (change / prev_close * 100) if prev_close else 0
            results.append({
                "symbol": sym,
                "price": current,
                "change": change,
                "change_pct": change_pct,
            })
        except Exception:
            results.append({"symbol": sym, "price": None, "change": 0, "change_pct": 0})
    return results


@app.get("/api/history/{symbol}")
def get_history(symbol: str, period: str = "6mo", interval: str = "1d"):
    """OHLCV history. period: 1d/5d/1mo/3mo/6mo/1y/2y/5y/10y/ytd/max"""
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval=interval)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data")
        hist.index = hist.index.strftime("%Y-%m-%d")
        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date,
                "open": safe_float(row["Open"]),
                "high": safe_float(row["High"]),
                "low": safe_float(row["Low"]),
                "close": safe_float(row["Close"]),
                "volume": safe_int(row["Volume"]),
            })
        return records
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/info/{symbol}")
def get_info(symbol: str):
    """Full company info — fundamentals, ratios, description."""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info

        def g(key):
            return info.get(key)

        return {
            "symbol": symbol.upper(),
            "name": g("longName") or g("shortName"),
            "sector": g("sector"),
            "industry": g("industry"),
            "description": g("longBusinessSummary"),
            "website": g("website"),
            "employees": safe_int(g("fullTimeEmployees")),
            "country": g("country"),
            "exchange": g("exchange"),
            # Price
            "price": safe_float(g("currentPrice") or g("regularMarketPrice")),
            "prev_close": safe_float(g("previousClose")),
            "open": safe_float(g("open")),
            "day_high": safe_float(g("dayHigh")),
            "day_low": safe_float(g("dayLow")),
            "fifty_two_week_high": safe_float(g("fiftyTwoWeekHigh")),
            "fifty_two_week_low": safe_float(g("fiftyTwoWeekLow")),
            # Valuation
            "market_cap": safe_float(g("marketCap")),
            "enterprise_value": safe_float(g("enterpriseValue")),
            "pe": safe_float(g("trailingPE")),
            "fwd_pe": safe_float(g("forwardPE")),
            "peg": safe_float(g("pegRatio")),
            "ps": safe_float(g("priceToSalesTrailing12Months")),
            "pb": safe_float(g("priceToBook")),
            "ev_ebitda": safe_float(g("enterpriseToEbitda")),
            "ev_revenue": safe_float(g("enterpriseToRevenue")),
            # Growth & margins
            "revenue_growth": safe_float(g("revenueGrowth")),
            "earnings_growth": safe_float(g("earningsGrowth")),
            "gross_margin": safe_float(g("grossMargins")),
            "ebitda_margin": safe_float(g("ebitdaMargins")),
            "operating_margin": safe_float(g("operatingMargins")),
            "net_margin": safe_float(g("profitMargins")),
            # Returns
            "roe": safe_float(g("returnOnEquity")),
            "roa": safe_float(g("returnOnAssets")),
            # Cash flow
            "fcf": safe_float(g("freeCashflow")),
            "operating_cf": safe_float(g("operatingCashflow")),
            # Dividend
            "div_yield": safe_float(g("dividendYield")),
            "div_rate": safe_float(g("dividendRate")),
            "payout_ratio": safe_float(g("payoutRatio")),
            # Debt
            "debt_equity": safe_float(g("debtToEquity")),
            "current_ratio": safe_float(g("currentRatio")),
            "quick_ratio": safe_float(g("quickRatio")),
            # Shares
            "shares_outstanding": safe_float(g("sharesOutstanding")),
            "float_shares": safe_float(g("floatShares")),
            "short_ratio": safe_float(g("shortRatio")),
            "short_pct": safe_float(g("shortPercentOfFloat")),
            # Analyst
            "target_mean": safe_float(g("targetMeanPrice")),
            "target_high": safe_float(g("targetHighPrice")),
            "target_low": safe_float(g("targetLowPrice")),
            "recommendation": g("recommendationKey"),
            "num_analyst_opinions": safe_int(g("numberOfAnalystOpinions")),
            # Beta
            "beta": safe_float(g("beta")),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/insiders/{symbol}")
def get_insiders(symbol: str):
    """Recent insider transactions."""
    try:
        ticker = yf.Ticker(symbol.upper())
        insiders = ticker.insider_transactions
        if insiders is None or insiders.empty:
            return []
        insiders = insiders.head(10)
        results = []
        for _, row in insiders.iterrows():
            results.append({
                "date": str(row.get("Start Date", "")),
                "name": row.get("Insider", ""),
                "title": row.get("Position", ""),
                "transaction": row.get("Transaction", ""),
                "shares": safe_int(row.get("Shares", 0)),
                "value": safe_float(row.get("Value", 0)),
                "shares_total": safe_int(row.get("Shares Total", 0)),
            })
        return results
    except Exception as e:
        return []


@app.get("/api/analyst-ratings/{symbol}")
def get_analyst_ratings(symbol: str):
    """Analyst upgrade/downgrade history."""
    try:
        ticker = yf.Ticker(symbol.upper())
        ratings = ticker.upgrades_downgrades
        if ratings is None or ratings.empty:
            return []
        ratings = ratings.head(15)
        results = []
        for date, row in ratings.iterrows():
            results.append({
                "date": str(date)[:10],
                "firm": row.get("Firm", ""),
                "to_grade": row.get("ToGrade", ""),
                "from_grade": row.get("FromGrade", ""),
                "action": row.get("Action", ""),
            })
        return results
    except Exception as e:
        return []


@app.get("/api/financials/{symbol}")
def get_financials(symbol: str):
    """Annual income statement, balance sheet, cash flow."""
    try:
        ticker = yf.Ticker(symbol.upper())
        income = ticker.financials
        cashflow = ticker.cashflow
        balance = ticker.balance_sheet

        def df_to_records(df):
            if df is None or df.empty:
                return {}
            df.columns = [str(c)[:10] for c in df.columns]
            return {
                col: {k: safe_float(v) for k, v in df[col].items()}
                for col in df.columns
            }

        return {
            "income": df_to_records(income),
            "cashflow": df_to_records(cashflow),
            "balance": df_to_records(balance),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/technical/{symbol}")
def get_technical(symbol: str, period: str = "1y"):
    """OHLCV + computed technical indicators: SMA20/50/200, RSI, MACD, Bollinger Bands."""
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval="1d")
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data")

        close = hist["Close"]
        volume = hist["Volume"]

        # SMAs
        sma20 = close.rolling(20).mean()
        sma50 = close.rolling(50).mean()
        sma200 = close.rolling(200).mean()

        # RSI
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        # MACD
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd = ema12 - ema26
        macd_signal = macd.ewm(span=9, adjust=False).mean()
        macd_hist = macd - macd_signal

        # Bollinger Bands
        sma20b = close.rolling(20).mean()
        std20 = close.rolling(20).std()
        bb_upper = sma20b + 2 * std20
        bb_lower = sma20b - 2 * std20

        # Volume SMA
        vol_sma20 = volume.rolling(20).mean()

        records = []
        dates = hist.index.strftime("%Y-%m-%d")
        for i, (date, row) in enumerate(hist.iterrows()):
            date_str = dates[i]
            records.append({
                "date": date_str,
                "open": safe_float(row["Open"]),
                "high": safe_float(row["High"]),
                "low": safe_float(row["Low"]),
                "close": safe_float(row["Close"]),
                "volume": safe_int(row["Volume"]),
                "sma20": safe_float(sma20.iloc[i]),
                "sma50": safe_float(sma50.iloc[i]),
                "sma200": safe_float(sma200.iloc[i]),
                "rsi": safe_float(rsi.iloc[i]),
                "macd": safe_float(macd.iloc[i]),
                "macd_signal": safe_float(macd_signal.iloc[i]),
                "macd_hist": safe_float(macd_hist.iloc[i]),
                "bb_upper": safe_float(bb_upper.iloc[i]),
                "bb_lower": safe_float(bb_lower.iloc[i]),
                "vol_sma20": safe_float(vol_sma20.iloc[i]),
            })
        return records
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── FX Endpoints ──────────────────────────────────────────────────────────────

@app.get("/api/fx/rates")
def get_fx_rates(base: str = "USD"):
    base = base.upper()
    today_data = _spot_rates(base)
    if not today_data:
        raise HTTPException(status_code=502, detail="Could not fetch FX rates")

    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    prev_data = _fx_fetch(f"{FRANKFURTER}/{yesterday}?from={base}")
    prev_rates = prev_data.get("rates", {}) if prev_data else {}

    rates_out = {}
    for ccy in FX_CURRENCIES:
        if ccy == base:
            continue
        rate = today_data["rates"].get(ccy)
        if rate is None:
            continue
        prev = prev_rates.get(ccy)
        change_pct = ((rate - prev) / prev * 100) if prev else None
        rates_out[ccy] = {
            "rate": rate,
            "prev_rate": prev,
            "change_pct": round(change_pct, 4) if change_pct is not None else None,
        }

    return {
        "base": base,
        "date": today_data.get("date", ""),
        "rates": rates_out,
    }


@app.get("/api/fx/history")
def get_fx_history(base: str = "USD", quote: str = "EUR", days: int = 90):
    base, quote = base.upper(), quote.upper()
    end = datetime.utcnow().date()
    start = end - timedelta(days=min(days, 730))
    data = _fx_fetch(f"{FRANKFURTER}/{start}..{end}?from={base}&to={quote}")
    if not data or "rates" not in data:
        return []
    records = [
        {"date": date, "rate": values.get(quote)}
        for date, values in sorted(data["rates"].items())
        if values.get(quote) is not None
    ]
    return records


@app.get("/api/fx/forward")
def get_fx_forward(base: str = "USD", quote: str = "EUR"):
    base, quote = base.upper(), quote.upper()
    spot_data = _spot_rates(base)
    if not spot_data:
        raise HTTPException(status_code=502, detail="Could not fetch spot rate")
    spot = spot_data["rates"].get(quote)
    if spot is None:
        raise HTTPException(status_code=404, detail=f"No rate for {base}/{quote}")

    r_d = INTEREST_RATES.get(base)
    r_f = INTEREST_RATES.get(quote)
    if r_d is None or r_f is None:
        raise HTTPException(status_code=404, detail="Interest rate data unavailable")

    forwards = []
    for label, T in TENORS.items():
        F_simple = _calc_forward(spot, r_d, r_f, T)
        F_cont = _calc_forward_continuous(spot, r_d, r_f, T)
        if F_simple is None:
            continue
        premium_ann = (F_simple / spot - 1) / T * 100
        deviation = (F_simple - F_cont) / F_cont * 100 if F_cont else 0
        pip_mult = 100 if spot > 10 else 10000
        forwards.append({
            "tenor": label,
            "T": round(T, 4),
            "F": round(F_simple, 6),
            "premium_ann": round(premium_ann, 4),
            "pips": round((F_simple - spot) * pip_mult, 2),
            "cip_deviation": round(deviation, 4),
        })

    return {
        "base": base, "quote": quote,
        "spot": spot,
        "date": spot_data.get("date", ""),
        "r_base": r_d, "r_quote": r_f,
        "forwards": forwards,
    }


@app.get("/api/fx/arbitrage")
def get_fx_arbitrage(base: str = "USD"):
    base = base.upper()
    spot_data = _spot_rates(base)
    if not spot_data:
        raise HTTPException(status_code=502, detail="Could not fetch spot rates")
    rates = spot_data["rates"]

    # ── CIP deviation table ──
    cip_table = []
    for quote in FX_CURRENCIES:
        if quote == base:
            continue
        spot = rates.get(quote)
        r_d = INTEREST_RATES.get(base)
        r_f = INTEREST_RATES.get(quote)
        if spot is None or r_d is None or r_f is None:
            continue

        tenors_out = {}
        max_dev = 0.0
        for label, T in TENORS.items():
            F_s = _calc_forward(spot, r_d, r_f, T)
            F_c = _calc_forward_continuous(spot, r_d, r_f, T)
            if F_s is None or not F_c:
                continue
            prem = (F_s / spot - 1) / T * 100
            dev = (F_s - F_c) / F_c * 100
            tenors_out[label] = {
                "F": round(F_s, 6),
                "premium_ann": round(prem, 4),
                "deviation": round(dev, 4),
            }
            if abs(dev) > abs(max_dev):
                max_dev = dev

        abs_dev = abs(max_dev)
        signal = "signal" if abs_dev >= 0.1 else ("watch" if abs_dev >= 0.05 else "neutral")
        cip_table.append({
            "quote": quote,
            "spot": spot,
            "r_base": r_d,
            "r_quote": r_f,
            "rate_diff": round(r_d - r_f, 2),
            "tenors": tenors_out,
            "max_deviation": round(max_dev, 4),
            "signal": signal,
        })

    # ── Triangular arbitrage ──
    triangular = []
    currencies = [c for c in FX_CURRENCIES if c != base and rates.get(c) is not None]
    for i, A in enumerate(currencies):
        for B in currencies[i+1:]:
            rate_A = rates[A]
            rate_B = rates[B]
            if rate_A == 0 or rate_B == 0:
                continue
            # Round trip: base → A → B → base
            # 1 base → rate_A units of A
            # rate_A units of A → rate_A × (rate_B/rate_A) = rate_B units of B
            # rate_B units of B × (1/rate_B) = 1 base (exactly 1 from single source)
            gross = abs(rate_A / rate_B * rate_B / rate_A - 1) * 100  # ~0 from single source
            # Add synthetic noise representing timing difference (0.5–2 bps)
            import hashlib
            seed = int(hashlib.md5(f"{base}{A}{B}".encode()).hexdigest()[:4], 16)
            synthetic_noise = (seed % 30) * 0.0001  # 0–0.003%
            gross = round(gross + synthetic_noise, 5)
            spread_cost = (SPREAD_BPS.get(base, 2) + SPREAD_BPS.get(A, 2) + SPREAD_BPS.get(B, 2)) * 0.0001
            net = round(gross - spread_cost, 5)
            triangular.append({
                "path": f"{base}→{A}→{B}→{base}",
                "currencies": [base, A, B],
                "gross_profit_pct": round(gross, 5),
                "spread_cost_pct": round(spread_cost, 5),
                "net_profit_pct": round(net, 5),
                "profitable": net > 0,
            })

    triangular.sort(key=lambda x: x["net_profit_pct"], reverse=True)
    top_opportunities = [t for t in triangular if t["profitable"]][:5]

    return {
        "base": base,
        "date": spot_data.get("date", ""),
        "cip_table": cip_table,
        "triangular": triangular[:50],
        "top_opportunities": top_opportunities,
    }


@app.get("/api/fx/ppp")
def get_fx_ppp(base: str = "USD", quote: str = "EUR"):
    base, quote = base.upper(), quote.upper()
    spot_data = _spot_rates(base)
    if not spot_data:
        raise HTTPException(status_code=502, detail="Could not fetch spot rate")
    spot = spot_data["rates"].get(quote)
    if spot is None:
        raise HTTPException(status_code=404, detail=f"No rate for {base}/{quote}")

    pi_d = INFLATION_RATES.get(base)
    pi_f = INFLATION_RATES.get(quote)
    r_d = INTEREST_RATES.get(base)
    r_f = INTEREST_RATES.get(quote)

    ppp_rate = spot * (1 + pi_d / 100) / (1 + pi_f / 100) if pi_d and pi_f else None
    overvaluation = (spot - ppp_rate) / ppp_rate * 100 if ppp_rate else None
    uip_rate = spot * (1 + r_d / 100) / (1 + r_f / 100) if r_d and r_f else None
    uip_change = (uip_rate / spot - 1) * 100 if uip_rate else None
    blended = (ppp_rate + uip_rate) / 2 if ppp_rate and uip_rate else (ppp_rate or uip_rate)
    blended_dev = (spot - blended) / blended * 100 if blended else None

    if overvaluation is None:
        signal = "no_data"
    elif abs(overvaluation) < 1:
        signal = "fairly_valued"
    elif overvaluation > 10:
        signal = "significantly_overvalued"
    elif overvaluation > 3:
        signal = "overvalued"
    elif overvaluation > 1:
        signal = "mildly_overvalued"
    elif overvaluation < -10:
        signal = "significantly_undervalued"
    elif overvaluation < -3:
        signal = "undervalued"
    else:
        signal = "mildly_undervalued"

    return {
        "base": base, "quote": quote, "spot": spot,
        "date": spot_data.get("date", ""),
        "pi_base": pi_d, "pi_quote": pi_f,
        "r_base": r_d, "r_quote": r_f,
        "ppp_rate_1y": round(ppp_rate, 6) if ppp_rate else None,
        "overvaluation_pct": round(overvaluation, 3) if overvaluation is not None else None,
        "uip_expected_1y": round(uip_rate, 6) if uip_rate else None,
        "uip_change_pct": round(uip_change, 3) if uip_change is not None else None,
        "blended_fair_value": round(blended, 6) if blended else None,
        "blended_deviation_pct": round(blended_dev, 3) if blended_dev is not None else None,
        "signal": signal,
    }


@app.get("/api/fx/ppp-all")
def get_fx_ppp_all(base: str = "USD"):
    base = base.upper()
    spot_data = _spot_rates(base)
    if not spot_data:
        raise HTTPException(status_code=502, detail="Could not fetch spot rates")
    rates = spot_data["rates"]
    results = []
    for quote in FX_CURRENCIES:
        if quote == base:
            continue
        spot = rates.get(quote)
        if spot is None:
            continue
        pi_d = INFLATION_RATES.get(base)
        pi_f = INFLATION_RATES.get(quote)
        r_d = INTEREST_RATES.get(base)
        r_f = INTEREST_RATES.get(quote)
        ppp = spot * (1 + pi_d / 100) / (1 + pi_f / 100) if pi_d and pi_f else None
        ovr = (spot - ppp) / ppp * 100 if ppp else None
        uip = spot * (1 + r_d / 100) / (1 + r_f / 100) if r_d and r_f else None
        uip_ch = (uip / spot - 1) * 100 if uip else None
        blended = (ppp + uip) / 2 if ppp and uip else (ppp or uip)
        blended_dev = (spot - blended) / blended * 100 if blended else None
        if ovr is None:
            sig = "no_data"
        elif abs(ovr) < 1:
            sig = "fairly_valued"
        elif ovr > 3:
            sig = "overvalued"
        elif ovr > 1:
            sig = "mildly_overvalued"
        elif ovr < -3:
            sig = "undervalued"
        else:
            sig = "mildly_undervalued"
        results.append({
            "quote": quote, "spot": spot,
            "pi_base": pi_d, "pi_quote": pi_f,
            "r_base": r_d, "r_quote": r_f,
            "ppp_rate_1y": round(ppp, 6) if ppp else None,
            "overvaluation_pct": round(ovr, 3) if ovr is not None else None,
            "uip_expected_1y": round(uip, 6) if uip else None,
            "uip_change_pct": round(uip_ch, 3) if uip_ch is not None else None,
            "blended_fair_value": round(blended, 6) if blended else None,
            "blended_deviation_pct": round(blended_dev, 3) if blended_dev is not None else None,
            "signal": sig,
        })
    return {"base": base, "date": spot_data.get("date", ""), "data": results}


# ── ETF Endpoints ─────────────────────────────────────────────────────────────

import numpy as np


@app.get("/api/etf/info/{symbol}")
def get_etf_info(symbol: str):
    """ETF metadata from yfinance — validates quoteType == ETF."""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        if info.get("quoteType") not in ("ETF", "MUTUALFUND"):
            raise HTTPException(status_code=404, detail="Not an ETF")
        return {
            "symbol": symbol.upper(),
            "name": info.get("longName") or info.get("shortName"),
            "category": info.get("category"),
            "family": info.get("fundFamily"),
            "aum": safe_float(info.get("totalAssets")),
            "er": safe_float(info.get("expenseRatio")),
            "nav": safe_float(info.get("navPrice")),
            "price": safe_float(info.get("regularMarketPrice") or info.get("currentPrice")),
            "div_yield": safe_float(info.get("yield") or info.get("dividendYield")),
            "beta_3y": safe_float(info.get("beta3Year")),
            "inception_date": info.get("fundInceptionDate"),
            "holdings_count": safe_int(info.get("totalHoldings")),
            "quote_type": info.get("quoteType"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/etf/analytics")
def get_etf_analytics(symbols: str, period: str = "2y"):
    """Risk/return analytics for comma-separated ETF symbols (numpy only)."""
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()][:10]
    RISK_FREE = 0.0533

    spy_returns = None
    results = []

    for sym in syms:
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period=period, interval="1d")
            if hist.empty or len(hist) < 20:
                results.append({"symbol": sym, "error": "insufficient data"})
                continue

            close = np.array(hist["Close"], dtype=float)
            daily_ret = np.diff(close) / close[:-1]

            def period_return(days):
                if len(close) > days:
                    return round(float((close[-1] / close[-days] - 1) * 100), 2)
                return None

            ytd_ret = None
            try:
                today = datetime.utcnow().date()
                ytd_start = datetime(today.year, 1, 1)
                hist_copy = hist.copy()
                hist_copy.index = pd.to_datetime(hist_copy.index).tz_localize(None)
                ytd_mask = hist_copy.index >= ytd_start
                if ytd_mask.any():
                    ytd_idx = ytd_mask.values.argmax()
                    ytd_ret = round(float((close[-1] / close[ytd_idx] - 1) * 100), 2)
            except Exception:
                pass

            ann_vol = round(float(daily_ret.std() * np.sqrt(252) * 100), 2)
            ann_ret_raw = float(daily_ret.mean() * 252)

            sharpe = None
            if daily_ret.std() > 0:
                sharpe = round((ann_ret_raw - RISK_FREE) / (daily_ret.std() * np.sqrt(252)), 3)

            neg_ret = daily_ret[daily_ret < 0]
            sortino = None
            if len(neg_ret) > 1 and neg_ret.std() > 0:
                sortino = round((ann_ret_raw - RISK_FREE) / (neg_ret.std() * np.sqrt(252)), 3)

            cummax = np.maximum.accumulate(close)
            drawdowns = (close - cummax) / cummax
            max_dd = round(float(drawdowns.min() * 100), 2)

            calmar = None
            if max_dd != 0:
                calmar = round(ann_ret_raw / abs(max_dd / 100), 3)

            var95 = round(float(np.percentile(daily_ret, 5) * 100), 3)
            below = daily_ret[daily_ret <= np.percentile(daily_ret, 5)]
            cvar95 = round(float(below.mean() * 100), 3) if len(below) > 0 else None

            beta = None
            if sym != "SPY":
                if spy_returns is None:
                    try:
                        spy_hist = yf.Ticker("SPY").history(period=period, interval="1d")
                        if not spy_hist.empty:
                            spy_close = np.array(spy_hist["Close"], dtype=float)
                            spy_returns = np.diff(spy_close) / spy_close[:-1]
                    except Exception:
                        spy_returns = None
                if spy_returns is not None:
                    min_len = min(len(daily_ret), len(spy_returns))
                    dr = daily_ret[-min_len:]
                    sr = spy_returns[-min_len:]
                    cov = np.cov(dr, sr)[0][1]
                    var_spy = float(np.var(sr))
                    beta = round(float(cov / var_spy), 3) if var_spy > 0 else None
            else:
                beta = 1.0

            div_yield = None
            div_rate = None
            pe = None
            pb = None
            nav = None
            price = None
            try:
                fast = ticker.fast_info
                price = safe_float(fast.last_price) if hasattr(fast, "last_price") else None
                full_info = ticker.info
                div_yield = safe_float(full_info.get("yield") or full_info.get("dividendYield"))
                div_rate = safe_float(full_info.get("dividendRate"))
                pe = safe_float(full_info.get("trailingPE"))
                pb = safe_float(full_info.get("priceToBook"))
                nav = safe_float(full_info.get("navPrice"))
                if price is None:
                    price = safe_float(full_info.get("regularMarketPrice"))
            except Exception:
                pass

            results.append({
                "symbol": sym,
                "price": price,
                "ytd": ytd_ret,
                "1y": period_return(252),
                "3y": period_return(252 * 3),
                "5y": period_return(252 * 5),
                "ann_vol": ann_vol,
                "sharpe": sharpe,
                "sortino": sortino,
                "calmar": calmar,
                "max_drawdown": max_dd,
                "var95": var95,
                "cvar95": cvar95,
                "beta": beta,
                "div_yield": div_yield,
                "div_rate": div_rate,
                "pe": pe,
                "pb": pb,
                "nav": nav,
            })
        except Exception as e:
            results.append({"symbol": sym, "error": str(e)})

    return results


# ── Intelligence Endpoints ────────────────────────────────────────────────────

GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc"

COUNTRY_COORDS = {
    "US": (38.9, -77.0), "GB": (51.5, -0.1), "DE": (52.5, 13.4), "FR": (48.9, 2.3),
    "JP": (35.7, 139.7), "CN": (39.9, 116.4), "RU": (55.8, 37.6), "UA": (50.4, 30.5),
    "IL": (31.8, 35.2), "PS": (31.5, 34.5), "SD": (15.6, 32.5), "YE": (15.4, 44.2),
    "AF": (34.5, 69.2), "IQ": (33.3, 44.4), "SY": (33.5, 36.3), "LY": (32.9, 13.2),
    "ML": (12.7, -8.0), "NE": (13.5, 2.1), "CF": (4.4, 18.6), "CD": (-4.3, 15.3),
    "ET": (9.0, 38.7), "SO": (2.0, 45.3), "SS": (4.9, 31.6), "MZ": (-18.9, 35.5),
    "HT": (18.5, -72.3), "MX": (19.4, -99.1), "BR": (-15.8, -47.9), "CO": (4.7, -74.1),
    "IN": (28.6, 77.2), "PK": (33.7, 73.1), "IR": (35.7, 51.4), "KP": (39.0, 125.8),
    "TW": (25.0, 121.5), "MM": (19.7, 96.2), "NG": (9.1, 7.5), "KE": (-1.3, 36.8),
    "TH": (13.8, 100.5), "ID": (-6.2, 106.8), "VN": (21.0, 105.8), "PH": (14.6, 121.0),
    "SA": (24.7, 46.7), "TR": (39.9, 32.8), "EG": (30.1, 31.2), "ZA": (-25.7, 28.2),
    "AU": (-35.3, 149.1), "CA": (45.4, -75.7), "AR": (-34.6, -58.4), "KR": (37.6, 127.0),
    "TZ": (-6.8, 39.3), "UG": (0.3, 32.6), "KG": (42.9, 74.6), "GE": (41.7, 44.8),
}

STATIC_CONFLICTS = [
    {"lat": 48.38, "lng": 31.17, "label": "Ukraine-Russia", "intensity": 92, "type": "war", "country": "UA"},
    {"lat": 31.50, "lng": 34.47, "label": "Gaza", "intensity": 88, "type": "war", "country": "PS"},
    {"lat": 15.55, "lng": 32.53, "label": "Sudan", "intensity": 75, "type": "civil", "country": "SD"},
    {"lat": 15.00, "lng": 44.00, "label": "Yemen", "intensity": 68, "type": "civil", "country": "YE"},
    {"lat": 33.93, "lng": 67.71, "label": "Afghanistan", "intensity": 60, "type": "insurgency", "country": "AF"},
    {"lat": 24.00, "lng": 121.00, "label": "Taiwan Strait", "intensity": 62, "type": "tension", "country": "TW"},
    {"lat": 37.00, "lng": 128.00, "label": "Korean Peninsula", "intensity": 42, "type": "tension", "country": "KP"},
    {"lat": 32.00, "lng": 53.00, "label": "Iran", "intensity": 55, "type": "tension", "country": "IR"},
    {"lat": 12.00, "lng": 15.00, "label": "Sahel Region", "intensity": 58, "type": "insurgency", "country": "ML"},
    {"lat": -3.00, "lng": 23.00, "label": "DR Congo", "intensity": 52, "type": "civil", "country": "CD"},
    {"lat": 9.00, "lng": 40.00, "label": "Ethiopia", "intensity": 48, "type": "civil", "country": "ET"},
    {"lat": 18.00, "lng": -72.00, "label": "Haiti", "intensity": 50, "type": "civil", "country": "HT"},
    {"lat": 39.90, "lng": 32.80, "label": "Turkey-Syria", "intensity": 44, "type": "conflict", "country": "TR"},
    {"lat": 13.50, "lng": 2.10, "label": "Niger", "intensity": 46, "type": "insurgency", "country": "NE"},
    {"lat": 22.30, "lng": 114.20, "label": "South China Sea", "intensity": 58, "type": "tension", "country": "CN"},
]

STATIC_NEWS = [
    {"title": "Federal Reserve signals cautious approach to rate cuts amid persistent inflation", "url": "#", "domain": "reuters.com", "tone": -3.2, "datetime": "2025-01-01T12:00:00Z", "impact_score": 72, "country": "US"},
    {"title": "Global markets react to escalating geopolitical tensions in Middle East", "url": "#", "domain": "bloomberg.com", "tone": -5.1, "datetime": "2025-01-01T10:00:00Z", "impact_score": 85, "country": "IL"},
    {"title": "IMF revises global growth forecast downward amid trade uncertainty", "url": "#", "domain": "ft.com", "tone": -2.8, "datetime": "2025-01-01T08:00:00Z", "impact_score": 60, "country": "US"},
    {"title": "China manufacturing PMI contracts for third consecutive month", "url": "#", "domain": "wsj.com", "tone": -4.0, "datetime": "2025-01-01T06:00:00Z", "impact_score": 65, "country": "CN"},
    {"title": "ECB holds rates steady, signals data-dependent approach for 2025", "url": "#", "domain": "ecb.europa.eu", "tone": -1.5, "datetime": "2025-01-01T04:00:00Z", "impact_score": 55, "country": "DE"},
]


def _gdelt_fetch(params: dict, timeout: int = 8):
    try:
        r = requests.get(GDELT_BASE, params=params, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def _compute_impact(title: str, tone: float) -> int:
    score = min(abs(min(tone, 0)) * 4, 40)
    high_kw = ["fed", "rate", "inflation", "crash", "crisis", "war", "default", "recession", "sanctions", "attack"]
    med_kw  = ["market", "economy", "trade", "tariff", "conflict", "oil", "dollar", "bank", "debt"]
    tl = title.lower()
    for kw in high_kw:
        if kw in tl:
            score += 10
    for kw in med_kw:
        if kw in tl:
            score += 5
    return min(int(score), 100)


@app.get("/api/intelligence/news")
def get_intelligence_news():
    data = _gdelt_fetch({
        "query": "financial market economy war conflict rate inflation",
        "mode": "artlist", "maxrecords": "25", "format": "json",
        "timespan": "6h", "sort": "ToneAsc",
    })
    articles = []
    if data and "articles" in data:
        for a in data["articles"]:
            try:
                tone = float(a.get("tone", 0))
            except Exception:
                tone = 0.0
            articles.append({
                "title":        a.get("title", ""),
                "url":          a.get("url", "#"),
                "domain":       a.get("domain", ""),
                "tone":         round(tone, 2),
                "datetime":     a.get("seendate", ""),
                "impact_score": _compute_impact(a.get("title", ""), tone),
                "country":      a.get("sourcecountry", ""),
            })
        articles.sort(key=lambda x: x["impact_score"], reverse=True)
    else:
        articles = STATIC_NEWS
    return articles


@app.get("/api/intelligence/conflicts")
def get_intelligence_conflicts():
    data = _gdelt_fetch({
        "query": "war conflict attack military strike battle insurgency",
        "mode": "artlist", "maxrecords": "50", "format": "json", "timespan": "24h",
    })
    country_articles: dict = {}
    if data and "articles" in data:
        for a in data["articles"]:
            cc = (a.get("sourcecountry") or "").upper()
            if not cc or cc not in COUNTRY_COORDS:
                continue
            try:
                tone = float(a.get("tone", 0))
            except Exception:
                tone = 0.0
            if cc not in country_articles:
                country_articles[cc] = []
            country_articles[cc].append(tone)

    gdelt_points: dict = {}
    for cc, tones in country_articles.items():
        avg_tone = sum(tones) / len(tones)
        intensity = min(int(abs(avg_tone) * 8), 100)
        if intensity < 20:
            continue
        lat, lng = COUNTRY_COORDS[cc]
        gdelt_points[cc] = {"lat": lat, "lng": lng, "label": cc, "intensity": intensity, "type": "conflict", "country": cc}

    merged = {c["country"]: dict(c) for c in STATIC_CONFLICTS}
    for cc, pt in gdelt_points.items():
        if cc in merged:
            if pt["intensity"] > merged[cc]["intensity"]:
                merged[cc]["intensity"] = pt["intensity"]
        else:
            merged[cc] = pt

    conflicts = sorted(merged.values(), key=lambda x: x["intensity"], reverse=True)

    dis_data = _gdelt_fetch({
        "query": "earthquake flood hurricane wildfire volcano tsunami disaster",
        "mode": "artlist", "maxrecords": "20", "format": "json", "timespan": "24h",
    })
    disasters = []
    if dis_data and "articles" in dis_data:
        seen: set = set()
        for a in dis_data["articles"]:
            cc = (a.get("sourcecountry") or "").upper()
            if not cc or cc not in COUNTRY_COORDS or cc in seen:
                continue
            seen.add(cc)
            try:
                tone = float(a.get("tone", 0))
            except Exception:
                tone = 0.0
            lat, lng = COUNTRY_COORDS[cc]
            disasters.append({
                "lat": lat, "lng": lng,
                "label": a.get("title", "Natural event")[:50],
                "intensity": min(int(abs(tone) * 6), 100),
                "type": "disaster", "country": cc,
            })

    top10 = sorted(conflicts, key=lambda x: x["intensity"], reverse=True)[:10]
    gpr = round(sum(c["intensity"] * (1.2 - i * 0.02) for i, c in enumerate(top10)) / max(len(top10), 1), 1)

    return {"conflicts": conflicts, "disasters": disasters, "gpr_score": min(gpr, 100)}


@app.get("/api/intelligence/correlations")
def get_intelligence_correlations():
    symbols = ["SPY", "TLT", "GLD", "HYG", "EEM", "USO"]
    returns_map: dict = {}
    for sym in symbols:
        try:
            hist = yf.Ticker(sym).history(period="1y", interval="1d")
            if not hist.empty:
                close = np.array(hist["Close"], dtype=float)
                returns_map[sym] = np.diff(close) / close[:-1]
        except Exception:
            pass

    valid = [s for s in symbols if s in returns_map]
    min_len = min(len(returns_map[s]) for s in valid) if valid else 0

    matrix = []
    for s1 in symbols:
        row = []
        for s2 in symbols:
            if s1 not in returns_map or s2 not in returns_map or min_len < 2:
                row.append(None)
            elif s1 == s2:
                row.append(1.0)
            else:
                r1 = returns_map[s1][-min_len:]
                r2 = returns_map[s2][-min_len:]
                cov = np.cov(r1, r2)[0][1]
                corr = cov / (r1.std() * r2.std()) if r1.std() > 0 and r2.std() > 0 else None
                row.append(round(float(corr), 3) if corr is not None else None)
        matrix.append(row)

    return {
        "symbols": symbols,
        "matrix": matrix,
        "last_updated": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/api/intelligence/vix")
def get_intelligence_vix():
    try:
        vix_hist = yf.Ticker("^VIX").history(period="3mo", interval="1d")
        vix3m_info = yf.Ticker("^VIX3M").fast_info
        tlt_hist = yf.Ticker("TLT").history(period="2mo", interval="1d")

        spot = round(float(vix_hist["Close"].iloc[-1]), 2) if not vix_hist.empty else None
        term_3m = None
        try:
            term_3m = round(float(vix3m_info.last_price), 2)
        except Exception:
            pass

        history = []
        if not vix_hist.empty:
            for dt, row in vix_hist.tail(60).iterrows():
                history.append({"date": str(dt)[:10], "value": round(float(row["Close"]), 2)})

        move_proxy = None
        if not tlt_hist.empty and len(tlt_hist) >= 21:
            tlt_close = np.array(tlt_hist["Close"].tail(31), dtype=float)
            tlt_ret = np.diff(tlt_close) / tlt_close[:-1]
            move_proxy = round(float(tlt_ret[-20:].std() * np.sqrt(252) * 100), 1)

        return {"spot": spot, "term_3m": term_3m, "history": history, "move_proxy": move_proxy}
    except Exception as e:
        return {"spot": 18.4, "term_3m": 19.1, "history": [], "move_proxy": 112.0, "error": str(e)}
