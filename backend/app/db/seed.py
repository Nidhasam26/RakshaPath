import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
from shapely.geometry import shape
from geoalchemy2.shape import from_shape

from app.db.session import SessionLocal
from app.models.hazard import Hazard
from app.models.operator import Operator

logging.basicConfig(level=logging.INFO)
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
    raise FileNotFoundError("Could not locate docs/sample_hazards.json")


def seed_hazards(db_session=None) -> int:
    session_provided = db_session is not None
    db = db_session if session_provided else SessionLocal()

    try:
        sample_path = find_sample_hazards_file()
        logger.info(f"Loading sample hazards from: {sample_path}")
        with open(sample_path, "r", encoding="utf-8") as f:
            hazards_data: List[Dict[str, Any]] = json.load(f)

        seeded_count = 0
        for item in hazards_data:
            hazard_id = str(item["id"])
            geom_obj = shape(item["geometry"])
            geo_element = from_shape(geom_obj, srid=4326)

            existing = db.query(Hazard).filter(Hazard.id == hazard_id).first()
            if existing:
                existing.type = item["type"]
                existing.geometry = geo_element
                existing.severity = normalize_severity(item["severity"])
                existing.confidence = float(item["confidence"])
                existing.source = item["source"]
                existing.description = item.get("description")
                existing.expires_at = datetime.fromisoformat(item["expires_at"].replace("Z", "+00:00"))
            else:
                new_hazard = Hazard(
                    id=hazard_id,
                    type=item["type"],
                    geometry=geo_element,
                    severity=normalize_severity(item["severity"]),
                    confidence=float(item["confidence"]),
                    source=item["source"],
                    description=item.get("description"),
                    created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")) if "created_at" in item else datetime.utcnow(),
                    expires_at=datetime.fromisoformat(item["expires_at"].replace("Z", "+00:00")),
                )
                db.add(new_hazard)
            seeded_count += 1

        # Also ensure a default demo operator exists (idempotent)
        admin_op = db.query(Operator).filter(Operator.email == "operator@rakshapath.gov.in").first()
        if not admin_op:
            demo_operator = Operator(
                name="Headquarters Operator 1",
                email="operator@rakshapath.gov.in",
                password_hash="pbkdf2:sha256:dummyhashforemergencyoperator",
                role="operator",
            )
            db.add(demo_operator)

        db.commit()
        logger.info(f"Successfully seeded/upserted {seeded_count} sample hazards.")
        return seeded_count
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
        raise
    finally:
        if not session_provided:
            db.close()


if __name__ == "__main__":
    seed_hazards()
