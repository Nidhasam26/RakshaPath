from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "RakshaPath"
    assert data["status"] == "online"


@patch("app.main.engine.connect")
@patch("redis.from_url")
def test_health_check_healthy(mock_redis_from_url, mock_db_connect):
    # Mock DB
    mock_conn = MagicMock()
    mock_db_connect.return_value.__enter__.return_value = mock_conn
    mock_conn.execute.return_value.scalar.return_value = "3.4 USE_GEOS=1 USE_PROJ=1"

    # Mock Redis
    mock_redis = MagicMock()
    mock_redis.ping.return_value = True
    mock_redis_from_url.return_value = mock_redis

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["services"]["database"] == "healthy"
    assert data["services"]["redis"] == "healthy"
    assert "3.4" in data["services"]["postgis"]


@patch("app.main.engine.connect")
@patch("redis.from_url")
def test_health_check_degraded_when_db_down(mock_redis_from_url, mock_db_connect):
    # DB connection fails
    mock_db_connect.side_effect = Exception("Connection refused")

    # Redis ok
    mock_redis = MagicMock()
    mock_redis.ping.return_value = True
    mock_redis_from_url.return_value = mock_redis

    response = client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert "unhealthy" in data["services"]["database"]
