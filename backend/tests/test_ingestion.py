import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.endpoints.hazards import get_db
from app.connectors.tomtom import TomTomConnector
from app.connectors.open_meteo import OpenMeteoConnector
from app.connectors.sample_seed import SampleSeedConnector
from app.services.hazard_service import HazardIngestionService
from app.schemas.hazard import HazardCreate, HazardResponse, GeoJSONGeometry, IngestSummaryResponse


@pytest.fixture
def tomtom_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "tomtom_incidents_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def open_meteo_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "open_meteo_weather_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_tomtom_response_parsing_and_normalization(tomtom_fixture):
    """Verify TomTom incident parser correctly maps icons, severities, and GeoJSON geometries."""
    connector = TomTomConnector(api_key="mock_key")
    hazards = connector.parse_incidents_response(tomtom_fixture)

    assert len(hazards) == 3

    # Incident 1: Accident (iconCategory 1, delay 3) -> severity 3
    h1 = hazards[0]
    assert h1.id == "tomtom-tt-inc-1001"
    assert h1.type == "accident"
    assert h1.severity == 3
    assert h1.confidence >= 0.85
    assert h1.source == "tomtom"
    assert h1.geometry.type == "Point"
    assert h1.geometry.coordinates == [77.6271, 12.9279]
    assert "collision" in h1.description.lower()

    # Incident 2: Road Closed (iconCategory 8) -> severity 4 (closure)
    h2 = hazards[1]
    assert h2.id == "tomtom-tt-inc-1002"
    assert h2.type == "road_closure"
    assert h2.severity == 4
    assert h2.geometry.coordinates == [77.6612, 12.9558]

    # Incident 3: Jam (iconCategory 6, delay 2) -> severity 2
    h3 = hazards[2]
    assert h3.id == "tomtom-tt-inc-1003"
    assert h3.type == "traffic_congestion"
    assert h3.severity == 2


def test_open_meteo_weather_response_parsing(open_meteo_fixture):
    """Verify Open-Meteo parser detects severe weather WMO codes & heavy rainfall triggers."""
    connector = OpenMeteoConnector()
    hazards = connector.parse_weather_response(open_meteo_fixture, lat=12.9716, lon=77.5946)

    assert len(hazards) >= 1
    h = hazards[0]
    assert h.source == "open_meteo"
    assert h.geometry.type == "Point"
    assert h.geometry.coordinates == [77.5946, 12.9716]
    assert h.severity >= 3  # Heavy rain / thunderstorm trigger
    assert h.type in ["heavy_rainfall", "thunderstorm", "water_logging"]
    assert h.confidence >= 0.8


def test_sample_seed_connector():
    """Verify seed connector loads sample hazards and provides active timestamps."""
    connector = SampleSeedConnector()
    hazards = connector.fetch_hazards()
    assert len(hazards) >= 5

    now_utc = datetime.now(timezone.utc)
    for h in hazards:
        assert h.severity in [1, 2, 3, 4]
        assert 0.0 <= h.confidence <= 1.0
        assert h.expires_at > now_utc
        assert h.geometry.type in ["Point", "Polygon"]


def test_mocked_api_endpoints():
    """Unit test for GET /hazards, POST /hazards/ingest, and GET /hazards/sources/log using mocked DB."""
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    client = TestClient(app)

    try:
        # Mock active hazards response
        with patch("app.api.endpoints.hazards.hazard_service.get_active_hazards") as mock_get_hazards:
            mock_get_hazards.return_value = [
                HazardResponse(
                    id="mock-haz-01",
                    type="water_logging",
                    severity=3,
                    confidence=0.9,
                    source="tomtom",
                    description="Water logging underpass",
                    geometry=GeoJSONGeometry(type="Point", coordinates=[77.6389, 12.9180]),
                    created_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
                )
            ]

            res = client.get("/hazards?type=water_logging")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 1
            assert data[0]["id"] == "mock-haz-01"
            assert data[0]["type"] == "water_logging"

        # Mock ingest endpoint
        with patch("app.api.endpoints.hazards.hazard_service.ingest_all") as mock_ingest:
            mock_ingest.return_value = IngestSummaryResponse(
                status="completed",
                sources_processed=["tomtom", "open_meteo"],
                hazards_ingested=3,
                hazards_archived=0,
                logs=[{"source": "tomtom", "status": "success", "records_count": 2}],
            )

            res = client.post("/hazards/ingest?source=tomtom")
            assert res.status_code == 200
            summary = res.json()
            assert summary["status"] == "completed"
            assert summary["hazards_ingested"] == 3

        # Mock source logs endpoint
        with patch("app.api.endpoints.hazards.hazard_service.get_ingestion_logs") as mock_logs:
            mock_log = MagicMock()
            mock_log.id = "c4d3b841-8c46-4e08-9df2-8dfb5b8d23d8"
            mock_log.source = "tomtom"
            mock_log.fetched_at = datetime.now(timezone.utc)
            mock_log.status = "success"
            mock_log.records_count = 2
            mock_log.error = None
            mock_logs.return_value = [mock_log]

            res = client.get("/hazards/sources/log")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 1
            assert data[0]["source"] == "tomtom"
            assert data[0]["status"] == "success"
    finally:
        app.dependency_overrides.clear()


def test_mocked_deduplication_and_persistence():
    """Unit test for deduplicate_and_persist with mock database session."""
    service = HazardIngestionService()
    mock_db = MagicMock()

    # Simulate existing hazard found
    existing_haz = MagicMock()
    existing_haz.id = "mock-existing-1"
    existing_haz.severity = 2
    existing_haz.confidence = 0.8
    existing_haz.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    existing_haz.description = "Old description"

    # Query returns existing hazard
    mock_db.query.return_value.filter.return_value.first.return_value = existing_haz

    new_haz = HazardCreate(
        id="mock-existing-1",
        type="water_logging",
        severity=4,
        confidence=0.95,
        source="tomtom",
        description="Updated severe flooding",
        geometry=GeoJSONGeometry(type="Point", coordinates=[77.62, 12.93]),
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=3),
    )

    count = service.deduplicate_and_persist(mock_db, [new_haz])
    assert count == 1
    assert existing_haz.severity == 4
    assert existing_haz.confidence == 0.95
    assert "Updated severe flooding" in existing_haz.description
    mock_db.commit.assert_called()


def test_mocked_hazard_expiry_and_archival():
    """Unit test for archive_expired_hazards with mock database session."""
    service = HazardIngestionService()
    mock_db = MagicMock()

    exp_haz = MagicMock()
    exp_haz.id = "mock-exp-1"
    exp_haz.archived_at = None

    mock_db.query.return_value.filter.return_value.all.return_value = [exp_haz]

    archived_count = service.archive_expired_hazards(mock_db)
    assert archived_count == 1
    assert exp_haz.archived_at is not None
    mock_db.commit.assert_called()


def test_mocked_ingestion_failure_drill():
    """Unit test simulating external network failure recorded in hazard_sources_log."""
    service = HazardIngestionService()
    mock_db = MagicMock()

    with patch.object(service.connectors["tomtom"], "fetch_hazards", side_effect=Exception("API Gateway 502")):
        summary = service.ingest_all(mock_db, sources=["tomtom"])
        assert summary.status == "completed"
        assert summary.hazards_ingested == 0
        assert len(summary.logs) == 1
        assert summary.logs[0]["status"] == "failed"
        assert "API Gateway 502" in summary.logs[0]["error"]
        mock_db.add.assert_called()
        mock_db.commit.assert_called()



def test_spatial_deduplication_and_persistence(db):
    """Verify spatial deduplication merges duplicate reports within 50m of same type in live PostGIS."""
    service = HazardIngestionService()

    test_id_1 = "haz-dedup-test-1"
    test_id_2 = "haz-dedup-test-2"

    h1 = HazardCreate(
        id=test_id_1,
        type="water_logging",
        severity=2,
        confidence=0.8,
        source="tomtom",
        description="Puddle near bridge",
        geometry=GeoJSONGeometry(type="Point", coordinates=[77.61000, 12.90000]),
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=2),
    )

    # h2 is within 20m of h1 with same type ("water_logging") and higher severity (3)
    h2 = HazardCreate(
        id=test_id_2,
        type="water_logging",
        severity=3,
        confidence=0.95,
        source="open_meteo",
        description="Severe flooding underpass",
        geometry=GeoJSONGeometry(type="Point", coordinates=[77.61010, 12.90005]),
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=4),
    )

    service.deduplicate_and_persist(db, [h1])
    active = service.get_active_hazards(db, hazard_type="water_logging")
    matching = [x for x in active if x.id == test_id_1]
    assert len(matching) == 1
    assert matching[0].severity == 2

    service.deduplicate_and_persist(db, [h2])
    active_after = service.get_active_hazards(db, hazard_type="water_logging")
    merged = [x for x in active_after if x.id == test_id_1]
    assert len(merged) == 1
    assert merged[0].severity == 3
    assert merged[0].confidence == 0.95


def test_hazard_expiry_and_archival(db):
    """Verify expired hazards are flagged as archived."""
    service = HazardIngestionService()
    expired_id = "haz-expired-test"

    h_exp = HazardCreate(
        id=expired_id,
        type="traffic_congestion",
        severity=1,
        confidence=0.7,
        source="tomtom",
        description="Cleared congestion",
        geometry=GeoJSONGeometry(type="Point", coordinates=[77.6500, 12.9500]),
        created_at=datetime.now(timezone.utc) - timedelta(hours=5),
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=10),
    )

    service.deduplicate_and_persist(db, [h_exp])
    archived_count = service.archive_expired_hazards(db)
    assert archived_count >= 1

    active = service.get_active_hazards(db)
    assert not any(h.id == expired_id for h in active)


def test_ingestion_failure_drill(db):
    """Simulate connector network failure and verify logging to hazard_sources_log."""
    service = HazardIngestionService()

    with patch.object(service.connectors["tomtom"], "fetch_hazards", side_effect=Exception("Connection timed out")):
        summary = service.ingest_all(db, sources=["tomtom"])
        assert summary.status == "completed"
        assert summary.hazards_ingested == 0

        logs = service.get_ingestion_logs(db, limit=5)
        failed_log = next((l for l in logs if l.source == "tomtom" and l.status == "failed"), None)
        assert failed_log is not None
        assert "Connection timed out" in failed_log.error
