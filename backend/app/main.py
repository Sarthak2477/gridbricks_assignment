from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import elexon, logic

app = FastAPI(title="Wind Forecast Decision API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JAN_START, JAN_END = date(2026, 1, 1), date(2026, 1, 31)


def _check_date(d: date) -> None:
    if not JAN_START <= d <= JAN_END:
        raise HTTPException(422, "Date must be within January 2026 (2026-01-01 to 2026-01-31)")


def _records(df: pd.DataFrame) -> list[dict]:
    return [
        {k: (v.isoformat() if isinstance(v, pd.Timestamp) else v) for k, v in row.items()}
        for row in df.to_dict("records")
    ]


def _forecast_for(d: date, cutoff_hour: int) -> tuple[pd.DataFrame, pd.Timestamp]:
    cutoff = logic.decision_cutoff(d, cutoff_hour)
    # forecasts for day D are published up to a few days before; look back 3 days
    raw = elexon.fetch_forecasts(d - timedelta(days=3), d - timedelta(days=1))
    if not raw.empty:
        raw = raw[raw["startTime"].between(*logic.delivery_window(d), inclusive="left")]
    return logic.latest_forecast_before_cutoff(raw, cutoff), cutoff


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/forecast")
def forecast(delivery_date: date, cutoff_hour: int = Query(12, ge=0, le=23)):
    """Latest forecast available at decision time for a delivery day."""
    _check_date(delivery_date)
    fc, cutoff = _forecast_for(delivery_date, cutoff_hour)
    if fc.empty:
        raise HTTPException(404, "No forecast published before the cutoff")
    return {
        "delivery_date": delivery_date.isoformat(),
        "cutoff_utc": cutoff.isoformat(),
        "points": _records(fc),
    }


@app.get("/api/error-metrics")
def error_metrics(start: date, end: date, cutoff_hour: int = Query(12, ge=0, le=23)):
    """Forecast error (forecast - actual, MW) over a date range.
    
    Optimized to batch-fetch all forecasts and actuals across the date range in
    cached requests instead of looping individual HTTP calls per day.
    """
    _check_date(start)
    _check_date(end)
    if end < start:
        raise HTTPException(422, "end date must be >= start date")

    # Single cached batch fetch for all forecasts across the entire range
    all_forecasts = elexon.fetch_forecasts(start - timedelta(days=3), end - timedelta(days=1))

    frames = []
    d = start
    while d <= end:
        cutoff = logic.decision_cutoff(d, cutoff_hour)
        if not all_forecasts.empty:
            d_window = logic.delivery_window(d)
            raw = all_forecasts[all_forecasts["startTime"].between(*d_window, inclusive="left")]
            fc = logic.latest_forecast_before_cutoff(raw, cutoff)
        else:
            fc = pd.DataFrame()
        frames.append(fc)
        d += timedelta(days=1)

    fc_all = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    actual = elexon.fetch_actuals(start, end + timedelta(days=1))

    if fc_all.empty or actual.empty:
        raise HTTPException(404, "No data available for the requested range")

    joined = logic.join_forecast_actual(fc_all, actual)
    metrics = logic.error_metrics(joined)
    return metrics


@app.get("/api/comparison")
def comparison(delivery_date: date, cutoff_hour: int = Query(12, ge=0, le=23)):
    """Convenience endpoint returning both forecast and actual generation side-by-side for a delivery day."""
    _check_date(delivery_date)
    fc, cutoff = _forecast_for(delivery_date, cutoff_hour)
    actual = elexon.fetch_actuals(delivery_date, delivery_date + timedelta(days=1))

    if fc.empty:
        raise HTTPException(404, "No forecast found for this delivery date")

    if actual.empty:
        joined = fc.rename(columns={"generation": "forecast"})
        joined["actual"] = None
        joined["error"] = None
    else:
        joined = logic.join_forecast_actual(fc, actual)

    return {
        "delivery_date": delivery_date.isoformat(),
        "cutoff_utc": cutoff.isoformat(),
        "series": _records(joined),
    }


# Static build serving (serves frontend/dist when available)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

