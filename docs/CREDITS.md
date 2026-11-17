# RakshaPath Media & Asset Credits

This document lists all visual assets, image sources, licenses, and accessibility metadata used across the RakshaPath client applications (`/frontend/mobile` and `/frontend/dashboard`).

---

## 1. Asset Inventory & Attribution

| Asset File | Target Screen | Format / Size | Author / Source | License | Semantic Label / Alt Text |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `welcome_header.webp`<br>`welcome_header.svg` | Mobile Welcome Screen (`/frontend/mobile`) | WebP / SVG<br>1200 × 800 | Original RakshaPath vector illustration (authored by core project team) | Apache License 2.0 | "Vector illustration of a highway route under rain with road markings, hazard alert pins, glowing corridor, and green safety shield" |
| `signin_header.webp`<br>`signin_header.svg` | Mobile Sign In Screen (`/frontend/mobile`) | WebP / SVG<br>1200 × 800 | Original RakshaPath vector illustration (authored by core project team) | Apache License 2.0 | "Vector illustration of a spatial radar scope with roadway vector grid, verified destination pin, and hazard alert markers" |
| `signup_header.webp`<br>`signup_header.svg` | Mobile Sign Up Screen (`/frontend/mobile`) | WebP / SVG<br>1200 × 800 | Original RakshaPath vector illustration (authored by core project team) | Apache License 2.0 | "Vector illustration of an interconnected traveler safety mesh network, route corridor line, and protective verification shield" |
| `dashboard_login_hero.webp`<br>`dashboard_login_hero.svg` | Police Dashboard Login Screen (`/frontend/dashboard`) | WebP / SVG<br>1200 × 800 | Original RakshaPath vector illustration (authored by core project team) | Apache License 2.0 | "Tactical police operations map featuring city street grid, Silk Board active incident perimeter, patrol vector, HQ command node, and radar scope" |

---

## 2. Design Principles & Guidelines

1. **No AI-Generated Imagery**: None of the illustrations contain AI-generated raster hallucinations, synthetic faces, or algorithmic artifacts. All paths, points, polygons, strokes, and gradients are deterministic SVGs compiled into compressed WebP format.
2. **No Emoji or Fake Photos of People**: Imagery represents technical geospatial concepts—corridors, roads, rain hazard streaks, radar vectors, pins, and shields.
3. **High Contrast & WCAG AA/AAA Compliance**:
   - Dark backgrounds (`#0B132B`, `#0F172A`, `#060912`, `#111827`) provide a minimum 7:1 contrast ratio against light foreground elements (`#F8FAFC`, `#94A3B8`).
   - Signal colors strictly follow tactical semantics: Crimson `#EF4444` / `#E11D48` (emergency), Amber `#F59E0B` (hazard/caution), Sky `#38BDF8` (rain/sensors), Emerald `#10B981` (safe/verified).
4. **No Purple Gradients**: Gradients are constrained to neutral dark slates and deep charcoal tones (`#070D1E` to `#111827`).
5. **No Pill-Shaped Buttons or Decorative Animations**: Buttons use rectangular or slightly rounded corners (`4px`–`8px`). All transitions are instantaneous or functional without decorative loops.
6. **Overlay Guarantee**: In mobile viewports, image headers are treated with a dark gradient overlay (`rgba(15, 23, 42, 0.45)` down to solid `#0F172A`), ensuring full text legibility and keyboard-safe scrollability.

---

## 3. Replacement Instructions

If replacing any placeholder with licensed stock photos or department-issued imagery:
1. Export to **WebP** at 1200 × 800 px resolution.
2. Place files into:
   - `assets/images/<name>.webp`
   - `frontend/mobile/assets/images/<name>.webp`
   - `frontend/dashboard/public/images/<name>.webp`
3. Update the author, license type, and source URL in this file (`docs/CREDITS.md`).
