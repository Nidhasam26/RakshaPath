# RakshaPath Image Assets & Placeholders

This directory contains production-ready vector SVG illustrations and compressed WebP placeholders for RakshaPath client applications.

## Asset Inventory

| File Name | Format | Dimensions | Target Screen | Description |
| :--- | :--- | :--- | :--- | :--- |
| `welcome_header.webp` / `.svg` | WebP & SVG | 1200 × 800 | Mobile Welcome (`/frontend/mobile`) | High-contrast highway route under torrential rain with glowing route line, hazard alert pins, and center safety shield. |
| `signin_header.webp` / `.svg` | WebP & SVG | 1200 × 800 | Mobile Sign In (`/frontend/mobile`) | High-contrast spatial radar rings, roadway perspective grid, destination pin, and hazard alert markers. |
| `signup_header.webp` / `.svg` | WebP & SVG | 1200 × 800 | Mobile Sign Up (`/frontend/mobile`) | High-contrast safety mesh network, route corridor, and traveler verification shield. |
| `dashboard_login_hero.webp` / `.svg` | WebP & SVG | 1200 × 800 | Police Dashboard Login (`/frontend/dashboard`) | Tactical police dispatch grid, active incident zone (Silk Board/Koramangala), patrol route vector, HQ-01 command node, and radar scope. |

## Replacing with Custom or Licensed Photos

To replace any placeholder with your own photography or licensed imagery:
1. Ensure the image conforms to a **3:2** aspect ratio (recommended: 1200 × 800 px).
2. Compress the image to **WebP** (`cwebp -q 80 image.png -o image.webp`).
3. Maintain dark tones or apply a 40–60% dark overlay to ensure WCAG AA/AAA text legibility.
4. Replace the target file in both `assets/images/` and the client directory (`frontend/mobile/assets/images/` or `frontend/dashboard/public/images/`).
5. Update `docs/CREDITS.md` with the new license, author, and source attribution.
