import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { tokens } from '../../theme/tokens'

export function AuthHeroVisual() {
  return (
    <div className="auth-hero-visual" aria-hidden="true">
      <div className="auth-hero-card">
        {/* Card Header: Live Journey Active with SAFE badge */}
        <div className="auth-hero-card-head">
          <div className="auth-hero-card-status">
            <ShieldCheck size={16} className="auth-hero-shield-icon" />
            <span className="auth-hero-card-title">Live Journey Active</span>
          </div>
          <span className="auth-hero-badge">SAFE</span>
        </div>

        {/* Miniature Dark Navigation Map Viewport */}
        <div className="auth-hero-map-viewport">
          {/* Floating Frosted Hazard Warning Chip (Top-Left) */}
          <div className="auth-hazard-chip">
            <AlertTriangle size={12} className="auth-hazard-icon" />
            <span className="auth-hazard-text">High Traffic Ahead</span>
          </div>

          {/* Floating Decorative SOS Preview Pill (Bottom-Right) */}
          <div className="auth-sos-preview-pill">
            <span className="auth-sos-dot" />
            <span className="auth-sos-label">SOS</span>
          </div>

          <svg
            viewBox="0 0 520 150"
            className="auth-hero-svg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="navRouteGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={tokens.accent} />
                <stop offset="60%" stopColor={tokens.accent} />
                <stop offset="100%" stopColor={tokens.accent2} />
              </linearGradient>
              <filter id="navRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Faint Street Network Grid */}
            <path
              d="M0 45 L520 45 M0 115 L520 115"
              stroke="rgba(255, 255, 255, 0.035)"
              strokeWidth="1.5"
            />
            <path
              d="M135 0 L135 150 M275 0 L275 150 M415 0 L415 150"
              stroke="rgba(255, 255, 255, 0.035)"
              strokeWidth="1.5"
            />
            <path
              d="M0 80 Q180 80 275 62 T520 30"
              stroke="rgba(255, 255, 255, 0.02)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Route Outer Glow Underlayer */}
            <path
              d="M 48 115 L 125 115 C 150 115 160 95 175 80 C 195 62 235 62 275 62 C 320 62 355 42 390 42 L 460 42"
              stroke="rgba(45, 226, 176, 0.28)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#navRouteGlow)"
            />

            {/* Route Road Casing */}
            <path
              d="M 48 115 L 125 115 C 150 115 160 95 175 80 C 195 62 235 62 275 62 C 320 62 355 42 390 42 L 460 42"
              stroke="rgba(11, 19, 36, 0.9)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Primary Animated Navigation Route */}
            <path
              d="M 48 115 L 125 115 C 150 115 160 95 175 80 C 195 62 235 62 275 62 C 320 62 355 42 390 42 L 460 42"
              stroke="url(#navRouteGradient)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 8"
              className="auth-route-line"
            />

            {/* Traffic Advisory Marker along the route */}
            <g transform="translate(275, 62)">
              <circle cx="0" cy="0" r="6" fill="rgba(255, 152, 56, 0.2)" />
              <circle cx="0" cy="0" r="2.8" fill={tokens.orange} />
            </g>

            {/* Starting Location Marker (Bottom-Left) */}
            <g transform="translate(48, 115)">
              <circle cx="0" cy="0" r="9" fill="rgba(45, 226, 176, 0.18)" stroke="rgba(45, 226, 176, 0.45)" strokeWidth="1" />
              <circle cx="0" cy="0" r="4.5" fill={tokens.accent} />
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </g>

            {/* Destination Pin (Top-Right) */}
            <g transform="translate(460, 42)">
              <circle cx="0" cy="0" r="8" fill="rgba(45, 226, 176, 0.22)" />
              <path
                d="M 0 -22 C -6 -22 -11 -17 -11 -11 C -11 -3 0 0 0 0 C 0 0 11 -3 11 -11 C 11 -17 6 -22 0 -22 Z"
                fill="#ffffff"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              <circle cx="0" cy="-11" r="3.2" fill="#0b1324" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default AuthHeroVisual
