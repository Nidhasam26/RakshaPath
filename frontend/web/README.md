# RakshaPath Web Demo

The traveller and family web experience is a standalone React 19 application built with Vite, Tailwind CSS 4, Leaflet, and Lucide icons. The Police Demo Dashboard is part of this app. The separate `frontend/dashboard` app is not part of this workspace.

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local URL. To create and inspect the production bundle:

```bash
npm run lint
npm run build
npm run preview
```

No backend or environment file is needed. The map uses OpenStreetMap tiles and therefore needs an internet connection to display its basemap.

## App structure

```text
src/
  App.jsx                       role-aware page selection and auth flow
  main.jsx                      React root and AuthProvider
  context/AuthContext.jsx       local demo registration, login, profile, logout
  hooks/useLocalStorage.js      JSON-backed browser persistence
  components/
    auth/AuthShell.jsx          shared cinematic sign-in shell
    layout/                     responsive navigation and header
    maps/SafetyMap.jsx          illustrative Leaflet locations and filters
    PageHeader.jsx              shared page heading and card title
  pages/
    auth/                       Login, Register, Forgot Password
    traveller/                  Dashboard, Live Map, Trips, Contacts
    family/                     Family Sharing
    police/                     Police Demo Dashboard
    settings/                   Profile and preference controls
public/images/                  local RakshaPath hero artwork
```

Keep page selection and role access in `App.jsx`; put reusable visual patterns in `components/`; keep page-specific state close to its page. `Sidebar.jsx` is the source of navigation labels and icons. Add a new page to the role allowlist and page map in `App.jsx` as well as the appropriate navigation list.

## Demo roles and behavior

Registration supports Traveller, Family, and Police roles. Each role gets a different navigation set. Police accounts see the Police Demo Dashboard; family accounts see their sharing overview. Login, registration, logout, profile edits, and demo page data remain in browser LocalStorage. Do not enter real credentials or private contact details.

The following actions are local demonstrations only: password reset, safety/map markers, route records, contact sharing preferences, and incident triage. The app does not send messages, share live locations, receive alerts, or dispatch responders. SOS guidance points to the device's `tel:112` handler.

## LocalStorage keys

| Key | Data |
| --- | --- |
| `rakshapath_demo_users` | Demo accounts created in this browser |
| `rakshapath_demo_session` | Signed-in demo identity |
| `rakshapath_profile` | Editable display name and email preferences |
| `rakshapath_preferences` | Notification, privacy, and sharing toggles |
| `trips` | Planned and completed demo journeys |
| `contacts` | Shared trusted and emergency contacts |
| `primaryId` | Primary emergency contact id |
| `sharingEnabled` | Family sharing preference |
| `rakshapath_police_alerts` | Police dashboard sample alert statuses |

Use `useLocalStorage` for new persistent demo state so values are initialized safely and JSON encoded consistently. Clearing site data resets the demo.

## Design and accessibility

The UI uses CSS custom properties and reusable classes in `src/index.css`, with responsive breakpoints for tablet and phone widths. Preserve visible keyboard focus, labels for form controls, button names, `aria-current`/`aria-pressed`/`aria-checked` state, and reduced-motion support when adding interactions. Keep demo and live-service boundaries explicit in the UI.
