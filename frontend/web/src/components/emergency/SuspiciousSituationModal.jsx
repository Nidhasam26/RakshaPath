import { useEffect, useState } from 'react'
import { AlertCircle, Eye, Flashlight, Phone, X } from 'lucide-react'

export function SuspiciousSituationModal({ onClose }) {
  const [flashlightActive, setFlashlightActive] = useState(false)
  const [stealthMode, setStealthMode] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Suspicious situation helper"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: stealthMode ? '#000000' : 'rgba(5, 10, 15, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="panel panel-pad"
        style={{
          maxWidth: 440,
          width: '100%',
          position: 'relative',
          background: stealthMode ? '#05070a' : undefined,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 0,
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
          aria-label="Close suspicious situation helper"
        >
          <X size={20} />
        </button>

        <span className="pill pill-coral" style={{ marginBottom: 14 }}>
          FOLLOWING ME / SUSPICIOUS SITUATION · DEMO
        </span>

        <h2 style={{ fontSize: 20, margin: '8px 0 6px' }}>Suspicious surroundings</h2>
        <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
          Tools to help you deter suspicion or navigate to safety.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <button
            type="button"
            className={`btn ${flashlightActive ? 'btn-primary' : ''}`}
            style={{ width: '100%', minHeight: 46, justifyContent: 'space-between' }}
            onClick={() => setFlashlightActive((prev) => !prev)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flashlight size={18} /> High-visibility screen flash
            </span>
            <span>{flashlightActive ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className={`btn ${stealthMode ? 'btn-primary' : ''}`}
            style={{ width: '100%', minHeight: 46, justifyContent: 'space-between' }}
            onClick={() => setStealthMode((prev) => !prev)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={18} /> Stealth dark mode
            </span>
            <span>{stealthMode ? 'ACTIVE' : 'INACTIVE'}</span>
          </button>

          <a
            className="btn btn-danger"
            href="tel:112"
            style={{ width: '100%', minHeight: 48, marginTop: 8 }}
          >
            <Phone size={18} /> Call emergency services (112)
          </a>
        </div>

        <div className="notice" style={{ marginTop: 16 }}>
          <AlertCircle size={15} />
          <span>Demo only. Move toward well-lit public places or call 112 if you feel unsafe.</span>
        </div>
      </div>
    </div>
  )
}

export default SuspiciousSituationModal
