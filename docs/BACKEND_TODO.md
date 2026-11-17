# RakshaPath: Backend Expected Endpoints & Implementation Backlog

This document specifies the first draft list of expected REST API endpoints required by the frontend clients (Mobile App and Police Dashboard). All endpoints are currently marked **[Planned]**.

---

## 1. Authentication Endpoints (`/auth`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | **Planned** | Register a new user with name, phone, and password | Section 12 |
| `/auth/login` | `POST` | **Planned** | Authenticate user via phone and password, return JWT token | Section 12 |
| `/auth/me` | `GET` | **Planned** | Fetch authenticated user profile and saved settings | Section 12 |
| `/auth/logout` | `POST` | **Planned** | Revoke current user session / token | Section 12 |
| `/auth/operator/login` | `POST` | **Planned** | Authenticate police operator badge number and password | E4 |

---

## 2. Hazard Retrieval Endpoints (`/hazards`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/hazards` | `GET` | **Planned** | Fetch active hazards within a bounding box (`bbox=minLng,minLat,maxLng,maxLat`) | A4, B2 |
| `/hazards/{id}` | `GET` | **Planned** | Fetch complete metadata, source, and geometry for a specific hazard | A4, B2 |
| `/hazards/sources/log` | `GET` | **Planned** | Review ingestion health, record counts, and source errors | F3, F4 |

---

## 3. Route & Safety Scoring Endpoints (`/route`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/route` | `POST` | **Planned** | Calculate OSRM route, match hazards within 200m buffer, compute Safety Score (out of 10), and calculate avoid-area alternate route | B1, B3, B5, B6 |

---

## 4. Trips & Location Telemetry Endpoints (`/trips`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/trips/start` | `POST` | **Planned** | Register an active trip with user ID, route polyline, and FCM push token | C1 |
| `/trips/{id}/location` | `POST` | **Planned** | Ingest periodic GPS telemetry (every 30-60s), check for hazards within 5km ahead | C2, C3 |
| `/trips/{id}/end` | `POST` | **Planned** | Conclude active trip and cease location tracking | C1, C2 |

---

## 5. Emergency SOS Endpoints (`/sos`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/sos` | `POST` | **Planned** | Ingest distress trigger, record GPS coordinates, notify family via SMS/push, and publish alert to police dashboard | D4, D9 |
| `/sos/{id}/cancel` | `POST` | **Planned** | Cancel false alarm during countdown or after initiation | D9 |
| `/sos/active` | `GET` | **Planned** | List all active unclosed SOS incidents for the police operations dashboard | E1, E2 |
| `/sos/{id}` | `PATCH` | **Planned** | Update incident status (`new` -> `acknowledged` -> `closed`) and log operator dispatch notes | E3 |

---

## 6. Trusted Contacts Endpoints (`/contacts`)

| Endpoint | Method | Status | Description | PRD ID |
| :--- | :--- | :--- | :--- | :--- |
| `/contacts` | `GET` | **Planned** | Retrieve user's 1 to 5 saved trusted emergency contacts | D8 |
| `/contacts` | `POST` | **Planned** | Add a new trusted emergency contact (family or police) | D8 |
| `/contacts/{id}` | `DELETE` | **Planned** | Delete an emergency contact | D8 |
