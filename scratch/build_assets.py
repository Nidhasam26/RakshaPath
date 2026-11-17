import os
import math
from PIL import Image, ImageDraw

# Target output directories
MOBILE_IMG_DIR = os.path.abspath(r"c:\Users\nihall\Desktop\RakshaPath\frontend\mobile\assets\images")

WIDTH, HEIGHT = 1200, 800

# ==============================================================================
# 1. WELCOME HEADER (Safe Highway, Night Route, Rain Hazard & Shield)
# ==============================================================================
def create_welcome_svg():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0B132B"/>
      <stop offset="60%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Dark Sky Background -->
  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bgGrad)"/>

  <!-- Horizon Line -->
  <line x1="0" y1="360" x2="{WIDTH}" y2="360" stroke="#334155" stroke-width="2"/>

  <!-- Rain Hazard Slanted Streaks -->
  <g stroke="#38BDF8" stroke-width="2" opacity="0.6">
    <line x1="120" y1="100" x2="80" y2="220"/>
    <line x1="220" y1="60" x2="180" y2="180"/>
    <line x1="320" y1="120" x2="280" y2="240"/>
    <line x1="420" y1="80" x2="380" y2="200"/>
    <line x1="520" y1="140" x2="480" y2="260"/>
    <line x1="720" y1="80" x2="680" y2="200"/>
    <line x1="820" y1="120" x2="780" y2="240"/>
    <line x1="920" y1="60" x2="880" y2="180"/>
    <line x1="1040" y1="100" x2="1000" y2="220"/>
    <line x1="1140" y1="130" x2="1100" y2="250"/>
  </g>

  <!-- Highway Road Vanishing Perspective -->
  <polygon points="560,360 640,360 1050,800 150,800" fill="url(#roadGrad)" stroke="#334155" stroke-width="3"/>

  <!-- Road Dividing Dashes -->
  <g stroke="#F59E0B" stroke-width="8" stroke-dasharray="24,28">
    <line x1="600" y1="370" x2="600" y2="800"/>
  </g>

  <!-- Glowing Route Line -->
  <path d="M 280,740 Q 500,600 580,480 T 600,370" fill="none" stroke="#E11D48" stroke-width="8" stroke-linecap="round"/>
  <path d="M 280,740 Q 500,600 580,480 T 600,370" fill="none" stroke="#FDA4AF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>

  <!-- Hazard Map Pin (Left) -->
  <g transform="translate(360, 520)">
    <circle cx="0" cy="0" r="28" fill="#1E293B" stroke="#EF4444" stroke-width="3"/>
    <path d="M -10,6 L 0,-14 L 10,6 Z" fill="#EF4444"/>
    <line x1="0" y1="-8" x2="0" y2="0" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="0" cy="4" r="1.5" fill="#FFFFFF"/>
    <line x1="0" y1="28" x2="0" y2="52" stroke="#EF4444" stroke-width="3"/>
  </g>

  <!-- Hazard Map Pin (Right) -->
  <g transform="translate(760, 480)">
    <circle cx="0" cy="0" r="24" fill="#1E293B" stroke="#F59E0B" stroke-width="3"/>
    <circle cx="0" cy="0" r="8" fill="#F59E0B"/>
    <line x1="0" y1="24" x2="0" y2="44" stroke="#F59E0B" stroke-width="3"/>
  </g>

  <!-- Floating Safety Shield (Center Horizon) -->
  <g transform="translate(600, 240)">
    <path d="M 0,-70 L 60,-40 L 60,20 Q 60,70 0,95 Q -60,70 -60,20 L -60,-40 Z" fill="#0F172A" stroke="#10B981" stroke-width="6"/>
    <path d="M 0,-50 L 42,-28 L 42,16 Q 42,54 0,72 Q -42,54 -42,16 L -42,-28 Z" fill="#10B981" fill-opacity="0.2"/>
    <path d="M -18,12 L -4,26 L 22,-8" fill="none" stroke="#10B981" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>'''
    return svg

def create_welcome_raster():
    img = Image.new("RGB", (WIDTH, HEIGHT), (11, 19, 43))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(11 * (1 - ratio) + 30 * ratio)
        g = int(19 * (1 - ratio) + 41 * ratio)
        b = int(43 * (1 - ratio) + 59 * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Horizon line
    draw.line([(0, 360), (WIDTH, 360)], fill=(51, 65, 85), width=2)

    # Rain streaks
    rain_x = [120, 220, 320, 420, 520, 720, 820, 920, 1040, 1140]
    for rx in rain_x:
        draw.line([(rx, 80), (rx - 40, 220)], fill=(56, 189, 248), width=2)
        draw.line([(rx + 50, 140), (rx + 20, 260)], fill=(56, 189, 248), width=2)

    # Road polygon
    draw.polygon([(560, 360), (640, 360), (1050, 800), (150, 800)], fill=(20, 28, 44), outline=(51, 65, 85))

    # Road dashes
    for y in range(370, 780, 50):
        draw.line([(600, y), (600, y + 25)], fill=(245, 158, 11), width=8)

    # Route curve
    points = []
    for t in [i / 40.0 for i in range(41)]:
        # Quadratic bezier from (280, 740) to (580, 480) to (600, 370)
        bx = (1 - t)**2 * 280 + 2 * (1 - t) * t * 500 + t**2 * 600
        by = (1 - t)**2 * 740 + 2 * (1 - t) * t * 600 + t**2 * 370
        points.append((int(bx), int(by)))
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=(225, 29, 72), width=8)
        draw.line([points[i], points[i+1]], fill=(253, 164, 175), width=3)

    # Shield at (600, 240)
    sx, sy = 600, 240
    shield_pts = [(sx, sy - 70), (sx + 60, sy - 40), (sx + 60, sy + 20), (sx, sy + 95), (sx - 60, sy + 20), (sx - 60, sy - 40)]
    draw.polygon(shield_pts, fill=(15, 23, 42), outline=(16, 185, 129))
    # Shield checkmark
    draw.line([(sx - 18, sy + 12), (sx - 4, sy + 26)], fill=(16, 185, 129), width=7)
    draw.line([(sx - 4, sy + 26), (sx + 22, sy - 8)], fill=(16, 185, 129), width=7)

    # Hazard pin at (360, 520)
    draw.ellipse([(360 - 28, 520 - 28), (360 + 28, 520 + 28)], fill=(30, 41, 59), outline=(239, 68, 68), width=3)
    draw.polygon([(360 - 10, 520 + 6), (360, 520 - 14), (360 + 10, 520 + 6)], fill=(239, 68, 68))
    draw.line([(360, 520 + 28), (360, 520 + 52)], fill=(239, 68, 68), width=3)

    return img


# ==============================================================================
# 2. SIGN IN HEADER (Night Road Telemetry, Radar Sweeps & Incident Pin)
# ==============================================================================
def create_signin_svg():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSignIn" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#070D1E"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>

  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bgSignIn)"/>

  <!-- Spatial Radar Concentric Rings -->
  <g fill="none" stroke="#38BDF8" stroke-width="1.5" opacity="0.3">
    <circle cx="600" cy="380" r="120" stroke-dasharray="6,6"/>
    <circle cx="600" cy="380" r="220"/>
    <circle cx="600" cy="380" r="320" stroke-dasharray="8,8"/>
    <circle cx="600" cy="380" r="420"/>
  </g>

  <!-- Crosshairs -->
  <line x1="600" y1="40" x2="600" y2="720" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,6"/>
  <line x1="100" y1="380" x2="1100" y2="380" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,6"/>

  <!-- Roadway Vector Grid -->
  <polygon points="580,380 620,380 900,800 300,800" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  <g stroke="#F59E0B" stroke-width="6" stroke-dasharray="20,24">
    <line x1="600" y1="380" x2="600" y2="800"/>
  </g>

  <!-- Verified Destination Pin -->
  <g transform="translate(600, 320)">
    <circle cx="0" cy="0" r="32" fill="#0F172A" stroke="#E11D48" stroke-width="4"/>
    <circle cx="0" cy="0" r="14" fill="#E11D48"/>
    <line x1="0" y1="32" x2="0" y2="60" stroke="#E11D48" stroke-width="4"/>
  </g>

  <!-- Hazard Alert Marker Left -->
  <g transform="translate(420, 520)">
    <circle cx="0" cy="0" r="24" fill="#0F172A" stroke="#EF4444" stroke-width="3"/>
    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#EF4444" stroke-width="3"/>
    <line x1="8" y1="-8" x2="-8" y2="8" stroke="#EF4444" stroke-width="3"/>
    <line x1="0" y1="24" x2="0" y2="48" stroke="#EF4444" stroke-width="3"/>
  </g>

  <!-- Safe Corridor Node Right -->
  <g transform="translate(780, 500)">
    <circle cx="0" cy="0" r="24" fill="#0F172A" stroke="#10B981" stroke-width="3"/>
    <polyline points="-8,0 -2,6 8,-4" fill="none" stroke="#10B981" stroke-width="3"/>
    <line x1="0" y1="24" x2="0" y2="48" stroke="#10B981" stroke-width="3"/>
  </g>
</svg>'''
    return svg

def create_signin_raster():
    img = Image.new("RGB", (WIDTH, HEIGHT), (7, 13, 30))
    draw = ImageDraw.Draw(img)

    # Background gradient
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(7 * (1 - ratio) + 17 * ratio)
        g = int(13 * (1 - ratio) + 24 * ratio)
        b = int(30 * (1 - ratio) + 39 * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Radar rings
    cx, cy = 600, 380
    for r in [120, 220, 320, 420]:
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline=(40, 75, 100), width=2)

    # Crosshairs
    draw.line([(cx, 40), (cx, 720)], fill=(51, 65, 85), width=2)
    draw.line([(100, cy), (1100, cy)], fill=(51, 65, 85), width=2)

    # Roadway
    draw.polygon([(580, 380), (620, 380), (900, 800), (300, 800)], fill=(30, 41, 59), outline=(51, 65, 85))
    for y in range(380, 780, 45):
        draw.line([(600, y), (600, y + 22)], fill=(245, 158, 11), width=6)

    # Destination Pin at (600, 320)
    draw.ellipse([(600 - 32, 320 - 32), (600 + 32, 320 + 32)], fill=(15, 23, 42), outline=(225, 29, 72), width=4)
    draw.ellipse([(600 - 14, 320 - 14), (600 + 14, 320 + 14)], fill=(225, 29, 72))
    draw.line([(600, 320 + 32), (600, 320 + 60)], fill=(225, 29, 72), width=4)

    # Hazard pin left (420, 520)
    draw.ellipse([(420 - 24, 520 - 24), (420 + 24, 520 + 24)], fill=(15, 23, 42), outline=(239, 68, 68), width=3)
    draw.line([(420 - 8, 520 - 8), (420 + 8, 520 + 8)], fill=(239, 68, 68), width=3)
    draw.line([(420 + 8, 520 - 8), (420 - 8, 520 + 8)], fill=(239, 68, 68), width=3)
    draw.line([(420, 520 + 24), (420, 520 + 48)], fill=(239, 68, 68), width=3)

    # Safe node right (780, 500)
    draw.ellipse([(780 - 24, 500 - 24), (780 + 24, 500 + 24)], fill=(15, 23, 42), outline=(16, 185, 129), width=3)
    draw.line([(780 - 8, 500), (780 - 2, 506)], fill=(16, 185, 129), width=3)
    draw.line([(780 - 2, 506), (780 + 8, 496)], fill=(16, 185, 129), width=3)
    draw.line([(780, 500 + 24), (780, 500 + 48)], fill=(16, 185, 129), width=3)

    return img


# ==============================================================================
# 3. SIGN UP HEADER (Connected Community Safety Mesh & Shield Perimeter)
# ==============================================================================
def create_signup_svg():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSignUp" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#080F1E"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bgSignUp)"/>

  <!-- Network Mesh Connecting Lines -->
  <g stroke="#334155" stroke-width="2" opacity="0.6">
    <line x1="200" y1="200" x2="400" y2="400"/>
    <line x1="400" y1="400" x2="600" y2="350"/>
    <line x1="600" y1="350" x2="800" y2="400"/>
    <line x1="800" y1="400" x2="1000" y2="200"/>
    <line x1="300" y1="650" x2="400" y2="400"/>
    <line x1="600" y1="350" x2="600" y2="650"/>
    <line x1="900" y1="650" x2="800" y2="400"/>
  </g>

  <!-- Glowing Route Corridor Overlay -->
  <path d="M 150,750 Q 400,600 600,350 Q 800,600 1050,750" fill="none" stroke="#E11D48" stroke-width="6"/>

  <!-- Multi-Node Network Anchors -->
  <g fill="#1E293B" stroke="#38BDF8" stroke-width="3">
    <circle cx="200" cy="200" r="18"/>
    <circle cx="1000" cy="200" r="18"/>
    <circle cx="300" cy="650" r="18"/>
    <circle cx="900" cy="650" r="18"/>
    <circle cx="400" cy="400" r="22" stroke="#10B981"/>
    <circle cx="800" cy="400" r="22" stroke="#10B981"/>
  </g>

  <!-- Center Shield Node -->
  <g transform="translate(600, 320)">
    <circle cx="0" cy="0" r="70" fill="#0F172A" stroke="#10B981" stroke-width="4"/>
    <path d="M 0,-40 L 36,-20 L 36,15 Q 36,45 0,60 Q -36,45 -36,15 L -36,-20 Z" fill="#10B981" fill-opacity="0.25" stroke="#10B981" stroke-width="4"/>
    <polyline points="-12,8 -2,18 16,-4" fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>'''
    return svg

def create_signup_raster():
    img = Image.new("RGB", (WIDTH, HEIGHT), (8, 15, 30))
    draw = ImageDraw.Draw(img)

    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(8 * (1 - ratio) + 15 * ratio)
        g = int(15 * (1 - ratio) + 23 * ratio)
        b = int(30 * (1 - ratio) + 42 * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Mesh lines
    mesh = [
        ((200, 200), (400, 400)), ((400, 400), (600, 350)), ((600, 350), (800, 400)),
        ((800, 400), (1000, 200)), ((300, 650), (400, 400)), ((600, 350), (600, 650)),
        ((900, 650), (800, 400))
    ]
    for p1, p2 in mesh:
        draw.line([p1, p2], fill=(51, 65, 85), width=2)

    # Route corridor curve
    pts = []
    for t in [i / 40.0 for i in range(41)]:
        if t <= 0.5:
            # 150,750 to 600,350
            u = t * 2
            bx = (1 - u)**2 * 150 + 2 * (1 - u) * u * 400 + u**2 * 600
            by = (1 - u)**2 * 750 + 2 * (1 - u) * u * 600 + u**2 * 350
        else:
            # 600,350 to 1050,750
            u = (t - 0.5) * 2
            bx = (1 - u)**2 * 600 + 2 * (1 - u) * u * 800 + u**2 * 1050
            by = (1 - u)**2 * 350 + 2 * (1 - u) * u * 600 + u**2 * 750
        pts.append((int(bx), int(by)))
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=(225, 29, 72), width=6)

    # Nodes
    for nx, ny in [(200, 200), (1000, 200), (300, 650), (900, 650)]:
        draw.ellipse([(nx - 18, ny - 18), (nx + 18, ny + 18)], fill=(30, 41, 59), outline=(56, 189, 248), width=3)
    for nx, ny in [(400, 400), (800, 400)]:
        draw.ellipse([(nx - 22, ny - 22), (nx + 22, ny + 22)], fill=(30, 41, 59), outline=(16, 185, 129), width=3)

    # Center shield
    sx, sy = 600, 320
    draw.ellipse([(sx - 70, sy - 70), (sx + 70, sy + 70)], fill=(15, 23, 42), outline=(16, 185, 129), width=4)
    shield_pts = [(sx, sy - 40), (sx + 36, sy - 20), (sx + 36, sy + 15), (sx, sy + 60), (sx - 36, sy + 15), (sx - 36, sy - 20)]
    draw.polygon(shield_pts, fill=(20, 50, 40), outline=(16, 185, 129))
    draw.line([(sx - 12, sy + 8), (sx - 2, sy + 18)], fill=(16, 185, 129), width=5)
    draw.line([(sx - 2, sy + 18), (sx + 16, sy - 4)], fill=(16, 185, 129), width=5)

    return img


# ==============================================================================
# 4. POLICE DASHBOARD LOGIN HERO (Operations Tactical Grid & Emergency Dispatch)
# ==============================================================================
def create_dashboard_svg():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="100%" height="100%">
  <defs>
    <linearGradient id="bgDash" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#060912"/>
      <stop offset="100%" stop-color="#0B0F19"/>
    </linearGradient>
  </defs>

  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#bgDash)"/>

  <!-- City Street Grid System -->
  <g stroke="#1F2937" stroke-width="2">
    <!-- Horizontal avenues -->
    <line x1="0" y1="120" x2="{WIDTH}" y2="120"/>
    <line x1="0" y1="240" x2="{WIDTH}" y2="240"/>
    <line x1="0" y1="360" x2="{WIDTH}" y2="360"/>
    <line x1="0" y1="480" x2="{WIDTH}" y2="480"/>
    <line x1="0" y1="600" x2="{WIDTH}" y2="600"/>
    <line x1="0" y1="720" x2="{WIDTH}" y2="720"/>

    <!-- Vertical boulevards -->
    <line x1="150" y1="0" x2="150" y2="{HEIGHT}"/>
    <line x1="300" y1="0" x2="300" y2="{HEIGHT}"/>
    <line x1="450" y1="0" x2="450" y2="{HEIGHT}"/>
    <line x1="600" y1="0" x2="600" y2="{HEIGHT}"/>
    <line x1="750" y1="0" x2="750" y2="{HEIGHT}"/>
    <line x1="900" y1="0" x2="900" y2="{HEIGHT}"/>
    <line x1="1050" y1="0" x2="1050" y2="{HEIGHT}"/>
  </g>

  <!-- Arterial Highway (Diagonal Corridor) -->
  <line x1="100" y1="750" x2="1100" y2="150" stroke="#374151" stroke-width="24"/>
  <line x1="100" y1="750" x2="1100" y2="150" stroke="#F59E0B" stroke-width="4" stroke-dasharray="16,16"/>

  <!-- Active Emergency Incident Sector (Silk Board / Koramangala Grid) -->
  <circle cx="450" cy="360" r="110" fill="#EF4444" fill-opacity="0.12" stroke="#EF4444" stroke-width="2" stroke-dasharray="8,8"/>
  <circle cx="450" cy="360" r="45" fill="#EF4444" fill-opacity="0.25"/>

  <!-- Police Incident Marker Pin -->
  <g transform="translate(450, 360)">
    <circle cx="0" cy="0" r="28" fill="#111827" stroke="#EF4444" stroke-width="4"/>
    <path d="M 0,-14 L 10,10 L -10,10 Z" fill="#EF4444"/>
    <circle cx="0" cy="18" r="4" fill="#EF4444"/>
  </g>

  <!-- Patrol Vector Line -->
  <polyline points="300,600 450,480 450,360 600,240 750,240" fill="none" stroke="#3B82F6" stroke-width="6" stroke-linecap="round"/>
  <circle cx="750" cy="240" r="14" fill="#3B82F6"/>

  <!-- Police HQ Command Center Node -->
  <g transform="translate(900, 480)">
    <rect x="-40" y="-40" width="80" height="80" rx="8" fill="#111827" stroke="#10B981" stroke-width="4"/>
    <path d="M -20,10 L 0,-20 L 20,10 Z" fill="none" stroke="#10B981" stroke-width="3"/>
    <text x="0" y="24" fill="#10B981" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">HQ-01</text>
  </g>

  <!-- Tactical Radar Scope Circles -->
  <circle cx="450" cy="360" r="240" fill="none" stroke="#374151" stroke-width="1" stroke-dasharray="4,8"/>
</svg>'''
    return svg

def create_dashboard_raster():
    img = Image.new("RGB", (WIDTH, HEIGHT), (6, 9, 18))
    draw = ImageDraw.Draw(img)

    # City grid
    for y in range(120, HEIGHT, 120):
        draw.line([(0, y), (WIDTH, y)], fill=(31, 41, 55), width=2)
    for x in range(150, WIDTH, 150):
        draw.line([(x, 0), (x, HEIGHT)], fill=(31, 41, 55), width=2)

    # Arterial highway
    draw.line([(100, 750), (1100, 150)], fill=(55, 65, 81), width=24)
    # Dashed line
    for i in range(0, 40):
        t1 = i / 40.0
        t2 = (i + 0.5) / 40.0
        x1 = int(100 + t1 * 1000)
        y1 = int(750 - t1 * 600)
        x2 = int(100 + t2 * 1000)
        y2 = int(750 - t2 * 600)
        draw.line([(x1, y1), (x2, y2)], fill=(245, 158, 11), width=4)

    # Incident sector (450, 360)
    cx, cy = 450, 360
    draw.ellipse([(cx - 110, cy - 110), (cx + 110, cy + 110)], outline=(239, 68, 68), width=2)
    draw.ellipse([(cx - 45, cy - 45), (cx + 45, cy + 45)], fill=(50, 20, 25), outline=(239, 68, 68), width=2)

    # Incident marker
    draw.ellipse([(cx - 28, cy - 28), (cx + 28, cy + 28)], fill=(17, 24, 39), outline=(239, 68, 68), width=4)
    draw.polygon([(cx, cy - 14), (cx + 10, cy + 10), (cx - 10, cy + 10)], fill=(239, 68, 68))

    # Patrol vector
    patrol = [(300, 600), (450, 480), (450, 360), (600, 240), (750, 240)]
    for i in range(len(patrol) - 1):
        draw.line([patrol[i], patrol[i+1]], fill=(59, 130, 246), width=6)
    draw.ellipse([(750 - 14, 240 - 14), (750 + 14, 240 + 14)], fill=(59, 130, 246))

    # Police HQ at (900, 480)
    hx, hy = 900, 480
    draw.rectangle([(hx - 40, hy - 40), (hx + 40, hy + 40)], fill=(17, 24, 39), outline=(16, 185, 129), width=4)
    draw.polygon([(hx, hy - 20), (hx + 20, hy + 10), (hx - 20, hy + 10)], outline=(16, 185, 129), fill=(20, 40, 30))

    return img


# # ==============================================================================
# WRITE FILES
# ==============================================================================
print("Generating Mobile assets...")

# 1. Welcome
with open(os.path.join(MOBILE_IMG_DIR, "welcome_header.svg"), "w", encoding="utf-8") as f:
    f.write(create_welcome_svg())
create_welcome_raster().save(os.path.join(MOBILE_IMG_DIR, "welcome_header.webp"), "WEBP", quality=90)
print("-> Created welcome_header (.svg, .webp)")

# 2. Sign In
with open(os.path.join(MOBILE_IMG_DIR, "signin_header.svg"), "w", encoding="utf-8") as f:
    f.write(create_signin_svg())
create_signin_raster().save(os.path.join(MOBILE_IMG_DIR, "signin_header.webp"), "WEBP", quality=90)
print("-> Created signin_header (.svg, .webp)")

# 3. Sign Up
with open(os.path.join(MOBILE_IMG_DIR, "signup_header.svg"), "w", encoding="utf-8") as f:
    f.write(create_signup_svg())
create_signup_raster().save(os.path.join(MOBILE_IMG_DIR, "signup_header.webp"), "WEBP", quality=90)
print("-> Created signup_header (.svg, .webp)")

print("All mobile assets successfully generated!")