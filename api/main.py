from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from typing import Optional
import pandas as pd

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
