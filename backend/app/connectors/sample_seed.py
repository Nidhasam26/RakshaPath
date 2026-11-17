import json
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from app.connectors.base import BaseHazardConnector
from app.schemas.hazard import HazardCreate, GeoJSONGeometry

logger = logging.getLogger(__name__)


SEVERITY_MAP = {
    "minor": 1,
    "moderate": 2,
    "major": 3,
    "closure": 4,
}


def normalize_severity(val: Any) -> int:
    if isinstance(val, int) and 1 <= val <= 4:
        return val
    if isinstance(val, str):
        val_lower = val.lower().strip()
        if val_lower in SEVERITY_MAP:
            return SEVERITY_MAP[val_lower]
        if val_lower.isdigit() and 1 <= int(val_lower) <= 4:
            return int(val_lower)
    return 1


def find_sample_hazards_file() -> Path:
    candidates = [
        Path("docs/sample_hazards.json"),
        Path("../docs/sample_hazards.json"),
        Path("/docs/sample_hazards.json"),
        Path(__file__).resolve().parent.parent / "fixtures" / "sample_hazards.json",
        Path(__file__).resolve().parent.parent.parent.parent / "docs" / "sample_hazards.json",
    ]
    for p in candidates:
        if p.is_file():
            return p
    raise FileNotFoundError("Could not locate sample_hazards.json")


class SampleSeedConnector(BaseHazardConnector):
    """Loads standardized sample hazards from disk (used for demo & test environments)."""

    name = "seed"

    def fetch_hazards(self, bbox: Optional[str] = None) -> List[HazardCreate]:
        try:
            sample_path = find_sample_hazards_file()
            with open(sample_path, "r", encoding="utf-8") as f:
                data: List[Dict[str, Any]] = json.load(f)

            now_utc = datetime.now(timezone.utc)
            hazards: List[HazardCreate] = []
            for item in data:
                # Refresh expiry relative to now if it's already past to keep demo alive
                expires_dt = datetime.fromisoformat(item["expires_at"].replace("Z", "+00:00"))
                if expires_dt < now_utc:
                    expires_dt = now_utc + timedelta(hours=8)

                created_dt = (
                    datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
                    if "created_at" in item
                    else now_utc
                )


                hazard = HazardCreate(
                    id=str(item["id"]),
                    type=item["type"],
                    severity=normalize_severity(item["severity"]),
                    confidence=float(item["confidence"]),
                    source=item.get("source", "seed"),
                    description=item.get("description"),
                    geometry=GeoJSONGeometry(**item["geometry"]),
                    created_at=created_dt,
                    expires_at=expires_dt,
                )
                hazards.append(hazard)

            logger.info(f"SampleSeedConnector successfully loaded {len(hazards)} hazards.")
            return hazards
        except Exception as e:
            logger.error(f"SampleSeedConnector failed: {e}")
            raise
