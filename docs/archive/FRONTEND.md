> [!IMPORTANT]
> **SUPERSEDED (2026-11-20)**: This document described the early dual-client architecture (`/frontend/mobile` Flutter and `/frontend/dashboard`). It has been superseded by the unified React + Vite web platform in `frontend/web`. For the current frontend specification and architecture, see [README.md](../../README.md), [DESIGN.md](../../DESIGN.md), [PRD.md](../../PRD.md), and [FRONTEND_WEB.md](../FRONTEND_WEB.md).

# RakshaPath Frontend Architecture & Directory Structure

This document outlines the frontend structure for both client projects:
1. **`/frontend/mobile`**: Flutter mobile application (Android-only, Riverpod state management).
2. **`/frontend/dashboard`**: React operations dashboard (Vite-based single page application).

Both projects are structured using clean placeholder files with complete model field definitions, abstract repository contracts, and component scaffolds. The mobile application currently includes a complete, locally-persisted authentication flow and home shell.

---

## 1. Directory Tree

```text
assets/
└── images/
    ├── README.md
    ├── welcome_header.webp / .svg
    ├── signin_header.webp / .svg
    ├── signup_header.webp / .svg
    └── dashboard_login_hero.webp / .svg

docs/
└── CREDITS.md

frontend/
├── mobile/
│   ├── assets/
│   │   └── images/
│   │       ├── welcome_header.webp / .svg
│   │       ├── signin_header.webp / .svg
│   │       └── signup_header.webp / .svg
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart
│   │   ├── core/
│   │   │   ├── theme.dart
│   │   │   ├── constants.dart
│   │   │   ├── router.dart
│   │   │   └── demo_tag.dart
│   │   ├── models/
│   │   │   ├── hazard.dart
│   │   │   ├── route_info.dart
│   │   │   ├── contact.dart
│   │   │   ├── sos_alert.dart
│   │   │   └── user.dart
│   │   ├── data/
│   │   │   ├── mock_data.dart
│   │   │   └── repositories/
│   │   │       ├── auth_repository.dart
│   │   │       ├── hazard_repository.dart
│   │   │       ├── trip_repository.dart
│   │   │       ├── contact_repository.dart
│   │   │       └── sos_repository.dart
│   │   ├── state/
│   │   │   ├── auth_state.dart
│   │   │   ├── map_state.dart
│   │   │   ├── trip_state.dart
│   │   │   ├── contacts_state.dart
│   │   │   └── sos_state.dart
│   │   ├── screens/
│   │   │   ├── home_shell.dart
│   │   │   ├── auth/
│   │   │   │   ├── welcome_screen.dart (Full-width header image + dark overlay)
│   │   │   │   ├── sign_in_screen.dart (Full-width header image + dark overlay)
│   │   │   │   └── sign_up_screen.dart (Full-width header image + dark overlay)
│   │   │   ├── map/
│   │   │   │   ├── map_screen.dart
│   │   │   │   ├── route_search_bar.dart
│   │   │   │   ├── hazard_detail_sheet.dart
│   │   │   │   └── hazards_on_route_sheet.dart
│   │   │   ├── trip/
│   │   │   │   ├── trip_screen.dart
│   │   │   │   ├── warning_screen.dart
│   │   │   │   └── alternate_route_view.dart
│   │   │   ├── sos/
│   │   │   │   ├── sos_countdown_screen.dart
│   │   │   │   └── sos_status_screen.dart
│   │   │   ├── contacts/
│   │   │   │   ├── contacts_screen.dart
│   │   │   │   └── add_contact_sheet.dart
│   │   │   └── profile/
│   │   │       └── profile_screen.dart
│   │   └── widgets/
│   │       ├── sos_button.dart
│   │       ├── call_112_button.dart
│   │       ├── hazard_pin.dart
│   │       ├── safety_score_badge.dart
│   │       └── status_chip.dart
│   └── test/
│       ├── auth_test.dart
│       ├── hazard_repository_test.dart
│       └── sos_flow_test.dart
│
└── dashboard/
    ├── public/
    │   ├── favicon.svg
    │   └── images/
    │       ├── dashboard_login_hero.webp
    │       └── dashboard_login_hero.svg
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── data/
    │   │   └── mockData.js
    │   ├── services/
    │   │   ├── authService.js
    │   │   └── sosService.js
    │   ├── pages/
    │   │   ├── LoginPage.jsx (Split layout + overlaid status card + banner collapse)
    │   │   ├── LoginPage.css
    │   │   └── AlertsPage.jsx
    │   ├── components/
    │   │   ├── AlertMap.jsx
    │   │   ├── AlertList.jsx
    │   │   ├── AlertDetail.jsx
    │   │   ├── StatusButtons.jsx
    │   │   ├── Navbar.jsx
    │   │   └── DemoTag.jsx
    │   └── styles/
    │       └── theme.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 2. Feature & Screen Traceability Matrix

| Screen or Feature | Status | Backend Needed Later | PRD ID |
| :--- | :--- | :--- | :--- |
| **Welcome Screen** | **Done** | None (Client-side branding & choice) | Section 1, 15 |
| **Sign In Screen** | **Done** | `POST /auth/login` | Section 12 |
| **Sign Up Screen** | **Done** | `POST /auth/register` | Section 12 |
| **Router Guard & Session Persistence** | **Done** | JWT token refresh / `GET /auth/me` | Section 8, 12 |
| **Home Shell (Bottom Navigation)** | **Done** | None (Client navigation container) | Section 6, 8 |
| **Profile Screen (with Sign Out)** | **Done** | `GET /auth/me`, `POST /auth/logout` | Section 12, 15 |
| **Map Screen** | **Done** | Tile CDN (OSM) + `GET /hazards` | B1, B2 |
| **Route Search Bar** | Placeholder (Not done yet) | Geocoding service (`GET /places/search`) | B1 |
| **Hazard Detail Sheet** | **Done** | `GET /hazards/{id}` | A4, B2, Section 15 |
| **Hazards on Route Sheet** | Placeholder (Not done yet) | `POST /route` spatial buffer query | B3, B6 |
| **Trip Screen** | Placeholder (Not done yet) | `POST /trips/start`, `POST /trips/{id}/location`, `POST /trips/{id}/end` | C1, C2 |
| **Warning Screen (Push Ahead)** | Placeholder (Not done yet) | FCM push listener + `POST /trips/{id}/location` check | C3, C4 |
| **Alternate Route View** | Placeholder (Not done yet) | `POST /route` (avoid-area alternate calculation) | B5 |
| **SOS Countdown Screen (5s)** | **Done** | Client countdown timer + local GPS lock | D9 |
| **SOS Status Screen** | **Done** | `POST /sos` + SMS fallback modem + ACK polling | D4, D5, D13 |
| **Contacts Screen** | Placeholder (Not done yet) | `GET /contacts`, `DELETE /contacts/{id}` | D8 |
| **Add Contact Sheet** | Placeholder (Not done yet) | `POST /contacts` | D8 |
| **SOS Button Widget** | **Done** | None (Client component) | D1, D2 |
| **Call 112 Button Widget** | **Done** | Native device dialer (`tel:112`) | D6 |
| **Offline Banner Widget** | **Done** | Slim high-contrast banner on every tab | D5, D13 |
| **Sync Queue Banner Widget**| **Done** | Riverpod queue state & persistent sync trigger | D5, D7 |
| **Hazard Pin Widget** | Placeholder (Not done yet) | None (Map marker styling) | B2 |
| **Safety Score Badge Widget**| Placeholder (Not done yet) | `POST /route` (Score algorithm) | B6 |
| **Status Chip Widget** | Placeholder (Not done yet) | Device connectivity & GPS telemetry stream | D13 |
| **Dashboard Login Page** | **Done** | `POST /auth/operator/login` | E4 |
| **Dashboard Alerts Page** | Placeholder (Not done yet) | `GET /sos/active`, WebSocket real-time stream | E1, E2, E3 |
| **Dashboard Alert Map** | Placeholder (Not done yet) | Tile CDN (OSM) + incident coordinates | E1 |
| **Dashboard Alert List** | Placeholder (Not done yet) | `GET /sos/active` | E1, E2 |
| **Dashboard Alert Detail** | Placeholder (Not done yet) | `GET /sos/{id}` | E2, E3 |
| **Dashboard Status Buttons** | Placeholder (Not done yet) | `PATCH /sos/{id}` | E3 |
| **Dashboard Navbar & DemoTag**| Placeholder (Not done yet) | Operator session state | E1, E4, A7 |

---

## 3. Offline Behavior Matrix & Architecture

| Component / Subsystem | Online State | Offline State | Transition / Recovery |
| :--- | :--- | :--- | :--- |
| **Connectivity State** (`connectivity_state.dart`) | `online`: Wi-Fi / Cellular active AND HTTP 204 reachability check succeeds. | `offline`: No interface or reachability check fails (e.g. Wi-Fi with no internet / captive portal). | Transitions through `checking` status whenever network interfaces change; manual retry available. |
| **Offline Banner** (`offline_banner.dart`) | Hidden (`SizedBox.shrink`). | Visible on **every tab**: "You are offline. SOS still works by SMS." High-contrast crimson (`#991B1B`). | Disappears immediately when active reachability check verifies internet restoration. |
| **Hazard & Route Cache** (`local_cache_service.dart`) | Fetches live hazards and route, and saves to `SharedPreferences` with timestamp. | Loads cached hazards and route. Excludes expired hazards (`now > expiresAt`). Displays: "Last updated [time], may be outdated". | If cache is empty, displays: "No cached hazards or routes available offline." |
| **SOS Countdown (5s)** (`sos_countdown_screen.dart`) | 5s countdown with circular progress indicator and cancel button. | 5s countdown identical; informs user that SMS fallback mode will be used. | User can abort false alarms within 5 seconds without triggering dispatch. |
| **GPS Fix Acquisition** (`location_service.dart`) | Obtains device GPS coordinates. | Obtains device GPS coordinates via native satellite sensor (works without internet). | If permission is denied, notifies user with reason and safely falls back to last known fix. |
| **Honest Status Panel** (`sos_status_screen.dart`) | Shows: <br>• Internet: Connected<br>• GPS: Acquired<br>• SMS: "Sent to server (demo)" | Shows: <br>• Internet: Disconnected<br>• GPS: Acquired / Last known<br>• SMS: Honest 2-phase delivery state | **Phase 1**: "SMS prepared, waiting for you to send"<br>**Phase 2** (after return): "SMS opened. Delivery not confirmed." |
| **Offline SOS Dispatch** | Server API dispatch (`POST /sos`). | Opens system SMS app (`sms:`) addressed to saved contacts + police `112`. | Text: `SOS. I need help. My location: https://maps.google.com/?q=LAT,LNG [time]`. Always shows `Call 112` dialer. |
| **Local SOS Queue** (`sos_queue_state.dart`) | Synchronized directly. | Alert stored in persistent queue with status `pending`, then `sms_opened`. | **Never deletes pending alerts**. When internet returns: shows "1 SOS alert waiting to sync" and "Sync now" button. |
| **Offline Map Tiles** (`map_screen.dart`) | Streams OpenStreetMap raster tiles directly. | Uses memory-cached tiles. Provides "Offline Demo Tiles" dialog showing Bengaluru bounding box and size (~1.8 MB). | Native FMTC package skipped to avoid fragile native platform SQLite/isolate compilation failure on Android. |

---

## 4. How to Run on an Android Phone

### Step 1: Enable USB Debugging on Your Android Phone
1. Go to **Settings** > **About Phone**.
2. Tap **Build Number** 7 times until you see "You are now a developer!".
3. Go back to **Settings** > **System** (or Additional Settings) > **Developer Options**.
4. Enable **USB Debugging**.

### Step 2: Connect Phone to PC via USB
1. Plug your phone into your computer with a USB data cable.
2. On your phone, set the USB mode to **File Transfer / MTP**.
3. When prompted "Allow USB debugging?", check "Always allow from this computer" and tap **Allow**.

### Step 3: Run the Application
```bash
cd frontend/mobile

# Check that your phone is recognized
flutter devices

# Run on the connected Android device
flutter run -d android
```

---

## 5. How to Test Offline Mode on Your Phone

### Test Case A: Airplane Mode (Complete Disconnect)
1. Launch RakshaPath on your Android device (`flutter run -d android`).
2. Pull down Android quick settings shade and toggle **Airplane Mode** ON.
3. Observe the mobile screen:
   - A slim, high-contrast banner appears at the top across all bottom navigation tabs (Map, Trip, Contacts, Profile):
     `"You are offline. SOS still works by SMS."`
   - The map tab displays cached hazards and the active route with the notice:
     `"Last updated [time], may be outdated"`.
4. Tap the large **EMERGENCY SOS** button:
   - 5-second countdown ring initiates with a large cancel button.
   - Wait 5 seconds without tapping cancel.
5. Watch the flow:
   - App captures offline GPS fix from hardware satellite receiver.
   - Automatically opens your default Android SMS app with pre-filled text:
     `SOS. I need help. My location: https://maps.google.com/?q=LAT,LNG [time]` addressed to your emergency contacts and police `112`.
   - The alert is recorded in the local persistent queue as `pending`.
6. Return to RakshaPath:
   - The SOS Status Monitor shows honest telemetry:
     - **Internet**: Offline (No internet connection)
     - **GPS**: GPS lock acquired
     - **SMS**: `SMS opened. Delivery not confirmed.` (Honest status; never claims sent without cellular ACK).
     - Prominent **Call 112** button is always available (opens system dialer).

### Test Case B: Wi-Fi On but No Internet (Captive Portal / Broken ISP)
1. Connect phone to a Wi-Fi router whose WAN cable is unplugged or requires a captive portal login without logging in.
2. The phone shows connected Wi-Fi icon, but data requests fail.
3. Notice that `connectivity_plus` combined with RakshaPath's active reachability check (HTTP 204 ping) correctly identifies the link as **offline**.
4. The offline banner displays immediately, ensuring the user is never misled into false security.

### Test Case C: Restoration & Sync
1. Turn Airplane Mode OFF (or reconnect to working Wi-Fi/mobile data).
2. The offline banner disappears.
3. An emerald synchronization banner immediately appears:
   `"1 SOS alert waiting to sync"` with a **Sync now** button.
4. Tap **Sync now**:
   - The queued SOS alerts are marked synced in the mock repository and updated locally.
   - A confirmation snackbar notifies: `"1 SOS alert(s) marked synced with server."`
   - The alert is never silently deleted.

---

## 6. Auth Imagery & Tactical Dashboard Login Design

### Mobile Auth Imagery (`/frontend/mobile`)
1. **Full-Width Top Header (35% Screen Height)**:
   - On `WelcomeScreen`, `SignInScreen`, and `SignUpScreen`, the top ~35% of the viewport displays a full-width header image (`welcome_header.webp`, `signin_header.webp`, `signup_header.webp`).
   - Purely vertical stacking on phones (no side-by-side layout on mobile screens).
2. **Dark Gradient Overlay for Contrast & Readability**:
   - Every header features a high-contrast dark overlay (`LinearGradient` from `rgba(0, 0, 0, 0.35)` to `rgba(15, 23, 42, 0.70)` to solid `#0F172A`).
   - Ensures white titles (`#F8FAFC`), slate subtitles (`#94A3B8`), and amber Demo tags remain perfectly legible under all ambient lighting conditions.
3. **Keyboard-Safe Scrollability**:
   - The form is housed in a `SingleChildScrollView` with `keyboardDismissBehavior: onDrag`.
   - When the virtual keyboard opens, the input form scrolls smoothly without any `RenderFlex` overflow errors.
4. **Accessibility & Semantics**:
   - All header images are wrapped with `Semantics(image: true, label: ...)` providing complete screen reader descriptions.
   - Vector sources are documented in `docs/CREDITS.md`.

### Police Dashboard Login (`/frontend/dashboard`)
1. **Desktop Split Layout**:
   - Form panel on the left (`460px` fixed width) containing high-contrast badge & PIN authentication inputs, demo credentials quick-fill, and legal warning notice.
   - Large tactical operations hero image on the right (`dashboard_login_hero.webp` / `.svg`) showing city street grid, Silk Board incident perimeter, patrol vectors, radar scope, and HQ command node.
2. **Overlaid Live Status Card**:
   - Positioned over the tactical map image: `"Active alerts: 1"` with an amber `Demo data` badge.
   - High-contrast charcoal card (`rgba(17, 24, 39, 0.94)`) with 1px slate border (`#374151`) and status dot indicator.
3. **Responsive Narrow-Screen Collapse**:
   - On narrow viewports (`max-width: 768px`), the image collapses into a top header banner (`220px` height) with the status card overlaid, and the form panel expands to full width below it.
4. **Strict Design Tokens**:
   - High contrast, dark mode palette (`#0B0F19`, `#111827`, `#1F2937`).
   - No purple gradients (pure slates, tactical red `#EF4444`, amber `#F59E0B`, emerald `#10B981`).
   - No pill-shaped buttons (`borderRadius: 4px`–`6px`).
   - Zero decorative animations.

---

## 7. Code Quality & Testing Commands

```bash
# 1. Mobile Flutter Project
cd frontend/mobile

# Run static analysis (0 warnings, 0 errors)
flutter analyze

# Run all 42 test cases (auth imagery, UI scrolling, connectivity transitions, cache expiry, SOS queue, SMS format, router guard)
flutter test

# 2. Police Dashboard React Project
cd ../dashboard

# Run production build (Vite)
npm run build
```

---

## 8. What Is Untested

1. **Carrier SMS Delivery Receipts (SMSC ACK)**: The app formats the SMS and hands it off to the native Android telephony provider via `sms:`. Android does not provide an application-level return callback confirming cellular tower transmission without registering as the default SMS handler (`SEND_SMS` permission). The app honestly reflects this with: `"SMS opened. Delivery not confirmed."`.
2. **Physical Satellite Lock Delay in Indoor Bunkers / Basements**: If GPS satellite signals are fully shielded indoors, `LocationService` falls back to the last known position.
3. **Emergency Call 112 Connection**: Tapping "Call 112" opens the Android system dialer with `tel:112` (as required: no auto-dial to prevent accidental emergency calls).
4. **Standalone FMTC Native SQLite Tile Store**: Evaluated and skipped to prevent native Android NDK/FFI breakage; demo pre-caching dialog and bounding box size calculation (~1.8 MB) are implemented.
5. **Real Live Backend Network Integration**: Live HTTP/WebSocket connection with the FastAPI backend server (mock repository is currently used).

