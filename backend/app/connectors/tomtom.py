import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from app.connectors.base import BaseHazardConnector
from app.core.config import settings
from app.schemas.hazard import HazardCreate, GeoJSONGeometry

logger = logging.getLogger(__name__)


# TomTom Icon Categories:
# 0: Unknown, 1: Accident, 2: Fog, 3: Dangerous Conditions, 4: Rain, 5: Ice, 
# 6: Jam, 7: Lane Closed, 8: Road Closed, 9: Road Works, 10: Wind, 11: Flooding, 14: Breakdown
TOMTOM_ICON_CATEGORY_MAP: Dict[int, Dict[str, Any]] = {
    0: {"type": "traffic_incident", "severity": 1, "confidence": 0.7},
    1: {"type": "accident", "severity": 3, "confidence": 0.9},
    2: {"type": "low_visibility", "severity": 2, "confidence": 0.8},
    3: {"type": "dangerous_road", "severity": 3, "confidence": 0.85},
    4: {"type": "water_logging", "severity": 2, "confidence": 0.85},
    5: {"type": "slippery_road", "severity": 2, "confidence": 0.8},
    6: {"type": "traffic_congestion", "severity": 2, "confidence": 0.75},
    7: {"type": "lane_closure", "severity": 2, "confidence": 0.85},
    8: {"type": "road_closure", "severity": 4, "confidence": 0.95},
    9: {"type": "road_work", "severity": 2, "confidence": 0.8},
    10: {"type": "severe_weather", "severity": 2, "confidence": 0.8},
    11: {"type": "flood", "severity": 3, "confidence": 0.9},
    14: {"type": "vehicle_breakdown", "severity": 1, "confidence": 0.75},
}

# Delay magnitude mapping: 0=Unknown, 1=Minor, 2=Moderate, 3=Major, 4=Undefined
DELAY_MAGNITUDE_SEVERITY: Dict[int, int] = {
    0: 1,
    1: 1,
    2: 2,
    3: 3,
    4: 2,
}


class TomTomConnector(BaseHazardConnector):
    """Fetches real-time traffic incidents from TomTom Traffic API v5."""

    name = "tomtom"

    def __init__(self, api_key: Optional[str] = None, timeout: int = 10):
        self.api_key = api_key or settings.TOMTOM_API_KEY
        self.timeout = timeout

    def fetch_hazards(self, bbox: Optional[str] = None) -> List[HazardCreate]:
        bounding_box = bbox or settings.DEFAULT_INGESTION_BBOX
        
        if not self.api_key or self.api_key == "your_tomtom_api_key_here":
            logger.warning("TomTom API key not configured. Returning empty live hazard list (or fallback).")
            return []

        # TomTom Incident Details v5 API
        # Bounding box format: minLon,minLat,maxLon,maxLat
        url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
        params = {
            "key": self.api_key,
            "bbox": bounding_box,
            "fields": "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to}}}",
            "language": "en-GB",
            "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11,14",
        }

        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return self.parse_incidents_response(data)
        except requests.exceptions.RequestException as e:
            logger.error(f"TomTom API request failed: {e}")
            raise

    def parse_incidents_response(self, data: Dict[str, Any]) -> List[HazardCreate]:
        """Parses TomTom API response payload into normalized HazardCreate objects."""
        incidents = data.get("incidents", [])
        hazards: List[HazardCreate] = []

        for inc in incidents:
            props = inc.get("properties", {})
            geom = inc.get("geometry")

            if not geom or "type" not in geom or "coordinates" not in geom:
                continue

            icon_cat = props.get("iconCategory", 0)
            cat_meta = TOMTOM_ICON_CATEGORY_MAP.get(icon_cat, {"type": "traffic_incident", "severity": 2, "confidence": 0.8})

            # Check if road closure icon or high delay overrides severity
            delay_mag = props.get("magnitudeOfDelay", 0)
            severity = max(cat_meta["severity"], DELAY_MAGNITUDE_SEVERITY.get(delay_mag, 1))
            if icon_cat == 8:  # Road Closed is always closure level 4
                severity = 4

            hazard_type = cat_meta["type"]
            confidence = cat_meta["confidence"]

            # Construct meaningful description
            events = props.get("events", [])
            event_descriptions = [e.get("description") for e in events if e.get("description")]
            description = "; ".join(event_descriptions) if event_descriptions else f"Traffic incident reported via TomTom (Category {icon_cat})"
            if props.get("from") and props.get("to"):
                description += f" [From {props.get('from')} to {props.get('to')}]"

            # Parse start and end time
            start_raw = props.get("startTime")
            end_raw = props.get("endTime")

            created_at = datetime.now(timezone.utc)
            if start_raw:
                try:
                    created_at = datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                except Exception:
                    pass

            expires_at = created_at + timedelta(hours=3)
            if end_raw:
                try:
                    expires_at = datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
                except Exception:
                    pass

            # If expiry is in the past, give it a reasonable active window
            now_utc = datetime.now(timezone.utc)
            if expires_at <= now_utc:
                expires_at = now_utc + timedelta(hours=2)


            incident_id = f"tomtom-{props.get('id', hash(str(geom.get('coordinates'))))}"

            hazard = HazardCreate(
                id=incident_id,
                type=hazard_type,
                severity=severity,
                confidence=confidence,
                source="tomtom",
                description=description,
                geometry=GeoJSONGeometry(type=geom["type"], coordinates=geom["coordinates"]),
                created_at=created_at,
                expires_at=expires_at,
            )
            hazards.append(hazard)

        return hazards
