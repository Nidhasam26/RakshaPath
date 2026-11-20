> [!IMPORTANT]
> **SUPERSEDED (2026-11-20)**: This document described legacy live-server demonstration routes and mobile Flutter scripts. It has been superseded by the client-side demonstration system in `frontend/web` (FR-100 one-click demo roles, OSRM routing, and simulated offline SOS). See [README.md](../../README.md) and [PRD.md](../../PRD.md).

# RakshaPath: Demo Script & Backup Strategy

## 1. Demo Routes & Scenarios

### Route 1: Urban Commute with Active Water Logging
* **Origin**: Koramangala, Bengaluru (`12.9279, 77.6271`)
* **Destination**: Indiranagar, Bengaluru (`12.9716, 77.5946`)
* **Active Hazard**: Major water logging underpass (`12.9180, 77.6389`).
* **Expected Outcome**: App displays road obstruction pin, computes Safety Score (8.0/10), and warns driver before reaching underpass.

### Route 2: Ghat / Highway Section with Road Closure
* **Origin**: Bengaluru City Center (`12.9716, 77.5946`)
* **Destination**: Nandi Hills (`13.3702, 77.6835`)
* **Active Hazard**: Landslide closure on main ascent road.
* **Expected Outcome**: Proactive FCM push alert triggers 5 km ahead; clicking notification presents an alternate route via the bypass.

### Route 3: Zero-Connectivity Emergency SOS
* **Scenario**: Traveller in a low-signal forest section encounters distress.
* **Action**: Press SOS button (5-second cancel timer expires).
* **Expected Outcome**: App detects no internet, immediately opens phone SMS gateway to trusted family contact with GPS link (`https://maps.google.com/?q=13.3702,77.6835`), displays local siren toggle, and keeps "Call 112" visible.

---

## 2. Demo Step-by-Step Script

1. **Show Architecture & Ingestion**:
   * Open Police Dashboard on projector.
   * Run hazard ingestion job; observe new hazard pins populated across the city map.
2. **Simulate Trip on Mobile App**:
   * Select Origin & Destination. Show safety score breakdown (e.g. deductions for night travel and active rain hazard).
   * Tap **Start Trip**.
3. **Simulate Proactive Push Warning**:
   * Advance driver location toward the hazard.
   * Receive high-priority push notification: *"Flooding ahead in 5 km. Tap for a safer road."*
   * Tap notification; verify alternate route displayed.
4. **Trigger Emergency SOS**:
   * Press SOS button on the mobile app.
   * Verify police dashboard pops up an immediate red incident card with sound and map pin in < 2 seconds.
   * Operator clicks **Acknowledge**, adds patrol note, and resolves incident.

---

## 3. Fallback Plan (If Live APIs Fail)

* **TomTom / Weather API Quota Exhaustion**:
  * Toggle `DEMO_MODE=true` in `.env`. The backend automatically seeds and serves fixed fixtures from [`docs/sample_hazards.json`](../sample_hazards.json).
* **FCM Push Notification Delay**:
  * The mobile app contains an in-app polling fallback that checks for hazards ahead during active trips if push messages are delayed.
* **No Cellular Reception during Demo**:
  * Use the offline SMS flow to prove delivery to a real phone handset via SMS.
