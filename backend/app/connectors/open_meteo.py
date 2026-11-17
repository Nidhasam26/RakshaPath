import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any


from app.connectors.base import BaseHazardConnector
from app.core.config import settings
from app.schemas.hazard import HazardCreate, GeoJSONGeometry

logger = logging.getLogger(__name__)

# WMO Weather interpretation codes mapped to hazard metadata
WMO_HAZARD_MAP: Dict[int, Dict[str, Any]] = {
    65: {"type": "heavy_rainfall", "severity": 3, "confidence": 0.85, "desc": "Heavy rainfall alert"},
    66: {"type": "slippery_road", "severity": 2, "confidence": 0.80, "desc": "Light freezing rain / slippery roads"},
    67: {"type": "slippery_road", "severity": 3, "confidence": 0.90, "desc": "Heavy freezing rain / hazardous icy roads"},
    75: {"type": "heavy_snowfall", "severity": 3, "confidence": 0.85, "desc": "Heavy snowfall affecting road visibility"},
    82: {"type": "heavy_rainfall", "severity": 3, "confidence": 0.85, "desc": "Violent rain showers reported"},
    95: {"type": "thunderstorm", "severity": 3, "confidence": 0.90, "desc": "Active thunderstorm and lightning warning"},
    96: {"type": "severe_storm", "severity": 4, "confidence": 0.95, "desc": "Severe thunderstorm with slight hail"},
    99: {"type": "severe_storm", "severity": 4, "confidence": 0.95, "desc": "Severe thunderstorm with heavy hail and extreme wind"},
}


class OpenMeteoConnector(BaseHazardConnector):
    """Fetches severe weather alerts and precipitation risks from Open-Meteo API."""

    name = "open_meteo"

    def __init__(self, api_url: Optional[str] = None, timeout: int = 10):
        self.api_url = api_url or settings.OPEN_METEO_API_URL
        self.timeout = timeout

    def fetch_hazards(self, bbox: Optional[str] = None) -> List[HazardCreate]:
        bounding_box = bbox or settings.DEFAULT_INGESTION_BBOX
        
        # Parse bbox [min_lon, min_lat, max_lon, max_lat] to compute center / sample points
        try:
            parts = [float(x.strip()) for x in bounding_box.split(",")]
            min_lon, min_lat, max_lon, max_lat = parts[0], parts[1], parts[2], parts[3]
            center_lat = (min_lat + max_lat) / 2.0
            center_lon = (min_lon + max_lon) / 2.0
        except Exception as e:
            logger.warning(f"Invalid bbox format '{bbox}', using default coordinates: {e}")
            center_lat, center_lon = 12.9716, 77.5946

        params = {
            "latitude": center_lat,
            "longitude": center_lon,
            "hourly": "precipitation,rain,showers,snowfall,weather_code,wind_gusts_10m",
            "forecast_days": 1,
            "timezone": "UTC",
        }

        try:
            response = requests.get(self.api_url, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return self.parse_weather_response(data, center_lat, center_lon)
        except requests.exceptions.RequestException as e:
            logger.error(f"Open-Meteo API request failed: {e}")
            raise

    def parse_weather_response(self, data: Dict[str, Any], lat: float, lon: float) -> List[HazardCreate]:
        """Scans next 6 hours of weather forecast to generate proactive weather hazard alerts."""
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        weather_codes = hourly.get("weather_code", [])
        precipitations = hourly.get("precipitation", [])
        wind_gusts = hourly.get("wind_gusts_10m", [])

        if not times:
            return []

        now_utc = datetime.now(timezone.utc)
        hazards: List[HazardCreate] = []


        # Analyze current & next few hours (up to 6 hours)
        for i in range(min(6, len(times))):
            try:
                hour_time = datetime.fromisoformat(times[i])
            except Exception:
                hour_time = now_utc + timedelta(hours=i)

            w_code = weather_codes[i] if i < len(weather_codes) else 0
            precip = precipitations[i] if i < len(precipitations) else 0.0
            gust = wind_gusts[i] if i < len(wind_gusts) else 0.0

            hazard_type = None
            severity = 1
            confidence = 0.8
            desc_parts = []

            if w_code in WMO_HAZARD_MAP:
                mapping = WMO_HAZARD_MAP[w_code]
                hazard_type = mapping["type"]
                severity = mapping["severity"]
                confidence = mapping["confidence"]
                desc_parts.append(mapping["desc"])

            # High precipitation trigger (> 15.0 mm/hr)
            if precip and precip >= 15.0:
                if not hazard_type:
                    hazard_type = "water_logging"
                severity = max(severity, 3)
                desc_parts.append(f"Heavy rainfall expected: {precip:.1f} mm/h (water-logging risk)")

            # Extreme wind trigger (> 55 km/h)
            if gust and gust >= 55.0:
                if not hazard_type:
                    hazard_type = "severe_weather"
                severity = max(severity, 2 if gust < 70 else 3)
                desc_parts.append(f"High wind gusts: {gust:.1f} km/h")

            if hazard_type:
                hazard_id = f"openmeteo-{lat:.3f}-{lon:.3f}-{hour_time.strftime('%Y%m%d%H')}"
                created_at = hour_time
                expires_at = hour_time + timedelta(hours=3)
                description = " | ".join(desc_parts)

                # Weather hazard represented as a spatial polygon / point
                geom = GeoJSONGeometry(
                    type="Point",
                    coordinates=[lon, lat]
                )

                hazard = HazardCreate(
                    id=hazard_id,
                    type=hazard_type,
                    severity=severity,
                    confidence=confidence,
                    source="open_meteo",
                    description=description,
                    geometry=geom,
                    created_at=created_at,
                    expires_at=expires_at,
                )
                hazards.append(hazard)
                # Avoid producing multiple duplicate alerts for adjacent hours in single run
                break

        return hazards
