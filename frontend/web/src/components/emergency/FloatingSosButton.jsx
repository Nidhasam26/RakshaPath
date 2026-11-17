import { Siren } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function FloatingSosButton() {
  const { user } = useAuth()
  const location = useLocation()

  // Only show for travellers, and hide if already on the SOS page
  if (user?.role !== 'Traveller' || location.pathname === '/sos') {
    return null
  }

  return (
    <aside aria-label="Quick emergency access" className="floating-sos-aside">
      <Link
        to="/sos"
        className="floating-sos-btn"
        aria-label="Activate Emergency SOS (Demo)"
        title="Activate Emergency SOS (Demo)"
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            flexShrink: 0,
          }}
        >
          <Siren size={16} />
        </span>
        <span>SOS · EMERGENCY</span>
      </Link>
    </aside>
  )
}

export default FloatingSosButton
