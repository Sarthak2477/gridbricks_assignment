"""Pure functions: no I/O, easy to test.

Key assumption: the day-ahead decision for delivery day D is made on D-1 at
`cutoff_hour` UK local time. Only forecasts published at or before that cutoff
may be used ("no peeking").
"""
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pandas as pd

UK = ZoneInfo("Europe/London")


def decision_cutoff(delivery_date: date, cutoff_hour: int = 12) -> pd.Timestamp:
    """Cutoff instant (UTC) = D-1 at cutoff_hour, UK local time."""
    local = datetime.combine(delivery_date - timedelta(days=1), time(cutoff_hour), tzinfo=UK)
    return pd.Timestamp(local).tz_convert("UTC")


def latest_forecast_before_cutoff(forecasts: pd.DataFrame, cutoff: pd.Timestamp) -> pd.DataFrame:
    """For each startTime keep the forecast with the latest publishTime <= cutoff.

    Expects columns: startTime, publishTime (tz-aware UTC), generation.
    """
    if forecasts.empty:
        return forecasts.copy()
    eligible = forecasts[forecasts["publishTime"] <= cutoff]
    if eligible.empty:
        return eligible.copy()
    idx = eligible.groupby("startTime")["publishTime"].idxmax()
    return eligible.loc[idx].sort_values("startTime").reset_index(drop=True)


def delivery_window(delivery_date: date) -> tuple[pd.Timestamp, pd.Timestamp]:
    """[start, end) of the UK delivery day in UTC (handles 23/25h DST days)."""
    start = datetime.combine(delivery_date, time(0), tzinfo=UK)
    end = datetime.combine(delivery_date + timedelta(days=1), time(0), tzinfo=UK)
    return pd.Timestamp(start).tz_convert("UTC"), pd.Timestamp(end).tz_convert("UTC")


def join_forecast_actual(forecast: pd.DataFrame, actual: pd.DataFrame) -> pd.DataFrame:
    """Inner-join on startTime; error = forecast - actual (positive = over-forecast)."""
    f = forecast[["startTime", "generation"]].rename(columns={"generation": "forecast"})
    a = actual[["startTime", "generation"]].rename(columns={"generation": "actual"})
    df = f.merge(a, on="startTime", how="inner")
    df["error"] = df["forecast"] - df["actual"]
    return df


def error_metrics(df: pd.DataFrame) -> dict:
    """Quantify forecast error from a frame with an `error` column (MW)."""
    if df.empty:
        return {"n": 0}
    err = df["error"]
    abs_err = err.abs()
    return {
        "n": int(len(err)),
        "bias_mw": float(err.mean()),
        "mae_mw": float(abs_err.mean()),
        "rmse_mw": float((err**2).mean() ** 0.5),
        "abs_error_p50_mw": float(abs_err.quantile(0.5)),
        "abs_error_p90_mw": float(abs_err.quantile(0.9)),
        "error_p10_mw": float(err.quantile(0.1)),
        "error_p90_mw": float(err.quantile(0.9)),
    }