# RakshaPath Media & Asset Credits

This document lists all visual assets, image sources, licenses, and accessibility metadata used across the RakshaPath client applications:
1. **Primary Web Application** (`/frontend/web`): React + Vite Single Page Application.
2. **Preserved Mobile Architecture** (`/frontend/mobile`): Flutter Android safe travel application.
3. **Legacy Dashboard** (`/frontend/dashboard`): Standalone police dashboard prototype.

---

## 1. Web Application Assets (`frontend/web`)

| Asset File | Target Surface | Format / Dimensions | Author / Source | License | Semantic Label / Alt Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `logo-full.png` | Auth views (`Login`, `Register`, `ForgotPassword`) | PNG (852 × 534 px, 32-bit RGBA) | RakshaPath Project Team | Apache License 2.0 | "RakshaPath brand logo: protective shield emblem with teal-mint wordmark" |
| `logo-shield.png` | Navigation header & mobile topbar | PNG (532 × 408 px, 32-bit RGBA) | RakshaPath Project Team | Apache License 2.0 | "RakshaPath standalone protective shield emblem" |
| `logo-full-with-tagline.png` | Documentation & brand archive | PNG (916 × 582 px) | RakshaPath Project Team | Apache License 2.0 | "RakshaPath full brand identity with tagline band" |
| `favicon.svg`, `favicon.png`, `favicon-32.png` | Browser tab favicon | SVG / PNG (32 × 32, 64 × 64 px) | Derived from `logo-shield.png` | Apache License 2.0 | "RakshaPath shield favicon" |
| `apple-touch-icon.png` | iOS home-screen icon | PNG (180 × 180 px) | Derived from `logo-shield.png` | Apache License 2.0 | "RakshaPath iOS touch icon" |
| Lucide Icons (`lucide-react`) | Application-wide UI iconography | SVG React components | Lucide Project | ISC License | Contextual icon labels and `aria-hidden` attributes |
| OpenStreetMap Tiles | Leaflet interactive maps (`SafetyMap.jsx`, `PoliceIncidentMap.jsx`) | Raster XYZ map tiles | OpenStreetMap contributors | ODbL (Open Database License) | "OpenStreetMap cartographic data tiles" |

---

## 2. Legacy & Preserved Mobile Assets (`/frontend/mobile` & `/frontend/dashboard`)

| Asset File | Target Screen | Format / Size | Author / Source | License | Semantic Label / Alt Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `welcome_header.webp` / `.svg` | Mobile Welcome Screen | WebP / SVG (1200 × 800) | RakshaPath Project Team | Apache License 2.0 | "Highway route with hazard alert pins, glowing corridor, and green safety shield" |
| `signin_header.webp` / `.svg` | Mobile Sign In Screen | WebP / SVG (1200 × 800) | RakshaPath Project Team | Apache License 2.0 | "Spatial radar scope with roadway vector grid, verified destination pin, and hazard alert markers" |
| `signup_header.webp` / `.svg` | Mobile Sign Up Screen | WebP / SVG (1200 × 800) | RakshaPath Project Team | Apache License 2.0 | "Interconnected traveler safety mesh network, route corridor line, and protective verification shield" |
| `dashboard_login_hero.webp` / `.svg` | Legacy Dashboard Login | WebP / SVG (1200 × 800) | RakshaPath Project Team | Apache License 2.0 | "Police operations map with city street grid, incident perimeter, patrol vector, and HQ command node" |

---

## 3. Design Principles & Guidelines

1. **No AI-Generated Raster Hallucinations**: All brand logos and vector artworks are deterministic graphic assets created with exact pixel geometries and clear margins.
2. **High Contrast & WCAG 2.1 AA Compliance**:
   - Dark backgrounds (`#070d1f`, `#0e172e`) deliver high contrast against light text (`#ffffff`, `#9ba6ae`).
   - Signal colors follow tactical safety semantics: Coral Red `--danger` / `#ff5a4f` (SOS, Critical hazard), Orange `--orange` / `#ff9838` (High), Amber `--amber` / `#ffc66d` (Medium), Blue `--info` / `#1fa7ff` (Low), and Teal-Mint `--accent` / `#2de2b0` (Safe, Primary actions).
3. **Non-Color-Alone Rule**: Every visual hazard badge or status indicator pairs its color with an explicit textual label and an icon symbol.
