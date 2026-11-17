# RakshaPath: Database & Spatial Schema Design

* **Database Engine**: PostgreSQL 16
* **Spatial Extension**: PostGIS 3.4
* **ORM & Migration**: SQLAlchemy 2.0 + GeoAlchemy2 + Alembic (Migration: `0001_initial_schema`)
* **Coordinate System**: WGS 84 (SRID: `4326` storage, cast to `geography` for metric distance queries)

---

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ CONTACTS : "has (1..5)"
    USERS ||--o{ TRIPS : "initiates"
    USERS ||--o{ SOS_ALERTS : "triggers"
    TRIPS ||--o{ TRIP_LOCATIONS : "streams"
    TRIPS ||--o{ NOTIFICATIONS_SENT : "receives"
    HAZARDS ||--o{ NOTIFICATIONS_SENT : "triggers"

    USERS {
        uuid id PK
        string name
        string phone UK
        string push_token
        timestamp created_at
    }

    CONTACTS {
        uuid id PK
        uuid user_id FK
        string name
        string phone
        string type "CHECK IN ('family', 'police')"
        timestamp created_at
    }

    HAZARDS {
        string id PK
        string type "INDEXED"
        geometry geometry "Point / Polygon (SRID 4326, GiST INDEX)"
        int severity "CHECK 1..4 (1=minor, 2=mod, 3=major, 4=closure)"
        float confidence "CHECK 0.0..1.0"
        string source
        text description
        timestamp created_at
        timestamp expires_at "INDEXED"
        timestamp archived_at "INDEXED"
    }

    HAZARD_SOURCES_LOG {
        uuid id PK
        string source
        timestamp fetched_at
        string status
        int records_count
        text error
    }

    TRIPS {
        uuid id PK
        uuid user_id FK
        geometry route "LineString (SRID 4326, GiST INDEX)"
        string status "CHECK IN ('active', 'completed', 'cancelled')"
        timestamp started_at
        timestamp ended_at
        timestamp last_seen_at
        float last_lat
        float last_lng
    }

    TRIP_LOCATIONS {
        uuid id PK
        uuid trip_id FK
        float lat
        float lng
        float speed_mps
        timestamp recorded_at "INDEXED"
    }

    SOS_ALERTS {
        uuid id PK
        uuid user_id FK
        uuid trip_id FK
        float lat
        float lng
        string channel "CHECK IN ('online', 'sms')"
        string status "CHECK IN ('new', 'acknowledged', 'closed')"
        string acknowledged_by
        timestamp created_at "INDEXED"
        timestamp closed_at
        text note
    }

    NOTIFICATIONS_SENT {
        uuid id PK
        uuid trip_id FK
        string hazard_id FK
        string channel
        timestamp sent_at
        boolean delivered
    }

    OPERATORS {
        uuid id PK
        string name
        string email UK "INDEXED"
        string password_hash
        string role
        timestamp created_at
    }

    SEGMENT_RISK {
        uuid id PK
        string segment_id UK "INDEXED"
        geometry geometry "Point/LineString/Polygon (SRID 4326, GiST INDEX)"
        float risk_score
        string model_version
        timestamp computed_at
    }
```

---

## 2. Spatial Query Specifications

### Route-Hazard Spatial Matching (`ST_DWithin`)
All metric distance calculations are performed on spheroidal `geography` casts to preserve geographic accuracy across latitude gradients:

```sql
SELECT 
    h.id, 
    h.type, 
    h.severity, 
    h.description,
    ST_Distance(h.geometry::geography, ST_GeomFromText(:route_wkt, 4326)::geography) AS distance_meters
FROM hazards h
WHERE h.archived_at IS NULL
  AND ST_DWithin(h.geometry::geography, ST_GeomFromText(:route_wkt, 4326)::geography, :buffer_meters)
ORDER BY distance_meters ASC;
```

---

## 3. Constraints & Indexes Summary

| Table | Index / Constraint | Purpose |
| :--- | :--- | :--- |
| `hazards` | `idx_hazards_geometry` (GiST) | Accelerated spatial intersection & proximity queries |
| `hazards` | `check_hazard_severity_range` | Restricts severity values to `1 <= severity <= 4` |
| `hazards` | `check_hazard_confidence_range` | Restricts confidence values to `0.0 <= confidence <= 1.0` |
| `hazards` | `idx_hazards_type`, `idx_hazards_expires_at` | Rapid filtering during scheduled ingestion & cleanup |
| `trips` | `idx_trips_route` (GiST) | Spatial lookup for active routes |
| `contacts` | `check_contact_type` | Enforces `type IN ('family', 'police')` |
| `operators` | `idx_operators_email` (UNIQUE) | Fast, unique authentication lookups for police dashboard |
