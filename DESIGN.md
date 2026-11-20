# RakshaPath Design System & Visual Specification

Document Version: 1.0  
Date: 2026-11-20  
Reference: [/PRD.md](PRD.md) Section 1.3

---

## 1. Brand Identity & Tagline

- **Official Tagline:** `Plan • Travel • Stay Safe`  
  Applied as the single application-wide brand tagline. The legacy tagline *"Know the danger before you reach it"* has been fully deprecated and retired from all user-facing surfaces.
- **Brand Tone:** Premium, modern personal safety and intelligent navigation platform. Dark aesthetic with high-visibility teal accents and coral safety markers.

---

## 2. Logo Artwork & Component Specifications

### 2.1 Asset Files
All brand assets reside in `frontend/web/src/assets/brand/`:
- `logo-full.png` (852 × 534 px, 32-bit RGBA): Shield emblem + two-tone "RakshaPath" wordmark. The bottom tagline band was programmatically cropped to guarantee zero stray artifacts, clean letter descenders ("k", "h", "t", "p"), and exact 8px transparent padding.
- `logo-shield.png` (532 × 408 px, 32-bit RGBA): Standalone shield emblem with protective border and location pin.
- `logo-full-with-tagline.png` (916 × 582 px): Uncropped archive backup.

### 2.2 Component Usage (`<Logo />`)
The reusable `<Logo />` component in `src/components/common/Logo.jsx` provides two standardized variants:
- **`variant="full"` (Auth Surfaces):**
  - Displayed width: **190px** (`aspect-ratio: 852 / 534`, height auto).
  - Used in: `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`.
  - Spacing: **28–36px** bottom margin separating the logo from the "WELCOME BACK" eyebrow pill.
- **`variant="icon"` (Navigation & App Shell):**
  - Desktop Sidebar: **34px** width (`size={34}`).
  - Mobile Topbar Header: **32px** width (`size={32}`).
  - Accompanied by two-tone HTML wordmark: `<span>Raksha</span><span className="brand-accent">Path</span>`.

### 2.3 Favicon & Touch Icons
Generated from `logo-shield.png` and linked in `index.html`:
- `favicon-32.png`: 32 × 32 px
- `favicon.png`: 64 × 64 px
- `apple-touch-icon.png`: 180 × 180 px

---

## 3. Color Token System

All color tokens are declared as CSS custom properties in `src/index.css`:

| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--bg` | `#070d1f` | Deep navy base surface matching the logo background |
| `--surface` | `#0e172e` | Slightly lighter navy for cards, containers, input fields |
| `--panel-raised` | `#141f3b` | Elevated panels, dropdown menus, floating modals |
| `--accent` | `#2de2b0` | Teal-mint ("Path" brand color): primary buttons, active nav, focus rings |
| `--accent-2` | `#7af0a8` | Mint green: button hover states and subtle gradients |
| `--accent-soft` | `rgba(45, 226, 176, 0.1)` | Restrained translucent teal for active nav, non-primary active badges, and status pills |
| `--meta-bg` | `rgba(155, 166, 174, 0.12)` | Subtle neutral background for non-interactive demo and simulated metadata badges |
| `--info` | `#1fa7ff` | Blue: secondary information, Low severity hazard marker |
| `--danger` | `#ff5a4f` | Coral red (logo map pin): SOS, Critical hazard markers, errors |
| `--orange` | `#ff9838` | Orange: High severity hazard markers |
| `--amber` | `#ffc66d` | Amber: Medium severity hazard markers |
| `--text` | `#ffffff` | Primary text |
| `--text-muted` | `#9ba6ae` | Secondary explanatory text |
| `--line` | `rgba(221, 234, 241, 0.09)` | Subtle dividing borders |

### Zero-Lime Policy
The legacy lime green accent (`#c4f36b` / `var(--lime)`) is completely purged from the application code. Any legacy `--lime`, `--mint`, or `--teal` variables are mapped directly to `--accent`.

---

## 4. Hazard Severity Color System

Hazard and incident severities are codified in `src/data/hazardData.js` and applied across maps, chips, feeds, and incident triage:

| Severity Level | Color Token | Hex Code | Visual Indicator |
| :--- | :--- | :--- | :--- |
| **Critical** | `--danger` | `#ff5a4f` | Coral Red marker with animated pulsing radar ring |
| **High** | `--orange` | `#ff9838` | Orange marker |
| **Medium** | `--amber` | `#ffc66d` | Amber marker |
| **Low** | `--info` | `#1fa7ff` | Blue marker |

**Non-Color-Alone Rule:** Every hazard and incident badge pairs its color indicator with a distinct text label (e.g., "Critical", "High") and an icon symbol (e.g., `ShieldAlert`, `AlertTriangle`).

---

## 5. Accessibility & Contrast Verification (WCAG 2.1 AA)

- **Button Contrast:** Primary buttons (`.btn-primary`) render dark navy text (`var(--bg)` / `#070d1f`) over the teal-mint background (`var(--accent)` / `#2de2b0`), producing a contrast ratio of **11.61:1**. This exceeds the WCAG AAA requirement (7.0:1) and WCAG AA requirement (4.5:1).
- **Interactive Focus Rings:** All interactive elements (`<button>`, `<input>`, `<select>`, `<a>`) display a 2px–3px focus ring in `var(--accent)` with a 2px offset.
- **Touch Target Sizes:**
  - Standard action buttons (`.btn`): `min-height: 44px`
  - Icon buttons (`.icon-btn`): `min-width: 44px; min-height: 44px`
  - Input & Select fields (`.input`, `.select`): `min-height: 44px`
  - Navigation items (`.nav-item`): `min-height: 44px`
  - Floating SOS button: `min-height: 48px`
  - Topbar avatar button: `40px` (desktop), `36px` (compact mobile $\le 480$px)
- **Reduced Motion:** All decorative animations (route dash flow, floating card float) respect `@media (prefers-reduced-motion: reduce)`.

---

## 6. Responsive Breakpoint Standards

A single unified breakpoint prevents visual duplication of branding:

| Breakpoint | Window Width | UI Behavior |
| :--- | :--- | :--- |
| **Wide Desktop** | `> 1100px` | Dual-pane auth shell with interactive vector map visual. Corridor card up to 640px wide. Dashboard 4-column metric grid. |
| **Compact Desktop** | `821px – 1100px` | Auth hero corridor/map card (`.auth-hero-card`) auto-hides to preserve headline breathing room and prevent overlap. Stat metrics collapse to 2 columns. Sidebar remains expanded (252px) or collapsed (82px). |
| **Mobile Unified** | `≤ 820px` | **Unified Breakpoint:** Desktop sidebar transforms into an off-canvas drawer while topbar hamburger and `.header-brand-badge` appear together. Simultaneously, auth hero panel (`.auth-visual`) auto-hides, allowing the centered auth card to use comfortable mobile width with safe-area padding. |
| **Small Mobile** | `≤ 480px` | Header compacts to 58px. Topbar avatar sizes to 36px. Touch margins adjusted with `env(safe-area-inset-bottom)`. |

---

## 7. Card Elevation & Surface System

RakshaPath uses a restrained multi-layer surface system that avoids visual clutter while establishing clear depth:

### 7.1 Elevation Hierarchy
- **Base Surfaces (`--bg: #070d1f`):** Application viewport backdrop and mobile drawer canvas.
- **Base Cards (`.panel`, `.card`, `var(--surface): #0e172e`):** Standard container surface for dashboards, forms, and metric sections.
  - Border: `1px solid rgba(255, 255, 255, 0.08)` (light theme: `1px solid var(--line)`)
  - Border Radius: `var(--radius)` (`12px`)
  - Shadow: `inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.2)`
- **Raised Panels (`.panel-raised`, `.profile-dropdown-menu`, `var(--panel-raised): #141f3b`):** Used for dropdown menus, modal sheets, and floating action panels.
  - Border: `1px solid var(--line)`
  - Border Radius: `14px`
  - Shadow: `0 16px 36px rgba(0, 0, 0, 0.6), 0 2px 10px rgba(0, 0, 0, 0.35)`
  - Backdrop Filter: `blur(20px)` with `-webkit-backdrop-filter: blur(20px)`
- **Row Cards (`.row-card`):** Nested list items within panels (contacts, trip items, hazard rows).
  - Background: `rgba(14, 23, 46, 0.6)`
  - Border: `1px solid var(--line)`
  - Border Radius: `10px`
  - Hover Transition: `border-color 0.15s ease, transform 0.15s ease` (`border-color: rgba(45, 226, 176, 0.25); transform: translateY(-1px)`)

---

## 8. Restrained Token Roles (`--accent-soft` & `--meta-bg`)

To prevent visual over-saturation and preserve the premium "safety tech" feel, two dedicated translucent tokens are codified:

- **`--accent-soft` (`rgba(45, 226, 176, 0.1)`):**
  - **Role:** Translucent teal accent background.
  - **Usage:** Applied to active sidebar navigation items, active segmented switch states, non-primary active toggle pills, and soft status indicator backgrounds.
  - **Rule:** Never apply high-opacity glowing teal fills to secondary items; active non-primary controls must use `--accent-soft` with high-contrast text.
- **`--meta-bg` (`rgba(155, 166, 174, 0.12)`):**
  - **Role:** Translucent neutral slate background.
  - **Usage:** Applied to demonstration chips (`.badge-demo`), simulated telemetry badges, role indicator pills, and non-interactive metadata chips.

---

## 9. Sidebar Navigation & Active States

- **Active Navigation Item (`.nav-item.active`):**
  - Background: `var(--accent-soft)` (`rgba(45, 226, 176, 0.1)`)
  - Icon Color: `var(--accent)` (`#2de2b0`)
  - Label Color: `var(--text)` (`#ffffff`)
  - **Zero-Outline Rule:** The legacy full bright-green outline border is strictly prohibited. Active state is conveyed cleanly by the soft translucent teal background and accent icon.
- **Hover Navigation Item (`.nav-item:hover`):**
  - Background: `rgba(255, 255, 255, 0.04)`
  - Label Color: `var(--text)`
- **Sidebar Collapse Behavior:**
  - Expanded width: `252px` (shows icon, label, and category group tags).
  - Collapsed width: `82px` (shows centered icons with tooltips). Typography for section labels and user meta scales down to 11–12px minimum to preserve layout stability without truncation.

---

## 10. Interactive Maps & Tactical Theming

### 10.1 Dark-Theme Map Tile Inversion
Standard OpenStreetMap raster tiles clash with deep dark themes. RakshaPath applies a CSS tile filter strictly in dark mode:
```css
/* Dark theme Leaflet tiles */
:root:not([data-theme="light"]) .leaflet-tile-pane .leaflet-layer {
  filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(90%);
}

/* Light theme tile override: natural daylight rendering */
:root[data-theme="light"] .leaflet-tile-pane .leaflet-layer {
  filter: none;
}
```

### 10.2 Map Pin & Polyline Semantics
- **User Live GPS Position:** Solid accent teal dot (`#2de2b0`) with subtle pulsing radar ring when live tracking is engaged.
- **Route Origin Pin:** Accent-filled circular marker with black vehicle or location icon.
- **Destination Pin:** White center circle (`#ffffff`) surrounded by a distinct `3px` outer ring in `var(--accent)` (`#2de2b0`). *Coral red is strictly avoided for destinations to prevent confusion with hazard alerts.*
- **Safe Route Polyline:** Rendered in `tokens.accent` (`#2de2b0`) with `weight: 6` (selected) or `4` (unselected), and opacity `0.95`.
- **Alternative Route Polyline:** Rendered in muted dashed blue/gray with `weight: 4`, opacity `0.45`, and `dashArray: '6, 8'`.

### 10.3 Collapsed-by-Default Map Legend Dock
- Anchored to the bottom-left of `SafetyMap.jsx` (`bottom: 16px; left: 16px; z-index: 1000`).
- Background: `var(--panel, rgba(14, 23, 46, 0.92))` with `backdrop-filter: blur(8px)`.
- Border: `1px solid var(--line, rgba(255, 255, 255, 0.1))`.
- **Default State:** Collapsed (`legendOpen = false`), presenting a compact `Legend` bar with `Layers` icon, `Expand`/`Collapse` indicator, and `<button type="button" aria-expanded={legendOpen} aria-controls="map-legend-content">`.
- **Expanded State:** Expands vertically (`#map-legend-content` with `aria-hidden={!legendOpen}`) to reveal symbology for GPS position, origin, destination, the 4 hazard severity levels, and selected active route.

---

## 11. Hazard Filter Pills & Badges

Hazard filters on the Live Map allow multi-select filtering across the four severity tiers:
- **Active Filter State:**
  - Background: `var(--accent-soft)`
  - Border: `1px solid var(--accent)` (or matching severity token)
  - Text: High-contrast white (`var(--text)`)
- **Inactive Filter State:**
  - Background: `rgba(255, 255, 255, 0.04)`
  - Border: `1px solid var(--line)`
  - Text: Muted (`var(--text-muted)`)
- **Severity Dots & Badges:**
  - **Critical:** Coral Red (`--danger`: `#ff5a4f`). Reserved exclusively for Critical hazards and SOS dispatch.
  - **High:** Orange (`--orange`: `#ff9838`). Uses `.pill-orange`.
  - **Medium:** Amber (`--amber`: `#ffc66d`). Uses `.pill-amber`.
  - **Low:** Blue (`--info`: `#1fa7ff`). Uses `.pill-blue`.

---

## 12. Authentication Visual Architecture

The authentication screens (`/login`, `/register`, `/forgot-password`) deliver a premium "safety tech" feel using ambient glow layers and glassmorphism:

### 12.1 Ambient Glows & Grid Layer
- **`.auth-shell::before` Glows:** Ambient radial gradients positioned behind the content (`z-index: 0`):
  `radial-gradient(circle at 15% 50%, rgba(45, 226, 176, 0.07), transparent 45%), radial-gradient(circle at 85% 30%, rgba(31, 167, 255, 0.05), transparent 45%)`
- **Faint Grid Pattern (`.auth-visual-grid`):** Subtle 48px vector grid lines (`rgba(255, 255, 255, 0.07)` 1px), masked with `radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 85%)` that fades softly toward display edges.
- **Hero Corridor Card Glow (`.auth-visual-glow`):** `480px × 480px` halo (`left: 20%; bottom: 15%`) with `background: radial-gradient(circle, rgba(45, 226, 176, 0.08) 0%, rgba(45, 226, 176, 0.015) 50%, transparent 70%)` and `filter: blur(50px)` positioned directly behind the vector corridor card.

### 12.2 Glassmorphic Hero & Auth Cards
- **`.auth-card` (Right Column Form Container):**
  - Background: `var(--surface)` (`#0e172e`)
  - Border: `1px solid rgba(255, 255, 255, 0.06)`
  - Radius: `16px`
  - Padding: `clamp(32px, 4vw, 40px)`
  - Max Width: `460px`
  - Shadow: `0 24px 48px -12px rgba(0, 0, 0, 0.5)`
- **`.auth-hero-card` (Left Column Demonstration Card):**
  - Background: `rgba(14, 23, 46, 0.6)`
  - Backdrop Filter: `blur(12px)` with `-webkit-backdrop-filter: blur(12px)`
  - Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Radius: `16px`
  - Padding: `16px 18px`
  - Max Width: `640px`
  - Shadow: `0 16px 36px -8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
- **Vector Route Dash:** Single crisp dashed stroke. Double-stacked glowing underlayers are eliminated in favor of a single crisp stroke.

### 12.3 Demo Chips & Disclaimers
- **Demo Indicator (`.badge-demo`, `.demo-pill`):** Rendered with `font-size: 10px`, `font-weight: 700`, uppercase tracking `0.04em`, using `var(--meta-bg)` and muted text.
- **Demo Disclaimers:** Informative notes below auth controls and demo role selectors render at `12px` in `var(--text-muted)` (`#9ba6ae`), satisfying WCAG AA contrast against card surfaces.

---

## 13. Single Primary Button Rule

To maintain clear visual hierarchy across every screen:
- **Strict Rule:** Every view must contain **at most one** primary action button (`.btn-primary`) styled in solid teal (`var(--accent)` background, dark navy text).
- **Secondary Actions:** All supporting actions (e.g., secondary filters, demo generation links, hazard report tabs, siren duration presets) must be styled as `.btn-secondary`, `.btn-ghost`, or segmented switches.
- **Verified Primary Assignments:**
  - Live Map: `Calculate Road Route & Safety Score`
  - Safe Places: `Call (Demo Contact)`
  - Settings: `Save profile` (On/Off and Theme toggles use `.btn-switch` with `role="switch"`)
  - Emergency SOS: `Start Siren` (duration presets use segmented toggle pills)
  - Emergency Contacts: `Add contact`
  - Family Sharing: `Add family member` (`Generate Demo Share Link` is secondary)
  - My Trips: `Plan a trip`
  - Police Dashboard: `Acknowledge`
  - Register: `Create account`
  - Forgot Password: `Request reset`
