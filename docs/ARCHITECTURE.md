# RakshaPath: Architecture Diagram & Service Responsibilities

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph External_Sources [Live Hazard & Emergency Feeds]
        TomTom[TomTom Traffic Incidents]
        OpenMeteo[Open-Meteo Weather API]
        NDMA[NDMA SACHET / IMD / USGS]
        NewsFeed[Local News & Alert Feeds]
    end

    subgraph Data_Ingestion [Ingestion & Processing Layer]
        Scheduler[Worker Scheduler]
        IngestService[Normalisation & Validation Engine]
        Dedupe[Spatial Deduplicator]
        Scheduler --> IngestService
        TomTom --> IngestService
        OpenMeteo --> IngestService
        NDMA --> IngestService
        NewsFeed --> IngestService
        IngestService --> Dedupe
    end

    subgraph Storage [Persistence & Caching]
        PostGIS[(PostgreSQL 16 + PostGIS 3.4)]
        Redis[(Redis 7 Cache & Queue)]
        Dedupe --> PostGIS
        Dedupe --> Redis
    end

    subgraph Backend_Core [FastAPI Backend Service]
        RouteAPI[Route & Safety Engine]
        TripAPI[Trip Tracking & Spatial Matcher]
        SOSAPI[SOS Emergency Controller]
        HealthAPI[GET /health Monitor]
        
        RouteAPI --> PostGIS
        TripAPI --> PostGIS
        TripAPI --> Redis
        SOSAPI --> PostGIS
        SOSAPI --> Redis
        HealthAPI --> PostGIS
        HealthAPI --> Redis
    end

    subgraph Notification_Subsystem [Dispatch Subsystem]
        FCM[Firebase Cloud Messaging]
        Twilio[Twilio SMS Gateway]
        Redis --> FCM
        Redis --> Twilio
    end

    subgraph Clients [Client Applications]
        AppOnline[Flutter Android App - Online]
        AppOffline[Flutter Android App - Offline SMS]
        PoliceDash[React Police Operations Dashboard]
    end

    AppOnline <-->|REST / HTTPS| Backend_Core
    FCM -.->|Push Warnings| AppOnline
    Twilio -.->|SMS Alert| FamilyContacts[Saved Family Contacts]
    AppOffline -.->|Direct Device SMS| FamilyContacts
    AppOffline -.->|Direct Device SMS| PoliceNumber[Configured Police Number]
    PoliceDash <-->|Real-Time Alerts| SOSAPI
```

---

## 2. Service Responsibilities

### **1. Ingestion & Validation Engine**
* **Responsibility**: Regularly pulls unstructured incident data from external APIs, transforms coordinates into WGS84 format, maps incident codes to unified severity levels, and rejects invalid payloads.
* **Failure Handling**: Catches network timeouts, records failures in `hazard_sources_log`, and utilizes cached data or sample fixtures.

### **2. Spatial Route & Safety Engine**
* **Responsibility**: Computes turn-by-turn routes via OSRM/ORS, executes PostGIS spatial queries (`ST_DWithin`) against the hazard dataset, and calculates the route safety score.

### **3. Trip Tracking & Warning Subsystem**
* **Responsibility**: Ingests periodic GPS updates from active trips, maintains the last-seen status, detects proximity to hazards 5 km ahead, and triggers proactive FCM push alerts.

### **4. Emergency SOS Controller**
* **Responsibility**: Receives SOS payloads, writes emergency records to PostgreSQL, updates the police dashboard in real-time, and fires SMS dispatch tasks to Twilio.

### **5. Police Operations Dashboard**
* **Responsibility**: Provides a real-time command-center view for police operators to monitor incoming SOS alerts, inspect live user coordinates, acknowledge emergencies, and record resolution notes.
