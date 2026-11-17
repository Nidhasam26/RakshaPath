# RakshaPath: REST API Specification

All timestamps are in ISO 8601 UTC format. Coordinates follow `[longitude, latitude]` in GeoJSON or `{lat, lng}` depending on standard REST conventions.

---

## 1. System Endpoints (Implemented)

### `GET /health`
* **Status**: **Implemented**
* **Description**: Checks service availability, PostgreSQL connection, PostGIS extension status, and Redis cache responsiveness.

#### Response (200 OK - Healthy)
```json
{
  "status": "ok",
  "app": "RakshaPath",
  "environment": "development",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "postgis": "healthy (3.4 USE_GEOS=1 USE_PROJ=1)"
  }
}
```

#### Response (503 Service Unavailable - Degraded)
```json
{
  "status": "degraded",
  "app": "RakshaPath",
  "environment": "development",
  "services": {
    "database": "unhealthy: connection refused",
    "redis": "healthy",
    "postgis": "unavailable"
  }
}
```

---

### `GET /`
* **Status**: **Implemented**
* **Description**: Root service identity check.

#### Response (200 OK)
```json
{
  "app": "RakshaPath",
  "status": "online",
  "version": "1.0.0"
}
```

---

## 2. Core Functional Endpoints (Planned)

### `POST /route`
* **Status**: Planned (Level 1)
* **Description**: Computes route geometry, detects hazards within 200m buffer, and returns route safety score.

#### Request Body
```json
{
  "start_lat": 12.9279,
  "start_lng": 77.6271,
  "dest_lat": 12.9716,
  "dest_lng": 77.5946
}
```

#### Response (200 OK)
```json
{
  "route_id": "rt_8492048",
  "distance_meters": 7800,
  "duration_seconds": 1250,
  "safety_score": 7.5,
  "score_breakdown": {
    "base": 10.0,
    "hazard_deduction": -1.5,
    "weather_risk_deduction": -1.0,
    "night_deduction": 0.0,
    "isolation_deduction": 0.0
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [77.6271, 12.9279],
      [77.6200, 12.9350],
      [77.5946, 12.9716]
    ]
  },
  "hazards_on_route": [
    {
      "id": "haz-sample-001",
      "type": "water_logging",
      "severity": "major",
      "distance_from_start_m": 3200,
      "description": "Severe water logging reported on Outer Ring Road underpass."
    }
  ]
}
```

---

### `GET /hazards`
* **Status**: Planned (Level 1)
* **Description**: Retrieve active hazards inside a bounding box `[min_lng, min_lat, max_lng, max_lat]`.

#### Query Parameters
* `bbox`: `77.50,12.85,77.75,13.05`

#### Response (200 OK)
```json
[
  {
    "id": "haz-sample-001",
    "type": "water_logging",
    "severity": "major",
    "confidence": 0.95,
    "source": "tomtom",
    "description": "Water logging underpass",
    "geometry": {
      "type": "Point",
      "coordinates": [77.6389, 12.9180]
    },
    "created_at": "2026-10-08T10:00:00Z",
    "expires_at": "2026-10-08T18:00:00Z"
  }
]
```

---

### `POST /trips/start`
* **Status**: Planned (Level 1)
* **Description**: Initializes an active trip with route geometry and FCM push token.

#### Request Body
```json
{
  "user_id": "usr_9921",
  "push_token": "fcm_device_token_xyz",
  "route": {
    "type": "LineString",
    "coordinates": [[77.6271, 12.9279], [77.5946, 12.9716]]
  }
}
```

#### Response (201 Created)
```json
{
  "trip_id": "trp_10023",
  "status": "active",
  "started_at": "2026-10-08T17:30:00Z"
}
```

---

### `POST /trips/{id}/location`
* **Status**: Planned (Level 1)
* **Description**: Ingests periodic live location update (every 30-60s) and triggers proximity check.

#### Request Body
```json
{
  "lat": 12.9350,
  "lng": 77.6200,
  "speed_mps": 11.2,
  "recorded_at": "2026-10-08T17:35:00Z"
}
```

#### Response (200 OK)
```json
{
  "status": "recorded",
  "hazards_ahead_count": 1
}
```

---

### `POST /sos`
* **Status**: Planned (Level 1)
* **Description**: Creates an emergency SOS record, triggers Twilio SMS to trusted contacts, and posts alert to police dashboard.

#### Request Body
```json
{
  "user_id": "usr_9921",
  "lat": 12.9350,
  "lng": 77.6200,
  "channel": "online",
  "trip_id": "trp_10023"
}
```

#### Response (201 Created)
```json
{
  "sos_id": "sos_77192",
  "status": "dispatched",
  "created_at": "2026-10-08T17:36:12Z",
  "contacts_notified": 2
}
```

---

### `GET /sos/active`
* **Status**: Planned (Level 1)
* **Description**: Returns all unresolved emergency alerts for the police dashboard.

#### Response (200 OK)
```json
[
  {
    "sos_id": "sos_77192",
    "user_name": "Rohan Sharma",
    "phone": "+919876543210",
    "lat": 12.9350,
    "lng": 77.6200,
    "channel": "online",
    "status": "new",
    "created_at": "2026-10-08T17:36:12Z",
    "note": null
  }
]
```

---

### `PATCH /sos/{id}`
* **Status**: Planned (Level 1)
* **Description**: Update alert status (`acknowledged`, `closed`) and operator resolution notes.

#### Request Body
```json
{
  "status": "acknowledged",
  "acknowledged_by": "Officer_Patil_204",
  "note": "Patrol vehicle dispatch unit 4 sent to coordinates."
}
```

#### Response (200 OK)
```json
{
  "sos_id": "sos_77192",
  "status": "acknowledged",
  "updated_at": "2026-10-08T17:37:05Z"
}
```
