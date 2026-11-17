# RakshaPath: Setup & Developer Guide

## 1. Prerequisites

* **Docker & Docker Compose** (v2+)
* **Python 3.11+**
* **Flutter SDK 3.19+** with Android SDK
* **Node.js 18+** & npm

---

## 2. API Keys & Service Credentials Setup

| Provider | Purpose | Where to Obtain | Environment Variable |
| :--- | :--- | :--- | :--- |
| **TomTom** | Live traffic incidents & road closures | [developer.tomtom.com](https://developer.tomtom.com) (Free tier) | `TOMTOM_API_KEY` |
| **OpenRouteService** | Alternative route calculation with avoid areas | [openrouteservice.org](https://openrouteservice.org) (Free tier) | `OPENROUTESERVICE_API_KEY` |
| **Open-Meteo** | Live weather forecasts & precipitation | [open-meteo.com](https://open-meteo.com) (No key required for non-commercial) | `OPEN_METEO_API_URL` |
| **Twilio** | SMS emergency alerts to family contacts | [twilio.com/console](https://www.twilio.com/console) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Firebase (FCM)** | High-priority hazard push notifications | [console.firebase.google.com](https://console.firebase.google.com) | `FIREBASE_CREDENTIALS_PATH` |

---

## 3. Running Services Locally

### Step 1: Environment Configuration
```bash
cp .env.example .env
# Edit .env with your local credentials or keep defaults for demo mode
```

### Step 2: Running Backend & Storage via Docker
```bash
docker compose up -d --build
```
* API Server: `http://localhost:8000`
* Swagger Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### Step 3: Running Mobile App (Planned)
```bash
cd app
flutter pub get
flutter run
```

### Step 4: Running Police Dashboard (Planned)
```bash
cd dashboard
npm install
npm run dev
```

---

## 4. Common Errors & Troubleshooting

* **Issue: `PostGIS extension not found` or `function st_dwithin does not exist`**
  * **Fix**: Ensure the database was booted with the official `postgis/postgis` image and [`infra/init-db.sql`](file:///c:/Users/nihall/Desktop/RakshaPath/infra/init-db.sql) executed. Run:
    ```bash
    docker compose exec db psql -U rakshapath -d rakshapath_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    ```
* **Issue: Backend cannot connect to Redis or DB**
  * **Fix**: Verify Docker containers are running using `docker compose ps`. Check if ports `5432` or `6379` conflict with existing host services.
* **Issue: `ModuleNotFoundError: No module named 'app'` during local pytest**
  * **Fix**: Set python path before running pytest:
    ```bash
    # Windows:
    $env:PYTHONPATH="backend"
    pytest backend/tests/
    # Linux/Mac:
    PYTHONPATH=backend pytest backend/tests/
    ```
