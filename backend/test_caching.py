import sys
from datetime import date
from pathlib import Path
import pandas as pd
import pytest

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import elexon


def test_cache_mechanism(tmp_path, monkeypatch):
    """Verify that in-memory and disk caches store and retrieve data properly."""
    monkeypatch.setattr(elexon, "CACHE_DIR", tmp_path)
    elexon.clear_cache()

    sample_df = pd.DataFrame({
        "startTime": [pd.Timestamp("2026-01-01 00:00:00", tz="UTC")],
        "generation": [1500.5]
    })

    # Save to cache
    elexon._save_to_cache("test_key", sample_df)

    # In-memory retrieval
    cached = elexon._get_from_cache("test_key")
    assert cached is not None
    assert len(cached) == 1
    assert cached["generation"].iloc[0] == 1500.5

    # Clear memory only, verify disk load
    elexon._MEMORY_CACHE.clear()
    assert "test_key" not in elexon._MEMORY_CACHE
    cached_disk = elexon._get_from_cache("test_key")
    assert cached_disk is not None
    assert cached_disk["generation"].iloc[0] == 1500.5

    # Clean up
    elexon.clear_cache()
    assert elexon._get_from_cache("test_key") is None

