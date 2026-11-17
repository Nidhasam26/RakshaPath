import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, ShieldCheck, X } from 'lucide-react'

export function SafetyCheckInModal({ onClose, defaultMinutes = 15 }) {
  const [secondsRemaining, setSecondsRemaining] = useState(defaultMinutes * 60)
  const [isActive, setIsActive] = useState(true)
  const [isSafeChecked, setIsSafeChecked] = useState(false)

  useEffect(() => {
    let interval = null
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((current) => current - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, secondsRemaining])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
  }

  const handleImSafe = () => {
    setIsActive(false)
    setIsSafeChecked(true)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Safety check-in timer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 15, 0.92)',
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
          textAlign: 'center',
          position: 'relative',
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
          aria-label="Close check-in modal"
        >
          <X size={20} />
        </button>

        <span className="pill pill-lime" style={{ marginBottom: 14 }}>
          DEMO SAFETY CHECK-IN
        </span>

        {isSafeChecked ? (
          <div style={{ padding: '24px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(100, 226, 186, 0.15)',
                color: 'var(--mint)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Check-in confirmed</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              You marked yourself as safe. In a live system, your circle would be updated.
            </p>
            <button className="btn btn-primary" type="button" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 0' }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: secondsRemaining < 60 ? 'var(--coral)' : 'var(--lime)',
                margin: '12px 0',
                fontVariantNumeric: 'tabular-nums',
              }}
              aria-live="polite"
            >
              {formatTime(secondsRemaining)}
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>
              Check-in timer running. Tap &quot;I&apos;m Safe&quot; to confirm your wellbeing before the timer expires.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleImSafe}
                style={{ width: '100%', minHeight: 46 }}
              >
                <ShieldCheck size={18} /> I am safe
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => setSecondsRemaining(30)}
                style={{ fontSize: 11 }}
              >
                <Clock size={14} /> Set quick 30-sec demo timer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SafetyCheckInModal
