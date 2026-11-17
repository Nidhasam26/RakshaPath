from typing import List, Optional, Any, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GeoJSONGeometry(BaseModel):
    type: str = Field(..., description="GeoJSON geometry type: Point, Polygon, LineString, MultiLineString, MultiPolygon")
    coordinates: Any = Field(..., description="GeoJSON coordinates array")


class HazardBase(BaseModel):
    type: str = Field(..., description="Hazard type (e.g. water_logging, traffic_congestion, accident, road_closure, severe_weather)")
    severity: int = Field(..., ge=1, le=4, description="Severity score: 1=Minor, 2=Moderate, 3=Major, 4=Closure/Extreme")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    source: str = Field(..., description="Data source (e.g. tomtom, open_meteo, seed, news_llm, ndma)")
    description: Optional[str] = Field(None, description="Human readable description")
    geometry: GeoJSONGeometry = Field(..., description="GeoJSON geometry representation")
    expires_at: datetime = Field(..., description="Timestamp when the hazard expires")


class HazardCreate(HazardBase):
    id: Optional[str] = Field(None, description="Deterministic or unique ID for the hazard")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Creation timestamp")


class HazardResponse(HazardBase):
    id: str
    created_at: datetime
    archived_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class HazardSourceLogResponse(BaseModel):
    id: str
    source: str
    fetched_at: datetime
    status: str
    records_count: int
    error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)



class IngestSummaryResponse(BaseModel):
    status: str
    sources_processed: List[str]
    hazards_ingested: int
    hazards_archived: int
    logs: List[Dict[str, Any]]
