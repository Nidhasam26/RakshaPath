# [ARCHIVED] Product Requirements Document (PRD v4.0 - Flutter)
> **Note: Superseded by /PRD.md (v5.1 - React + Vite). This file is preserved for historical reference.**

---

RakshaPath: Product Requirements Document
Tagline: Know the danger before you reach it. Type: Mini project (team) | Platform: Android app, web police dashboard, cloud backend | Version: 3.0

1. Overview
RakshaPath is a safe-travel platform. It collects road, weather and disaster hazards automatically from live sources (nobody has to upload anything), matches them to the traveller's route, warns the traveller by push notification before they reach the affected road, suggests a safer road, scores each route for safety, and gives a one-press SOS that alerts family and police online or offline.

Beyond live warnings, the platform stores every hazard it sees. This history powers analytics (hotspot maps) and a machine learning risk model that estimates which road segments are likely to be unsafe in upcoming weather.

2. Problem Statement
During storm and rainy seasons, fallen trees, floods, landslides and disaster alerts appear suddenly. Travellers find out only after reaching the spot, have no quick way to call for help, and in low-signal areas their family has no way to know something went wrong.

3. Existing Solutions and Gap
Existing	What it does	Gap
Google Maps / Waze	Routes plus driver-reported incidents	Depends on reports; weak in small towns; no route safety score; no SOS
SOS / safety apps	SOS and location sharing	Not linked to route hazards; mostly need internet
Government alert systems	Issue disaster warnings	Not tied to the traveller's route; user must read and interpret them
Difference: hazards flow in automatically, are matched to the traveller's route, trigger a push warning and a reroute, are scored with a data-driven safety model, and SOS keeps working offline through SMS.

4. Goals and Non-Goals
Goals
G1: Collect hazards automatically from live sources with no manual input.
G2: Warn the traveller before the hazard and suggest a safer road.
G3: Give every route a safety score out of 10 with a visible explanation.
G4: Send SOS to family and police in under 10 seconds online, and by SMS offline.
G5: Retain hazard history and expose analytics and a learned risk estimate.
G6: Run the whole system on managed cloud infrastructure with automated deployment.
Non-Goals (this version)
Real police or 112 integration (needs government approval; a demo dashboard is used)
Offline maps and offline hazards (only SOS works offline)
Predicting disasters themselves (the app relays official warnings; the ML model estimates road risk only and is labelled as an estimate)
iOS app, camera AI, phone-sensor blockage detection

5. Target Users
User	Need
Commuter	Avoid blocked or flooded roads
Long-distance traveller	Weather and disaster warnings for the whole route
Person travelling alone at night	Quick help if unsafe
Family member	Receives alert with live location
Police operator (demo)	Sees live SOS alerts on a map
Admin / analyst	Views hazard hotspots and system health

6. Product Scope Levels
Work is organised by scope level, not calendar. Each level must be demo-ready before the next is treated as in scope.

Level 1, Core: auto hazards, route, hazards on map, trip start, push warning, SOS online, police dashboard, saved contacts.
Level 2, Reliable: offline SMS SOS, alternate route, safety score, missed-update alert, official alert feeds, notification de-duplication, retry queue.
Level 3, Intelligent and Cloud-native: hazard history warehouse, hotspot analytics, ML road-risk model, news-to-hazard extractor, full cloud deployment with CI/CD and monitoring.
Level 4, Stretch: shake and volume triggers, check-in timer, fake call, best time to leave, regional language.
Priority tags: P0 must build, P1 should build, P2 if time remains.

7. Functional Requirements
Module A: Automatic Hazard Collection
ID	Requirement	Priority
A1	Scheduled job runs every 5 to 15 minutes and fetches traffic incidents (TomTom)	P0
A2	Same job fetches weather (Open-Meteo) for active trips and mapped areas	P0
A3	Fetch official alerts: NDMA SACHET, IMD, INCOIS, USGS earthquakes (confirm access for each; use the ones that work)	P1
A4	Normalise every source into one hazard schema: type, point or polygon geometry, severity, source, confidence, start time, expiry time	P0
A5	Remove or archive expired and cleared hazards automatically	P0
A6	Cache API responses so free-tier limits are respected	P1
A7	Keep a fixed sample hazard set that can be switched on for demos and tests	P0
A8	Deduplicate the same hazard reported by multiple sources (merge by type and location within a distance and time window)	P1

Module B: Route, Map and Warnings
ID	Requirement	Priority
B1	User enters start and destination; app draws the route (OSRM)	P0
B2	Hazards shown as coloured pins; disaster areas as shaded zones	P0
B3	List hazards within 200 m of the route or inside a disaster zone ("3 hazards on your way") using a spatial query	P0
B4	Weather-risk segments use risk wording, never stated as confirmed fact	P0
B5	Suggest a safer alternate road that avoids the hazard area, with extra time (OpenRouteService avoid-area)	P1
B6	Safety Score out of 10 per route with a breakdown of what lowered it	P1
B7	Nearby police stations, hospitals and open places shown along the route (Overpass)	P1
B8	Best time to leave from the hourly forecast	P2

Module C: Push Notifications
ID	Requirement	Priority
C1	"Start trip" stores the route and phone push token on the server	P0
C2	Phone sends location every 30 to 60 seconds during a trip (adaptive to save battery)	P0
C3	When a new hazard appears within about 5 km ahead on the route, send a push via Firebase Cloud Messaging: "Flooding ahead in 5 km. Tap for a safer road."	P0
C4	Tap notification opens the map with the suggested alternate route	P1
C5	Never repeat the same alert for the same hazard on the same trip	P1
C6	Official disaster alerts (cyclone, tsunami) for the traveller's area are sent immediately	P1
C7	Alerts are processed through a message queue so bursts do not delay delivery	P1

Module D: Safety SOS (online and offline)
ID	Requirement	Priority
D1	Large SOS button always visible on the map screen	P0
D2	Trigger methods: button (P0), shake and volume button pressed 3 times (P2)	P0 / P2
D3	Capture GPS on trigger (works without internet)	P0
D4	Online: alert goes to backend; backend notifies family (SMS and push) and police dashboard	P0
D5	Offline: phone sends SMS to saved family and a configured police number with a map link of the last location	P1
D6	Always-visible "Call 112" button	P0
D7	If sending fails, store the alert locally and retry when any signal returns	P1
D8	Save 1 to 5 trusted contacts	P0
D9	5-second cancel window to avoid false alarms	P1
D10	"Someone Is Following Me" mode: share live location and show nearest safe places	P1
D11	Missed-update alert: if the phone goes silent beyond a set time during a trip, server alerts family and police with last seen place, time and route	P1
D12	Check-in timer and fake call	P2
D13	Status panel shows Internet, GPS and SMS state honestly; the app never says "sent" unless delivery was confirmed	P0

Module E: Police Dashboard (web)
ID	Requirement	Priority
E1	Live list and map of active SOS alerts (real-time updates)	P0
E2	Each alert shows time, location, user name, route, last seen, status (new / acknowledged / closed)	P1
E3	Operator can acknowledge, add a note, and close an alert	P1
E4	Operator login with role-based access	P1

Module F: Data and Analytics
ID	Requirement	Priority
F1	Every hazard is archived with geometry, type, severity, source and lifetime in the warehouse	P1
F2	Hotspot map: roads and areas with repeated hazards, filterable by type, month and hour	P1
F3	Analytics dashboard: hazards per day, by source, average hazard lifetime, alert delivery latency	P1
F4	Data quality checks on ingestion (schema validation, missing coordinates, stale source detection) with failures logged	P1

Module G: Intelligence (AI and ML)
ID	Requirement	Priority
G1	Road-risk model: a gradient-boosted model estimates risk per road segment using rainfall forecast, elevation or low-lying flag, historical hazard frequency, time of day and road type. Output is shown as "elevated risk", never as fact	P1
G2	Safety score v2: combine hazard count and severity, model risk, night time, and distance to police and hospitals; breakdown shown to the user. Version 1 is a fixed weighted formula, version 2 blends in the model output	P1
G3	News-to-hazard extractor: an LLM reads local news and alert text, extracts a structured hazard (type, place, time, severity), geocodes the place (Nominatim) and creates a low-confidence hazard pin that is clearly marked as "from news"	P2
G4	Model evaluation is reported: precision and recall against held-out historical hazards, and a comparison against a no-model baseline	P1

8. Key User Flows
Trip warning: Start trip, route shown, server watches hazards, new hazard appears ahead, push notification, tap, safer road shown.

SOS online: Trigger, 5-second cancel window, GPS captured, alert to server, family notified, dashboard updated, operator acknowledges.

SOS offline: Trigger, GPS captured, no internet detected, SMS to family and police number, alert saved for later sync, "Call 112" shown.

Phone goes silent: No updates for the set time, server alerts family and dashboard with last seen place and route.

Hazard lifecycle: Fetched, normalised, deduplicated, stored, matched to trips, pushed, expired, archived, used in analytics and model training.

9. Offline Behaviour
Feature	Online	Offline
Map, hazards, weather, score, push warnings	Works	Not available (by design)
SOS trigger and GPS	Works	Works
Alert to family and police	Via server	Via phone SMS
Saved contacts and last location	Works	Works (stored on phone)
No signal at all		Alert stored and sent when any signal returns; siren and flashlight work locally

10. System Architecture
TomTom / Open-Meteo / NDMA-IMD-INCOIS / USGS / News feeds
        |   (scheduler, every 5-15 min)
        v
  Ingestion workers -> validation -> normalise -> dedupe
        |
        v
  PostgreSQL + PostGIS  <---->  Object storage (raw payloads, model files)
        |        |
        |        +--> Analytics / hotspot queries --> Admin dashboard
        |        +--> ML service (road-risk model, news extractor)
        v
  FastAPI backend ----> Message queue ----> Notification worker
        |                                        |-> Firebase Cloud Messaging (push)
        |                                        |-> Twilio (SMS to family, online)
        +--> Police dashboard (web, live updates)

Android app <----> FastAPI backend (route, hazards, SOS, trip location)
Offline path: phone SMS + stored GPS
Cloud and operations

Containerised services (backend, workers, ML service) deployed on a managed cloud (AWS or GCP free or student tier).
Managed PostgreSQL with PostGIS, managed scheduler, managed queue, object storage for raw data and model artefacts.
CI/CD pipeline: lint, test, build image, deploy on merge.
Monitoring: structured logs, error alerts, ingestion health dashboard, push and SOS latency metrics.
Secrets in the cloud secret manager, never in the repository.

11. Tech Stack
Layer	Choice
Android app	Flutter (flutter_map with OpenStreetMap) or React Native
Backend	FastAPI, Celery or APScheduler workers
Database	PostgreSQL + PostGIS
Queue	Redis, SQS or Pub/Sub
ML	scikit-learn or XGBoost, served by the backend or a small ML service
LLM	Anthropic API for the news extractor (structured JSON output)
Routing and places	OSRM, OpenRouteService, Overpass, Nominatim
Hazard sources	TomTom, Open-Meteo, NDMA SACHET, IMD, INCOIS, USGS
Push and SMS	Firebase Cloud Messaging, Twilio (online), device SMS (offline)
Dashboard	React
Infra	Docker, GitHub Actions, AWS or GCP

12. Data Model
users: id, name, phone, push_token, created_at
contacts: id, user_id, name, phone, type (family / police)
hazards: id, type, geometry (PostGIS point or polygon), severity, confidence, source, description, created_at, expires_at, archived_at
hazard_sources_log: id, source, fetched_at, status, records_count, error
trips: id, user_id, route (PostGIS linestring), status, last_seen_at, last_lat, last_lng
trip_locations: id, trip_id, lat, lng, recorded_at
sos_alerts: id, user_id, lat, lng, created_at, channel (online / sms), status, acknowledged_by, closed_at, note
notifications_sent: id, trip_id, hazard_id, channel, sent_at, delivered
segment_risk: segment_id, geometry, risk_score, model_version, computed_at
operators: id, name, email, role

13. API Endpoints
POST /route: start and end in; routes, hazards, risk and score out
GET /hazards?bbox=: hazards in an area
POST /trips/start, POST /trips/{id}/location, POST /trips/{id}/end
POST /sos: create alert (notifies family and dashboard)
GET /sos/active, PATCH /sos/{id}: police dashboard
GET /analytics/hotspots, GET /analytics/summary: admin
GET /health: service and ingestion status
Internal jobs: fetch traffic, weather, official alerts, news; deduplicate; match hazards to trips; send push; recompute segment risk; missed-update check

14. Safety Score (v1 formula)
Start at 10 and subtract:

hazards within 200 m: weighted by severity (minor 0.5, major 1.5, closure 3.0), capped
weather risk along the route: up to 2
travel at night: up to 1
no police station or hospital within 5 km of any 20 km stretch: up to 1
The score is shown with its breakdown. Version 2 adds the model risk term (Module G).

15. Non-Functional Requirements
Speed: SOS sent within 10 seconds; route result within 5 seconds; push within 1 minute of hazard detection.
Reliability: cached API results, sample hazards as demo backup, retry queue for SOS and push, graceful degradation when a source is down.
Scalability: services are stateless and horizontally scalable; load test target of 500 concurrent trips on the free-tier setup.
Privacy: location shared only during a trip or SOS; HTTPS everywhere; contacts encrypted at rest; location history auto-deleted after a set period; clear consent screens; privacy policy and terms pages.
Usability: large SOS button, high contrast, minimal steps, readable in daylight.
Permissions: location, SMS, contacts, notifications, each with a clear in-app reason.
Honesty: the app states data source, time and confidence for every hazard.

16. Testing and Evaluation
Unit and integration tests for ingestion, normalisation, spatial matching and the SOS flow.
Ingestion tests with recorded API responses so tests do not depend on live services.
Field tests on at least 3 routes, including one with low signal.
Model evaluation: train-test split by time, report precision and recall, compare with the baseline.
Load test of the trip location endpoint and push pipeline.
Failure drills: kill the ingestion worker, disable internet on the phone, block SMS, and confirm the app reports status honestly.

17. Success Metrics
Hazards appear on the map with no manual input
Push arrives before the user reaches a test hazard, within 1 minute of detection
Alternate route avoids the hazard area on 3 test routes
SOS reaches family and dashboard in under 10 seconds online
Offline SMS sent with a correct location link in at least 9 of 10 test runs
Missed-update alert fires when the test phone goes silent
Road-risk model beats the no-model baseline on held-out data
Backend deploys automatically from the main branch and ingestion health is visible on a dashboard

18. Risks and Mitigations
Risk	Plan
Little traffic data in small towns	Demo on a big-city route; keep saved sample hazards; use weather and official alerts for coverage
Traffic data rarely says "fallen tree"	Show as "road closed / obstruction"; news extractor adds context at low confidence
Official disaster feeds need registration or lack a clean API	Use any available feed; simulate one alert for demo and say so
Tsunami and cyclone alerts exist only when agencies issue them	State clearly that the app relays and does not predict
Not enough historical data to train the model	Start ingestion early at Level 1, backfill from open weather history, and report honest limits
Android restricts SMS permissions for store apps	Distribute as a direct APK for the project; note the limit for future release
Push needs internet	Missed-update alert covers no-signal areas
SMS fails with zero balance	Always show "Call 112"
False SOS alarms	Cancel window and confirmation
Battery drain from location updates	Adaptive update interval, stop on trip end
LLM extraction errors	Low-confidence label, never triggers push alone, human-readable source link
No public police alert system	Demo dashboard; real integration is future scope

19. Team Workstreams
Work is split so the team can run in parallel. Each stream has a clear interface so nobody waits on another.

Workstream	Owns	Depends on
Mobile app	Map, route, trip, SOS, contacts, offline SMS, push handling	API contract
Backend and APIs	FastAPI, trips, SOS, route matching, notification logic	Database schema
Data and ingestion	Source connectors, normalisation, dedupe, warehouse, analytics	Hazard schema
ML and AI	Road-risk model, safety score v2, news extractor, evaluation	Archived hazard data
Cloud and DevOps	Infrastructure, CI/CD, queue, monitoring, secrets	Containers from all streams
Dashboard and QA	Police dashboard, admin analytics, test plans, field tests	API contract
Shared agreements to fix first: hazard schema, API contract (OpenAPI file), database schema, and the demo routes and sample data.

20. Future Scope
Real police and 112 integration
Phone-movement detection of blockages
Camera AI for fallen trees and floods
Offline maps and Bluetooth alert relay
Smartwatch trigger and iOS app
Regional-language and voice support
Community confirmation of hazards (optional, alongside automatic collection)
