"""Thin Elexon BMRS client with in-memory and persistent disk caching."""
import logging
from datetime import date
from pathlib import Path
from typing import Optional

import httpx
import pandas as pd

logger = logging.getLogger(__name__)

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
CACHE_DIR = Path(__file__).resolve().parent.parent / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache for fast sub-millisecond retrieval during the session
_MEMORY_CACHE: dict[str, pd.DataFrame] = {}


def _to_df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    for col in ("startTime", "publishTime"):
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True)
    return df


def _get_from_cache(cache_key: str) -> Optional[pd.DataFrame]:
    """Retrieve dataframe from in-memory cache or persistent disk cache."""
    if cache_key in _MEMORY_CACHE:
        return _MEMORY_CACHE[cache_key].copy()

    disk_file = CACHE_DIR / f"{cache_key}.pkl"
    if disk_file.exists():
        try:
            df = pd.read_pickle(disk_file)
            _MEMORY_CACHE[cache_key] = df
            return df.copy()
        except Exception as e:
            logger.warning(f"Failed to read disk cache for {cache_key}: {e}")

    return None


def _save_to_cache(cache_key: str, df: pd.DataFrame) -> None:
    """Save dataframe to in-memory cache and persistent disk cache."""
    _MEMORY_CACHE[cache_key] = df.copy()
    disk_file = CACHE_DIR / f"{cache_key}.pkl"
    try:
        df.to_pickle(disk_file)
    except Exception as e:
        logger.warning(f"Failed to write disk cache for {cache_key}: {e}")


def clear_cache() -> None:
    """Clear both in-memory and disk caches."""
    _MEMORY_CACHE.clear()
    for f in CACHE_DIR.glob("*.pkl"):
        try:
            f.unlink()
        except Exception:
            pass


def fetch_actuals(start: date, end: date) -> pd.DataFrame:
    """FUELHH wind generation (MW) per half hour with caching."""
    cache_key = f"actuals_{start.isoformat()}_{end.isoformat()}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    params = {
        "settlementDateFrom": start.isoformat(),
        "settlementDateTo": end.isoformat(),
        "fuelType": "WIND",
    }
    r = httpx.get(f"{BASE}/FUELHH/stream", params=params, timeout=60)
    r.raise_for_status()
    df = _to_df(r.json())
    if df.empty:
        result = df
    else:
        df = df[df["fuelType"] == "WIND"]
        result = (
            df[["startTime", "generation"]]
            .drop_duplicates("startTime")
            .sort_values("startTime")
            .reset_index(drop=True)
        )

    _save_to_cache(cache_key, result)
    return result.copy()


def fetch_forecasts(publish_from: date, publish_to: date) -> pd.DataFrame:
    """WINDFOR forecasts published in the given window with caching."""
    cache_key = f"forecasts_{publish_from.isoformat()}_{publish_to.isoformat()}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    params = {
        "publishDateTimeFrom": f"{publish_from.isoformat()}T00:00:00Z",
        "publishDateTimeTo": f"{publish_to.isoformat()}T23:59:59Z",
    }
    r = httpx.get(f"{BASE}/WINDFOR/stream", params=params, timeout=60)
    r.raise_for_status()
    df = _to_df(r.json())
    if df.empty:
        result = df
    else:
        result = df[["startTime", "publishTime", "generation"]].reset_index(drop=True)

    _save_to_cache(cache_key, result)
    return result.copy()
