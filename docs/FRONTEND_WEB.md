# RakshaPath Web Application (`frontend/web`)

This document provides a technical entry point for the primary **RakshaPath Web Application** located in [`frontend/web/`](../frontend/web).

---

## 1. Primary References

For full details, specifications, and design guidelines, consult:

* **[README.md](../README.md)**: Project overview, monorepo layout, quickstart commands, and demonstration accounts.
* **[PRD.md](../PRD.md)**: Complete functional requirements (PRD v5.4), including client-side demo roles (FR-100), navigation, map legend dock (FR-20.1), and trip monitoring telemetry (FR-45.1, FR-47.1, FR-48.1, FR-50.1).
* **[DESIGN.md](../DESIGN.md)**: Visual design system, brand assets, color token specifications, elevation hierarchy, WCAG 2.1 AA accessibility standards, responsive breakpoints, and single-primary-button rules.
* **[docs/SETUP.md](SETUP.md)**: Environment setup and developer workflow instructions.

---

## 2. Architecture & Tech Stack

* **Framework**: React 19 + Vite Single Page Application (SPA).
* **Routing**: React Router v7 with role-aware route guards (`PublicOnlyRoute` and role restrictions across `/dashboard`, `/family`, and `/police`).
* **Styling**: Plain CSS custom design system defined in [`frontend/web/src/index.css`](../frontend/web/src/index.css) and synchronized with JavaScript tokens in [`frontend/web/src/theme/tokens.js`](../frontend/web/src/theme/tokens.js).
* **Maps & Geodata**: Leaflet & React-Leaflet with OpenStreetMap raster tiles (tactically inverted in dark theme) and OSRM road route geometry.
* **Icons**: Lucide React (`lucide-react`).
* **Charts**: Recharts (`recharts`) for police incident analytics.
* **Testing & Quality**: Vitest (`vitest run`, 10 test suites, 171 automated unit/component tests) and Oxlint (`oxlint`).

---

## 3. Directory Layout

```text
frontend/web/
├── src/
│   ├── assets/brand/      # Logo artwork (logo-full, logo-shield) & favicons
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # AuthShell, PublicOnlyRoute, AuthHeroVisual
│   │   ├── common/        # Logo, Skeleton, ErrorBoundary
│   │   ├── emergency/     # FakeCallModal, SafetyCheckInModal
│   │   ├── layout/        # AppLayout, Header, Sidebar
│   │   ├── maps/          # SafetyMap (Leaflet container, layers, legend)
│   │   ├── navigation/    # RoutePlanner, AutocompleteInput
│   │   ├── notifications/ # NotificationItem
│   │   ├── police/        # PoliceIncidentMap, PoliceAnalyticsCharts
│   │   └── trips/         # ActiveTripTracker
│   ├── constants/         # demoUsers.js (demo-only seeded roles)
│   ├── context/           # AuthContext (PBKDF2 client auth, session state)
│   ├── data/              # hazardData.js (hazard categories & severity tokens)
│   ├── hooks/             # useGeolocation.js, useTripTracker.js
│   ├── pages/             # Route page views (traveller, family, police, auth)
│   ├── services/          # routeService.js, tripService.js, safePlacesService.js
│   ├── test/              # 10 Vitest test suites (171 tests)
│   ├── theme/             # tokens.js (mirrors index.css custom properties)
│   ├── index.css          # Core CSS design tokens & visual styling
│   └── main.jsx           # Application entry point
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite build and test configuration
```
