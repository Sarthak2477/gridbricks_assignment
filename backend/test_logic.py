import sys
from datetime import date
from pathlib import Path

import pandas as pd

# Support running pytest from either backend/ or root
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import logic


def ts(s):
    return pd.Timestamp(s, tz="UTC")


def make_fc(rows):
    return pd.DataFrame(
        [{"startTime": ts(s), "publishTime": ts(p), "generation": g} for s, p, g in rows]
    )


def test_cutoff_winter_is_utc():
    # January: UK == UTC, so 12:00 on D-1
    assert logic.decision_cutoff(date(2026, 1, 10), 12) == ts("2026-01-09 12:00")


def test_no_peeking_and_latest_wins():
    fc = make_fc([
        ("2026-01-10 00:00", "2026-01-08 06:00", 100),
        ("2026-01-10 00:00", "2026-01-09 09:00", 200),  # latest before cutoff
        ("2026-01-10 00:00", "2026-01-09 15:00", 999),  # after cutoff: must be ignored
    ])
    out = logic.latest_forecast_before_cutoff(fc, logic.decision_cutoff(date(2026, 1, 10), 12))
    assert out["generation"].tolist() == [200]


def test_empty_when_all_after_cutoff():
    fc = make_fc([("2026-01-10 00:00", "2026-01-09 15:00", 1)])
    out = logic.latest_forecast_before_cutoff(fc, logic.decision_cutoff(date(2026, 1, 10), 12))
    assert out.empty


def test_error_metrics():
    df = pd.DataFrame({"error": [10.0, -10.0, 20.0, -20.0]})
    m = logic.error_metrics(df)
    assert m["n"] == 4
    assert m["bias_mw"] == 0
    assert m["mae_mw"] == 15
    assert round(m["rmse_mw"], 3) == round((250) ** 0.5, 3)


def test_error_metrics_empty():
    assert logic.error_metrics(pd.DataFrame({"error": []})) == {"n": 0}


def test_join_sign_convention():
    fc = pd.DataFrame({"startTime": [ts("2026-01-10")], "generation": [120.0]})
    ac = pd.DataFrame({"startTime": [ts("2026-01-10")], "generation": [100.0]})
    assert logic.join_forecast_actual(fc, ac)["error"].iloc[0] == 20.0

    assert logic.join_forecast_actual(fc, ac)["error"].iloc[0] == 20.0