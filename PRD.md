RakshaPath

Intelligent Safety Navigation & Emergency Assistance Platform

Product Requirements Document (PRD)

Document Detail| Value
Version| 5.3
Previous Version| 5.2
Project Type| Full-Stack Mini Project
Development Approach| Incremental Product Development
Primary Frontend| React + Vite
Programming Language| JavaScript
Primary Interface| Responsive Web Application
Future Mobile Packaging| Capacitor for Android
Backend| Existing FastAPI backend — integration deferred
Status| Frontend Development

Tagline: Plan • Travel • Stay Safe

---

1. Project Overview

RakshaPath is an intelligent safety navigation and emergency assistance platform designed to help people identify potential dangers, choose safer routes, monitor ongoing journeys and access emergency assistance.

Unlike conventional navigation applications that primarily optimize distance and travel time, RakshaPath focuses on journey safety by presenting relevant hazards, safety information, emergency features and route alternatives.

The platform will provide three major interfaces:

1. Traveller Application: For users who need safety-aware navigation and emergency assistance.
2. Family Dashboard: For trusted contacts who want to monitor shared trips.
3. Police Dashboard: A demonstration interface for monitoring simulated emergency reports and incident information.

Version 5.0 changes the primary frontend development approach to React + Vite. The existing Flutter implementation will be preserved but will no longer be the active development target.

1.1 Vision

To create an accessible, intelligent and reliable safety platform that helps people make informed travel decisions and respond more effectively to emergencies.

1.2 Mission

- Identify and communicate potential hazards along travel routes.
- Help users compare safer route alternatives.
- Provide accessible emergency assistance features.
- Enable private trip sharing with trusted contacts.
- Present relevant safety information through a simple interface.

1.3 Brand Identity & Visual Language

RakshaPath follows a focused, dark-themed personal travel safety design system:
- Tagline: "Plan • Travel • Stay Safe" (applied as the single official brand tagline across all interfaces).
- Logo Usage: The application uses official transparent brand assets via the reusable `<Logo />` component. The full lockup (`logo-full.png`) is sized at 210px for authentication surfaces; the shield emblem (`logo-shield.png`) is sized at 32–34px for navigation sidebars, mobile headers, and favicons.
- Theme & Palette: Built on a deep navy base (`--bg: #070d1f`, `--surface: #0e172e`) with a vibrant teal-mint accent (`--accent: #2de2b0`) for primary interactive controls, active navigation, and focus rings. Legacy lime greens are completely eliminated.
- Danger Reservation: Coral red (`--danger: #ff5a4f`) is reserved strictly for SOS triggers, destructive errors, and Critical hazard alerts.
- Accessibility: Primary interactive controls achieve an 11.61:1 contrast ratio, exceeding WCAG 2.1 AA requirements.

For the exhaustive design tokens, typography scale, component sizes, and contrast specifications, see [DESIGN.md](DESIGN.md).

---

2. Problem Statement

Traditional navigation applications primarily focus on shortest routes, estimated arrival times and traffic conditions.

However, travellers may encounter:

- Traffic congestion and road incidents.
- Severe weather conditions.
- Earthquakes and other environmental hazards.
- Official emergency alerts.
- Unsafe or unfamiliar surroundings.
- Difficulty sharing journey progress with trusted contacts.
- Delays in communicating emergencies.

There is a need for a platform that brings travel safety information, navigation assistance, trip monitoring and emergency features together.

3. Proposed Solution

RakshaPath will provide a unified application that combines:

- Interactive maps and location information.
- Hazard monitoring and alerts.
- Safety-aware route visualization.
- Route comparison and safety scoring.
- Trip monitoring and family sharing.
- Emergency SOS workflows.
- Emergency contact management.
- Nearby safe-place information.
- Dedicated family and police demonstration dashboards.

The application will clearly distinguish verified information, estimates and simulated demonstration data.

4. Target Users

4.1 Travellers

People who need route information, hazard awareness and emergency assistance.

4.2 Family Members and Trusted Contacts

People who receive trip-sharing links and monitor a traveller's shared journey.

4.3 Police and Emergency Monitoring Personnel

Users of the demonstration dashboard who view simulated SOS reports and incident information.

4.4 Administrators

Users responsible for managing application configuration and demonstration data in future versions.

5. Project Scope

5.1 In Scope

- Responsive React web application.
- Authentication and profile interfaces.
- Traveller dashboard.
- Interactive map interface.
- Hazard visualization.
- Route visualization and comparison.
- Safety score display.
- Trip monitoring.
- Family trip-sharing interface.
- Emergency SOS user interface.
- Emergency contacts.
- Police demonstration dashboard.
- Notifications and settings.
- Light and dark themes.
- Local frontend data persistence.
- Responsive layouts for desktop, tablet and mobile.
- Frontend testing and accessibility improvements.

5.2 Out of Scope for Current Frontend Phase

- Backend development or modification.
- Database schema or migration changes.
- API contract or server configuration changes.
- Actual emergency-service dispatch integration.
- Guaranteed offline SMS delivery.
- Real police dispatch integration.
- AI-powered camera surveillance.
- Disaster prediction.
- Offline map downloads.
- iOS native application development.

These exclusions do not necessarily remove the corresponding features from the long-term product vision.

6. Technology Stack

6.1 Frontend

Technology| Purpose
React| Component-based user interface
Vite| Development server and build tool
JavaScript| Application programming
Tailwind CSS| Styling and responsive design
React Router| Page navigation and routing
React Context API| Shared application state
Lucide React| Icons
Leaflet| Interactive maps
OpenStreetMap| Map tiles and geographic display
Recharts| Analytics and charts
LocalStorage| Demo data persistence

6.2 Future Mobile Packaging

Capacitor may be introduced after the responsive React application is completed and tested.

It will provide a path to package the web application as an Android application. Native features such as background location, SMS and device permissions will require separate implementation and testing.

6.3 Existing Backend Architecture

The existing backend architecture remains part of the long-term system design:

Technology| Purpose
Python| Backend programming
FastAPI| Backend framework
PostgreSQL| Database
PostGIS| Geographic data
Redis| Caching and temporary data

Important: No backend code, configuration, database, API or server logic will be modified during the current frontend development phase.

7. Application Architecture

The application will use a modular component-based architecture.

7.1 Proposed Folder Structure

RakshaPath/
│
├── backend/                   # Existing backend - unchanged
│
├── frontend/
│   ├── mobile/                # Existing Flutter project - preserved
│   │
│   └── web/                   # New React + Vite application
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   │   ├── common/
│       │   │   ├── layout/
│       │   │   ├── maps/
│       │   │   ├── navigation/
│       │   │   └── dashboard/
│       │   │
│       │   ├── pages/
│       │   │   ├── auth/
│       │   │   ├── traveller/
│       │   │   ├── family/
│       │   │   ├── police/
│       │   │   └── settings/
│       │   │
│       │   ├── context/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── data/
│       │   ├── utils/
│       │   ├── styles/
│       │   ├── App.jsx
│       │   └── main.jsx
│       │
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
│
└── README.md

This is the proposed structure. Existing folders will be inspected before creating or replacing anything.

7.2 Architecture Principles

- Reusable React components.
- Separation of pages, components and services.
- Centralized shared state.
- Reusable styling and design tokens.
- Clear separation between mock data and future API services.
- Maintainable and readable code.
- Responsive-first design.
- No unnecessary duplication.

8. Functional Requirements

Module A — User Interface and Authentication

Objective: Provide a consistent, accessible application experience.

Functional Requirements

- FR-01: Display a welcome or landing screen.
- FR-02: Provide user registration interface.
- FR-03: Provide sign-in interface.
- FR-04: Provide forgot-password interface.
- FR-05: Provide profile information interface.
- FR-06: Provide application navigation.
- FR-07: Provide light and dark themes.
- FR-08: Provide account settings.
- FR-09: Display appropriate validation messages.
- FR-10: Provide a logout interface.
- FR-100: Quick Demo-Role Authentication & Role-Aware Routing (Demo Only).
  Provide one-click demonstration authentication buttons on the sign-in interface for the three application roles: Traveller, Family member, and Police demo operator.
  Acceptance Criteria:
  - Demo Roles & Seeded Accounts: Defined centrally in `src/constants/demoUsers.js`. Users should use the one-click demo buttons on `/login` to sign in instantly with seeded roles:
    * Traveller: `traveller.demo@rakshapath.local` (Name: "Priya Sharma (Demo)", default redirect to `/dashboard`).
    * Family: `family.demo@rakshapath.local` (Name: "Rohan Sharma (Demo)", default redirect to `/family`).
    * Police: `police.demo@rakshapath.local` (Name: "Inspector Sharma (Demo)", default redirect to `/police`).
  - Safe Local Provisioning: Demo buttons authenticate via the client-side demo authentication mechanism without bypassing protected routes or PBKDF2 hashing. If the pre-configured seeded demo account does not exist in local storage, it is provisioned through the standard registration pathway using Web Cryptography PBKDF2 (600,000 iterations, 16-byte random salt).
  - Deduplicated Login: If the account already exists, the button authenticates using the standard login pathway without creating duplicate accounts.
  - Role-Aware Redirection: Upon successful authentication (manual or one-click demo), users are redirected strictly to their designated workspace:
    * `user.role === 'Traveller'` -> `/dashboard`
    * `user.role === 'Family'` -> `/family`
    * `user.role === 'Police'` -> `/police`
  - Public Route Protection (`PublicOnlyRoute`): Authenticated users attempting to navigate to `/login`, `/register`, or `/forgot-password` are automatically redirected to their role-appropriate destination.
  - Interactive States: Interactive controls display clear loading and disabled states to prevent concurrent submissions.
  - Demo-Only Wording: The interface clearly identifies that demo accounts are client-side demonstration conveniences operating within browser localStorage and do not represent a real backend service.

Authentication will use frontend demonstration state until backend integration is authorized. Authentication in the current release is a client-side demo authentication, not production-grade security, featuring role-based separation (Traveller, Family, Police) in the demo. Passwords are processed locally via the Web Cryptography API using PBKDF2 with HMAC-SHA-256 at 600,000 iterations and a cryptographically random 16-byte salt per account. A locally simulated login must not be represented as secure production authentication.

Module B — Smart Home Dashboard

Objective: Present essential safety information in one place.

Functional Requirements

- FR-11: Display the traveller home dashboard.
- FR-12: Display the current or selected location.
- FR-13: Display an interactive map.
- FR-14: Display nearby hazard indicators.
- FR-15: Provide destination search interface.
- FR-16: Display emergency SOS action.
- FR-17: Provide a Call 112 action.
- FR-18: Display network connectivity status.
- FR-19: Display trip and safety summaries.

Module C — Automatic Hazard Monitoring

Objective: Present relevant hazards that may affect a journey.

Hazard Categories

1. Traffic incidents and congestion.
2. Severe weather conditions.
3. Earthquakes.
4. Official emergency alerts.
5. Other supported environmental hazards.

Functional Requirements

- FR-20: Display hazards on the map.
- FR-20.1: Interactive Map Legend Dock (`SafetyMap.jsx`).
  Provide an on-map legend dock anchored at the bottom-left of the interactive map (`position: absolute; bottom: 16px; left: 16px; z-index: 1000`) with a semi-transparent surface (`var(--panel)`, `var(--surface)`) and backdrop blur (`backdrop-filter: blur(8px)`). The legend is collapsed by default (`legendOpen = false`), presenting a compact summary header with a `Layers` icon, an `Expand`/`Collapse` indicator, and a semantic toggle button (`<button type="button" aria-expanded={legendOpen} aria-controls="map-legend-content">`). When expanded, the container (`aria-hidden={!legendOpen}`, `hidden={!legendOpen}`) reveals visual symbology keys for:
  * Live GPS position (`var(--accent)` dot, annotated with `(Live)` when active continuous tracking is engaged)
  * Route starting point (`var(--accent)` dot)
  * Destination pin (white center with `tokens.accent` ring)
  * Hazard severity markers: Critical (`SEVERITY_COLORS.Critical` / `var(--danger)`), High (`SEVERITY_COLORS.High` / `var(--orange)`), Medium (`SEVERITY_COLORS.Medium` / `var(--amber)`), and Low (`SEVERITY_COLORS.Low` / `var(--info)`)
  * Selected active route (`var(--accent)` solid polyline bar when active routes are displayed).
- FR-21: Categorize hazards by type.
- FR-22: Display hazard severity using standardized color and icon tokens: Critical (Coral Red `--danger`, with pulse animation), High (Orange `--orange`), Medium (Amber `--amber`), and Low (Blue `--info`), paired with textual labels and symbols (non-color-alone cues).
- FR-23: Display hazard details.
- FR-24: Display hazard source where available.
- FR-25: Display reported or last-updated time.
- FR-26: Display hazard radius or affected area when available.
- FR-27: Display hazard expiry information when available.
- FR-28: Allow users to view hazards affecting a selected route.

External Data Sources Planned

Source| Intended Use
TomTom| Traffic information
Open-Meteo| Weather information
USGS| Earthquake information
Official alert sources| Public emergency alerts

During frontend development, these integrations will use mock data unless an already available public source is used without changing the backend.

Weather risk must not be presented as confirmed road damage.

Module D — Smart Navigation

Objective: Help travellers understand routes and possible hazards.

Functional Requirements

- FR-29: Allow destination search.
- FR-30: Display a route between origin and destination.
- FR-31: Display estimated distance.
- FR-32: Display estimated travel time.
- FR-33: Display hazard markers along a route.
- FR-34: Display detailed hazard information.
- FR-35: Allow users to view alternative routes.
- FR-36: Display route comparison information.
- FR-37: Provide a route overview interface.

Route calculations and routing services may initially be represented using demo data. Any displayed estimate must be labelled appropriately.

Module E — Safety Score and Route Alternatives

Objective: Provide an understandable indication of potential route risk.

Functional Requirements

- FR-38: Display a route safety score from 0 to 10.
- FR-39: Display relevant factors influencing the score.
- FR-40: Compare available route alternatives.
- FR-41: Highlight hazards that may affect a route.
- FR-42: Display the recommended route based on available information.

Safety Score Principles

- Scores must be clearly identified as estimates.
- Relevant hazards should influence the displayed score.
- The interface should explain why a route received its score.
- The application must not guarantee that a route is safe.
- Missing information must not be treated as proof of safety.

Module F — Trip Monitoring

Objective: Allow users to monitor an active journey.

Functional Requirements

- FR-43: Start a trip.
- FR-44: Display the selected route.
- FR-45: Display journey progress.
- FR-45.1: Continuous GPS Telemetry & Orthogonal Polyline Projection (`useGeolocation.js`, `tripService.js`).
  Capture real device GPS telemetry via continuous position watcher (`watchPosition`) with heading, speed, and accuracy metadata, plus structured permission state tracking (`granted`, `denied`, `prompt`, `unavailable`, `timeout`). Project incoming coordinates orthogonally onto the active polyline geometry (`findNearestPointOnPolyline`) to update distance travelled, progress percentage, and remaining distance/time.
- FR-46: Display remaining distance and estimated time.
- FR-47: Display relevant route warnings.
- FR-47.1: Off-Route Detection & On-Demand Route Recalculation (`useTripTracker.js`, `tripService.js`).
  Continuously measure orthogonal distance from the user's GPS position to the nearest route segment. If the user diverges by > 60 meters across 2 consecutive GPS fixes, set `isOffRoute: true`, alert the traveller via `ActiveTripTracker`, and provide a one-click "Recalculate Route" action that computes an updated OSRM road route from current coordinates to the original destination.
- FR-48: Provide trip pause and end controls.
- FR-48.1: Automatic Journey Arrival Detection (`tripService.js`).
  When the user approaches within 50 meters of the destination coordinates with reliable GPS accuracy (<= 45m) for 2 consecutive fixes, automatically complete the journey (`endTrip`), synchronizing status across local storage and shared family registries.
- FR-49: Display trip history.
- FR-50: Display warnings approximately 5 km before a hazard when reliable distance and location information is available.
- FR-50.1: Proactive Route Hazard Advisories (`tripService.js`).
  When remaining journey distance is between 1.0 km and 5.5 km, evaluate active Critical, High, or Medium severity hazards along the remaining corridor. Automatically issue an in-app route advisory notification and attach the hazard alert to the active trip state.

In the demo, trip movement and progress may be simulated when real GPS is unavailable or during automated testing. The interface must not imply continuous real-world tracking when it is not active.

Module G — Family Tracking and Trip Sharing

Objective: Enable private journey sharing with trusted contacts.

Functional Requirements

- FR-51: Allow users to manage trusted contacts.
  * Empty State Action: When zero contacts are saved in the user's safety circle, the interface must render a clear, actionable empty state with an "Add contact" action button linking directly to `/contacts`.
- FR-52: Provide a trip-sharing interface.
- FR-53: Generate or display a demonstration sharing link.
- FR-54: Display shared traveller location when available.
- FR-55: Display route progress.
- FR-56: Display last-updated time.
- FR-57: Display trip status.
- FR-58: Provide a missed-update notification demonstration.
- FR-59: Allow sharing to be stopped or revoked.

Privacy Requirements

- Sharing must be opt-in.
- Sharing should be limited to intended recipients.
- Links should be private and designed to expire.
- Last-updated time must be visible.
- A missed update must not automatically be treated as an emergency.

Module H — SOS and Emergency Assistance

Objective: Provide an accessible emergency workflow.

Functional Requirements

- FR-60: Provide a prominent SOS button.
- FR-61: Display an SOS countdown.
- FR-62: Allow cancellation before confirmation.
- FR-63: Display emergency contact information.
- FR-64: Display location information when available.
- FR-65: Display the emergency alert status.
- FR-66: Provide a Call 112 action.
- FR-67: Display a demonstration siren control.
- FR-68: Provide an SOS status and history interface.
- FR-69: Display retry options when an operation fails.
- FR-70: Display offline status and fallback information.
- FR-71: Provide a check-in interface.
- FR-72: Provide interfaces for shake or volume-triggered SOS.
- FR-73: Provide a fake-call interface.
- FR-74: Provide a following-me or suspicious-situation mode.

SOS Workflow

1. User activates SOS.
2. Application displays a countdown.
3. User may cancel the alert.
4. If confirmed, the application prepares an emergency alert.
5. The interface displays available location and contact details.
6. The application displays the operation status.
7. The user receives clear success, failure or pending feedback.

Important Emergency Limitations

During frontend-only development:

- SOS submission will be simulated.
- No real emergency service will receive the demonstration alert.
- No actual SMS delivery will be claimed.
- Call 112 will use the device's supported telephone action where available.
- Offline SMS, background execution and hardware triggers require native Android capabilities and separate testing.

The UI must distinguish between prepared, queued, sent and delivery confirmed. It must never claim delivery without confirmation.

Module I — Police Dashboard

Objective: Provide a demonstration interface for viewing emergency reports.

Functional Requirements

- FR-75: Provide a police dashboard interface.
- FR-76: Display simulated SOS reports.
- FR-77: Display incident locations.
- FR-78: Display incident severity using standardized color and icon tokens: Critical (Coral Red `--danger`, `#ff5a4f`), High (Orange `#ff9838`), Medium (Amber `#ffc66d`), and Low (Blue `--info`, `#1fa7ff`), paired with textual labels and symbols (non-color-alone cues).
- FR-79: Display incident status.
- FR-80: Display incident details.
- FR-81: Provide incident status controls for demonstration.
- FR-82: Display incident history.
- FR-83: Display dashboard analytics.
- FR-84: Provide filters for incident categories and status.

Limitations

The police dashboard is a demonstration interface only. It is not connected to actual police systems and does not dispatch emergency personnel.

Module J — Notifications and Alerts

Objective: Keep users informed about relevant journey and emergency events.

Functional Requirements

- FR-85: Display in-app notifications.
- FR-86: Display hazard alerts.
- FR-87: Display trip updates.
- FR-88: Display SOS status notifications.
- FR-89: Display family-sharing updates.
- FR-90: Provide notification history.
- FR-91: Allow users to manage notification preferences.
- FR-92: Provide read and unread states.

Module K — Nearby Safe Places

Objective: Help users identify potentially useful nearby locations.

Functional Requirements

- FR-93: Display nearby hospitals.
- FR-94: Display police stations.
- FR-95: Display pharmacies.
- FR-96: Display other relevant safe-place categories.
- FR-97: Display place details.
- FR-98: Display approximate distance when available.
- FR-99: Provide map directions or an external navigation action where supported.

Nearby place information must not imply that a location is open, secure or available unless that information has been verified.

---

9. Non-Functional Requirements

9.1 Performance

- Application pages should load efficiently.
- Avoid unnecessary component re-rendering.
- Optimize map and chart rendering.
- Keep the interface responsive during normal interactions.

9.2 Usability

- Navigation should be intuitive.
- Important actions should be easy to locate.
- Emergency controls should be visually distinguishable.
- Error and success messages should be understandable.

9.3 Responsiveness

The application must support:

- Desktop browsers.
- Tablets.
- Mobile browsers.
- Different screen sizes and orientations.

9.3 Responsive Design & Viewport Rules

The application supports responsive viewing across desktop, tablet, and mobile browsers:
- Unified Mobile Breakpoint (≤ 820px): The desktop sidebar collapses into an off-canvas drawer while the topbar hamburger and mobile brand emblem (`.header-brand-badge`) appear simultaneously, ensuring the sidebar logo and header logo are never visible together. Simultaneously, the authentication hero panel (`.auth-visual`) auto-hides to present a focused, centered, touch-friendly login card.
- Compact Desktop Breakpoint (≤ 1100px): In the authentication dual-pane layout, the telemetry/map card auto-hides at and below 1100px to guarantee ample headline breathing room and prevent text-illustration collision on mid-sized displays.
- Wide Desktop Breakpoint (> 1100px): Full dual-pane showcase displays both the copy hierarchy and the illustrative route corridor card.
- Touch Target Sizes: Primary touch targets (buttons, inputs, navigation items) maintain a minimum 44×44px hit area (with the floating SOS action at 48px).

9.4 Accessibility

- Appropriate color contrast (primary buttons achieve 11.61:1 contrast, exceeding WCAG 2.1 AA).
- Readable text and accessible focus indicators (2px–3px rings in `var(--accent)`).
- Keyboard navigation throughout all modal dialogs, routes, and dropdown menus.
- Clear focus states and accessible labels for controls (`aria-label`, `aria-expanded`).
- Icons accompanied by meaningful labels where necessary.
- Important statuses not communicated by color alone (always paired with icon symbols and text labels).
- Motion reduction honoring `@media (prefers-reduced-motion: reduce)`.

9.5 Reliability

- Handle missing or unavailable data gracefully.
- Provide loading, empty and error states.
- Avoid displaying stale information as live information.
- Preserve suitable demonstration state across refreshes.

9.6 Security and Privacy

- Do not store real passwords in LocalStorage.
- Do not expose private information in public interfaces.
- Avoid collecting unnecessary personal information.
- Clearly communicate location-sharing status.
- Provide controls to stop sharing.
- Use secure authentication and storage when backend integration is introduced.

10. UI/UX Design Requirements

The design should communicate safety, clarity, trust and usability.

10.1 Design Principles

- Clean and modern interface.
- Consistent spacing and typography.
- Clear visual hierarchy.
- Minimal unnecessary decoration.
- Responsive navigation.
- Accessible color combinations.
- Consistent buttons, cards, forms and dialogs.
- Distinct visual treatment for emergency actions.

10.2 Main Application Screens

Traveller Application

1. Welcome screen.
2. Sign-in screen.
3. Sign-up screen.
4. Forgot-password screen.
5. Home dashboard.
6. Map and hazard screen.
7. Destination search.
8. Route details.
9. Route comparison.
10. Trip monitoring.
11. SOS countdown.
12. SOS status.
13. Emergency contacts.
14. Nearby safe places.
15. Notifications.
16. Profile.
17. Settings.

Family Dashboard

1. Family dashboard.
2. Shared trips.
3. Traveller location.
4. Route progress.
5. Notifications.
6. Trip history.
7. Sharing information.

Police Dashboard

1. Police overview.
2. SOS monitoring.
3. Incident details.
4. Incident map.
5. Incident management.
6. Incident history.
7. Analytics.

11. Data and State Management

11.1 Frontend Data

The application will initially use mock data for:

- Users and profiles.
- Contacts.
- Hazards.
- Routes.
- Trips.
- SOS reports.
- Notifications.
- Nearby safe places.
- Police dashboard incidents.

11.2 State Management

React Context API will manage shared state where appropriate.

Local component state will be used for temporary UI interactions.

11.3 LocalStorage

LocalStorage may be used for non-sensitive demonstration information, such as:

- Theme preference.
- Demo profile.
- Selected dashboard settings.
- Demo trip state.
- Notification preferences.

Sensitive authentication credentials, real emergency details and private location data must not be stored insecurely.

11.4 Service Separation

Frontend services should separate data access from UI components.

Example:

src/
  services/
    authService.js
    hazardService.js
    routeService.js
    tripService.js
    sosService.js
    contactService.js
    notificationService.js

During the current phase, these services will use mock data. They may later be adapted for authorized backend integration without unnecessarily rewriting the UI.

12. External Integrations — Future Scope

Service| Purpose
OpenStreetMap| Geographic map display
Leaflet| Map rendering
OSRM| Route calculation
TomTom| Traffic information,
Open-Meteo| Weather data
USGS| Earthquake information
Firebase| Future notifications or related services
Twilio / Native Android SMS| Future emergency messaging capabilities

External services may have usage restrictions, rate limits, licensing conditions or API-key requirements. These must be reviewed before production use.

13. Development Roadmap

Development will be incremental. Each phase should be completed and tested before moving to the next major phase.

Phase| Development Activity
1| Existing project inspection and React + Vite setup
2| Folder structure, design system and reusable components
3| Authentication screens and navigation
4| Traveller dashboard and interactive map
5| Hazard visualization and hazard details
6| Route visualization, comparison and safety score
7| Trip monitoring and family dashboard
8| SOS and emergency assistance interfaces
9| Police dashboard and incident management demo
10| Notifications, nearby places and settings
11| Responsive design, accessibility and error handling
12| Frontend testing, bug fixing and final demonstration

14. Testing Strategy

14.1 Component Testing

Test reusable components, forms, buttons, maps and status indicators.

14.2 Functional Testing

Verify:

- Navigation between screens.
- Form validation.
- Theme switching.
- Map interactions.
- Hazard selection.
- Route selection.
- Trip start and stop.
- SOS countdown and cancellation.
- Emergency contact management.
- Notification interactions.
- Dashboard filters.

14.3 Responsive Testing

Test the application on desktop, tablet and mobile screen sizes.

14.4 Error-State Testing

Verify the interface handles:

- Missing location.
- Unavailable map tiles.
- Empty search results.
- Missing hazard information.
- Failed demonstration operations.
- Invalid form input.
- Network disconnection.

14.5 Acceptance Testing

A feature is considered complete when:

1. Its interface is implemented.
2. Its intended user interaction works.
3. Loading, empty and error states are handled.
4. It is responsive.
5. It passes relevant tests.
6. Demo and live functionality are clearly distinguished.

15. Privacy, Safety and Ethical Considerations

RakshaPath deals with sensitive journey and emergency-related information.

The following principles are mandatory:

- Location sharing must be user-controlled.
- Sharing should be limited to intended recipients.
- Private links should support expiry and revocation.
- Users should be able to stop sharing.
- Last-updated timestamps must be visible.
- Emergency alerts must have truthful delivery statuses.
- Safety scores must be presented as estimates.
- Weather alerts must not be presented as confirmed physical road damage.
- Police dashboard incidents must be identified as simulated.
- The application must not promise guaranteed safety or emergency response.

16. Success Criteria

The frontend implementation will be considered successful when:

1. The React + Vite application runs correctly.
2. All major application sections are accessible.
3. Traveller, family and police interfaces are implemented.
4. Navigation between screens works.
5. Map and hazard interfaces render correctly.
6. Route and safety-score demonstrations work.
7. Trip monitoring interactions work.
8. SOS countdown and cancellation work.
9. Emergency contacts can be managed in the demo.
10. Notifications and settings work.
11. Responsive layouts work across target screen sizes.
12. Mock data is clearly identified.
13. No critical frontend errors remain.
14. Relevant frontend tests pass.
15. The application is ready for a complete frontend demonstration.

17. Future Enhancements

After frontend completion and approval, future development may include:

- Authorized integration with the existing FastAPI backend.
- Secure user authentication.
- PostgreSQL and PostGIS integration.
- Live location updates.
- Real-time hazard feeds.
- Reliable trip-sharing services.
- Push notifications.
- Native Android background location.
- Native SMS fallback.
- Hardware-triggered SOS.
- Capacitor Android packaging and testing.
- Production deployment and monitoring.

These enhancements are not considered complete merely because their frontend screens exist.

18. Development Rules and Project Constraints

The following rules govern the implementation of RakshaPath v5.0:

1. React + Vite is the active frontend development stack.
2. The existing Flutter project must be preserved.
3. Existing project files must not be deleted without inspection and explicit approval.
4. Backend development is postponed until the frontend is fully completed, tested and approved.
5. No backend, database, API contract or server configuration changes are permitted during the frontend phase.
6. Use mock data for unavailable backend-dependent functionality.
7. Do not falsely represent simulated actions as real emergency operations.
8. Build incrementally rather than generating the entire application in one uncontrolled step.
9. Preserve working functionality when introducing new features.
10. Test each major module before progressing.
11. Maintain readable, reusable and maintainable code.
12. Update this PRD when significant scope or technology decisions change.

---

19. Version History

Version| Date | Description
4.0| 2026-10-08 | Original RakshaPath scope combining Flutter Android application, React web dashboards and backend architecture.
5.0| 2026-11-17 | Revised frontend architecture with React + Vite as the active development approach, preserved original functional vision, introduced mock-data-first development and deferred backend integration.
5.1| 2026-11-20 | Formalized brand identity ("Plan • Travel • Stay Safe", teal/coral palette, DESIGN.md), unified responsive breakpoint at 820px, updated hazard severity color tokens (FR-22/FR-78), documented PBKDF2 (600k iterations) client-side demo auth, and archived Flutter v4.0 PRD.
5.2| 2026-11-20 | Added FR-100 (Quick Demo-Role Authentication for Traveller, Family, and Police demo roles), aligned authentication hero auto-hide breakpoint with the unified 820px mobile breakpoint, documented 1100px telemetry card hide rule, and added card container styling specifications to the login interface.
5.3| 2026-11-20 | Re-audited PRD against current frontend implementation. Codified FR-100 seeded demo accounts in `src/constants/demoUsers.js` with client-side demo-only safeguards, documented role-aware redirects after login (`/dashboard`, `/family`, `/police`) and PublicOnlyRoute guards. Documented collapsed-by-default map legend (SafetyMap), empty-state "Add contact" action in Family Sharing and Contacts (FR-51), and real-time GPS telemetry tracking.
5.4| 2026-11-20 | Documentation audit fixes: purged demo passwords, relocated map legend dock to FR-20.1 with design token references and semantic button/accessibility attributes, and re-mapped trip monitoring sub-items to their precise parent FRs (FR-45.1 GPS projection, FR-47.1 off-route recalculation, FR-48.1 auto-arrival, FR-50.1 proactive hazard advisories).

Document Status: RakshaPath PRD v5.4 — Aligned with current frontend implementation.

Final Product Goal: Build a complete, responsive and functional RakshaPath frontend using React + Vite, with traveller, family and police interfaces, while preserving the original safety-focused product vision.

Tagline: Plan • Travel • Stay Safe