# RakshaPath 🛡️🚗

> **Know the danger before you reach it.**  
> A proactive safe-travel platform: collects road, weather, and disaster hazards automatically, scores route safety, warns drivers before they hit danger, and provides rapid online/offline SOS to family and police.

---

## 1. Overview & Key Capabilities

* **Automated Hazard Ingestion**: Ingests traffic incidents, weather risks, and official disaster alerts (TomTom, Open-Meteo, NDMA, IMD) without manual reports.
* **Proactive Trip Warnings**: Monitors active routes; sends FCM push warnings before the user approaches a danger zone.
* **Safety Scoring (1-10)**: Evaluates road segments by hazard severity, weather, night conditions, and emergency service proximity.
* **Dual-Channel Emergency SOS**:
  * **Online**: Instant backend broadcast to family (SMS/push) and the live police web dashboard (< 10s).
  * **Offline**: Direct device-level SMS containing last-known GPS map link and local safety actions (siren/flashlight).

---

## 2. Features by Scope Level

| Level | Name | Features | Status |
| :--- | :--- | :--- | :--- |
| **Level 0** | Scaffold & Infra | Monorepo structure, Docker Compose (PostGIS + Redis + FastAPI), CI workflow, config | **Done** |
| **Level 1** | Core | Auto hazards ingestion, route rendering, map pins, trip tracking, push alerts, online SOS, police web dashboard, contacts | **Partially Done (Backend Step 2 Done; Frontend Scaffold Done; Screen Logic Not Done Yet)** |
| **Level 2** | Reliable | Offline SMS SOS, avoid-area alternate routing, route safety score v1, missed-update alert, alert deduplication, retry queue | **Not Done Yet** |
| **Level 3** | Intelligent & Cloud | Hazard history warehouse, hotspot analytics, ML segment risk model, news-to-hazard LLM parser, cloud CI/CD | **Not Done Yet** |
| **Level 4** | Stretch | Shake & volume hardware SOS triggers, check-in timer, fake call, optimal departure timing | **Not Done Yet** |

---

## 3. Frontend Quickstart (No Backend / No .env Required)

### 1. Police Operations Dashboard (React with Vite)
```bash
cd frontend/dashboard

# Install npm dependencies
npm install

# Run static production build
npm run build

# Start local development server
npm run dev
# Open http://localhost:5173 in browser
```

### 2. Mobile Safe Navigation App (Flutter Android)
```bash
cd frontend/mobile

# Verify Dart code quality & compilation
flutter analyze

# Run unit tests
flutter test

# Launch on connected Android device or emulator
flutter run -d android
```

---

## 4. Tech Stack

| Component | Technology |
| :--- | :--- |
| **Mobile App** | Flutter (Android target), Riverpod, `flutter_map`, OpenStreetMap |
| **Backend API** | FastAPI (Python 3.11), SQLAlchemy 2.0, GeoAlchemy2, Alembic |
| **Database & Cache** | PostgreSQL 16 + PostGIS 3.4, Redis 7 |
| **Police Dashboard** | React (Vite / SPA), Leaflet |
| **ML & AI** | scikit-learn / XGBoost, Gemini / Anthropic API (news extractor) |
| **External Services** | TomTom Traffic, Open-Meteo, OpenRouteService / OSRM, Twilio, Firebase Cloud Messaging (FCM) |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions |

---

## 5. Quickstart (Docker Compose)

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Launch Local Stack
```bash
docker compose up -d --build
```

### 3. Apply Migrations & Seed Sample Hazards
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed
```

### 4. Verify Health Check
```bash
curl http://localhost:8000/health
```

---

## 6. Project Monorepo Structure

```text
RakshaPath/
├── .agent/rules/         # Team architectural rules & guidelines
├── .github/workflows/    # Automated CI (lint + pytest)
├── backend/              # FastAPI backend service
│   ├── alembic/          # Database migrations
│   ├── app/              # Application source code (models, core, db)
│   └── tests/            # Test suite (mocked + real PostGIS spatial tests)
├── frontend/
│   ├── dashboard/        # React police emergency operations dashboard
│   └── mobile/           # Flutter Android safe travel application
├── docs/                 # Architecture, API, DB, Setup, Testing, Frontend docs
├── ml/                   # ML road-risk model & news extraction
├── infra/                # Database scripts & cloud deployment assets
├── docker-compose.yml    # PostGIS + Redis + Backend container definitions
├── .env.example          # Environment variable template
├── CONTRIBUTING.md       # Contribution, branching, and PR rules
└── README.md             # Project overview & quickstart
```

---

## 7. Current Project Status

| Module | Scope Level | Status | Notes |
| :--- | :--- | :--- | :--- |
| Monorepo & Infra | Level 0 | **Done** | Docker Compose, PostGIS init, Redis, CI pipeline ready |
| Backend `/health` | Level 0 | **Done** | Verifies PostgreSQL, PostGIS, and Redis connectivity |
| Database Schema & Migrations | Level 1 | **Done** | Alembic `0001_initial_schema`, PostGIS GiST indexes, operators table, constraints |
| Hazard Ingestion Connectors | Level 1 | **Done** | TomTom & Open-Meteo ingestion, 50m spatial dedupe, auto-archival |
| Frontend Architecture & Scaffold | Level 1 | **Done** | `/frontend/mobile` (Flutter + Riverpod) & `/frontend/dashboard` (React + Vite) scaffolded with pure models & repository interfaces |
| Route Safety API | Level 1 | **Not Done Yet** | `POST /route` spatial hazard matching & safety score v1 |
| Trip Telemetry & Warnings | Level 1 | **Not Done Yet** | `POST /trips/start`, proactive FCM push warning pipeline |
| Emergency SOS Backend & Dispatch | Level 1 | **Not Done Yet** | `POST /sos`, Twilio SMS integration, police websocket stream |
| Mobile Auth & App Shell | Level 1 | **Done** | Welcome screen, Sign In, Sign Up, validation, local session persistence, Home Shell |
| Mobile Map & Trip Logic | Level 1 | **Not Done Yet** | Live UI implementation connecting map, route, and trip screens to repositories |
| Police Dashboard Live Logic | Level 1 | **Not Done Yet** | Real-time incident triage and map telemetry subscription |
