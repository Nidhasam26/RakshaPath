# RakshaPath: Testing Strategy & Verification Plan

## 1. Test Philosophy & Rules

1. **Deterministic Tests**: Never make live external network calls in automated tests. Use recorded sample responses in `tests/fixtures/`.
2. **PostGIS Coverage**: Verify spatial queries with known point coordinates and distance tolerances.
3. **Fail-Closed Safety**: Verify that missing data or network issues fail gracefully without misleading the user (e.g. SOS never reports "sent" if unconfirmed).

---

## 2. Test Execution

### Running Backend Tests Inside Docker
```bash
docker compose exec backend pytest -v tests/
```

### Running Backend Tests Locally
```bash
# Windows PowerShell:
$env:PYTHONPATH="backend"
pytest -v backend/tests/

# Linux / macOS:
PYTHONPATH=backend pytest -v backend/tests/
```

---

## 3. Test Suites & Coverage Matrix

| Test Suite | Scope | Target Component |
| :--- | :--- | :--- |
| `test_health.py` | Unit / Mock | `GET /health` and `GET /` endpoints with DB/Redis mocks |
| `test_ingestion.py` *(Planned)* | Integration | TomTom & Open-Meteo normalisation against recorded JSON fixtures |
| `test_spatial_matching.py` *(Planned)* | Integration | PostGIS `ST_DWithin` route-hazard spatial matching |
| `test_sos_flow.py` *(Planned)* | Integration | SOS creation, DB persistence, Twilio dispatch, cancel window |

---

## 4. Field Test Checklist (3 Routes)

* [ ] **Route 1 (Urban Transit)**: Dense traffic route with simulated minor road obstruction. Verify route render and safety score deduction.
* [ ] **Route 2 (Severe Hazard)**: Route crossing flooded underpass. Verify push alert is sent 5 km before hazard and avoid-area alternate route is proposed.
* [ ] **Route 3 (Low / Zero Signal)**: Trigger SOS in airplane mode. Confirm immediate direct device SMS trigger and verify status indicator honestly shows "Offline SMS dispatched".

---

## 5. Failure Drills

1. **Ingestion Failure Drill**: Terminate external API internet connection. Ensure backend logs the failure to `hazard_sources_log` and serves cached/sample hazards without throwing 500s.
2. **Network Dropout Drill during Active Trip**: Stop client GPS transmission for 3 minutes. Verify backend detects missed updates and flags the trip for operator review.
3. **SMS Zero Balance Drill**: Simulate SMS gateway failure. Verify app falls back to displaying emergency "Call 112" dialer immediately.
