# RakshaPath: Technical Design Document

## 1. System Components

* **API Server (FastAPI)**: REST endpoints for route computation, hazard retrieval, trip lifecycle management, and SOS creation.
* **Spatial Database (PostgreSQL + PostGIS)**: Primary data store holding points/polygons for hazards, linestrings for routes, and spatial indexes (`GIST`).
* **Cache & Message Broker (Redis)**: Caches external API queries to avoid rate limits; acts as background task/event queue for notifications.
* **Ingestion Workers (Celery / APScheduler)**: Scheduled workers pulling from TomTom, Open-Meteo, NDMA, and news feeds.
* **Notification Dispatcher**: Dispatches high-priority push warnings via Firebase Cloud Messaging (FCM) and SMS alerts via Twilio.
* **Mobile Client (Flutter)**: Android app with `flutter_map` (OpenStreetMap tiles), foreground trip GPS tracking, and offline SMS fallback.
* **Operations Dashboard (React)**: Web UI displaying live SOS emergency events on a map for emergency operators.

---

## 2. End-to-End Data Flows

### A. Automatic Hazard Ingestion Flow
1. **Fetch**: Worker triggers every 5–15 minutes, calling external APIs (TomTom Traffic, Open-Meteo Weather, NDMA alerts).
2. **Validate**: Payloads are validated against Pydantic ingestion schemas. Failed payloads are logged to `hazard_sources_log`.
3. **Normalise**: Extracted hazards are transformed into the unified Hazard Schema (`Point` or `Polygon` geometry, severity `minor`/`major`/`closure`, source, confidence, start/expiry time).
4. **Deduplicate**: Spatial proximity check (`ST_DWithin` < 50m) and temporal overlap merge duplicate reports from multiple sources.
5. **Persist & Cache**: Stored in PostgreSQL `hazards` table and indexed with PostGIS GIST; active hazards cached in Redis.

### B. Trip Tracking & Proactive Hazard Warnings
1. **Trip Start**: User inputs start/destination in the app; FastAPI computes route geometry (`LineString`) via OSRM/ORS and registers trip + FCM push token.
2. **Location Streaming**: App sends GPS coordinates every 30–60 seconds to `POST /trips/{id}/location`.
3. **Spatial Intersection**: Backend queries `ST_DWithin(route_geom, hazard_geom, 200m)` and checks hazards within 5 km ahead of the driver's current position.
4. **Warning Dispatch**: If a new hazard is ahead and has not yet been notified for this trip, backend enqueues an FCM message: *"Flooding ahead in 5 km. Tap for safer road."*
5. **Reroute**: Tapping notification queries ORS with `avoid_polygons` to display an alternate route with added travel time.

### C. Emergency SOS (Online vs Offline Flow)
```text
                  [ User Presses SOS ]
                           │
                [ 5-Second Cancel Window ]
                           │
                 Check Network Connection
                ┌──────────┴──────────┐
          [ Internet OK ]      [ Offline / No Signal ]
                │                         │
      POST /sos to Backend        Direct SMS via Device Modem
                │                         │
     ┌──────────┴──────────┐      ├─ SMS to Saved Family Contacts
     │                     │      ├─ SMS to Configured Police Number
Twilio SMS to Family  Live Alert on   └─ Link: maps.google.com/?q=lat,lng
                      Police Web Dash
```

---

## 3. Key Architectural Decisions & Rationale

| Decision | Rationale |
| :--- | :--- |
| **PostGIS for Spatial Calculations** | Standard SQL databases cannot perform accurate spherical distance searches or polygon intersections. PostGIS `ST_DWithin` and GIST indexing provide sub-10ms spatial queries across thousands of road hazards. |
| **Direct Device SMS Fallback** | In mountainous or flood-affected areas, cellular data is the first to drop. Direct SMS via the phone modem guarantees location delivery to family without server roundtrips. |
| **FCM High-Priority Push** | Allows backend to wake up the client device and display critical road block warnings even when the app is running in the background. |
| **Strict No-Hallucination Domain Rule** | An SOS must **never** be labeled as "sent" unless delivery is verified by server ACK or SMS modem confirmation. Weather hazards must be displayed as **risk estimates**, never as absolute facts. |

---

## 4. Safety Score Formula (Version 1)

Starting base score: **10.0 / 10.0**  
Deductions:
$$\text{Score} = 10.0 - (\text{Hazard Penalty}) - (\text{Weather Penalty}) - (\text{Night Travel}) - (\text{Isolation Penalty})$$

* **Hazard Penalty**:
  * Minor hazard within 200m: $-0.5$ per hazard
  * Major hazard within 200m: $-1.5$ per hazard
  * Road closure within 200m: $-3.0$ per hazard
  * Total hazard deduction capped at $-5.0$.
* **Weather Risk**: Heavy rain / storm / flood alert along route: up to $-2.0$.
* **Night Travel**: Travel between 22:00 and 05:00: $-1.0$.
* **Isolation (Emergency Services)**: No police station or hospital within 5 km of any 20 km stretch: $-1.0$.

*(Version 2 blends in machine learning road-risk segment probabilities).*

---

## 5. System Limits & Non-Goals

* **Offline Maps**: Map tile rendering requires an internet connection; only SOS location capturing and direct SMS dispatch function fully offline.
* **Real 112 Dispatch**: Direct integration with official emergency dispatch centers is out of scope for student version; demonstrated via the Police Web Dashboard.
* **Disaster Prediction**: RakshaPath relays official weather/disaster warnings (IMD/NDMA); it does not predict meteorological events independently.
