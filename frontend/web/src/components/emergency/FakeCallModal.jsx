import { useEffect, useState } from 'react'
import { PhoneCall, PhoneOff, User, X } from 'lucide-react'

export function FakeCallModal({ callerName = 'Dad', onClose }) {
  const [callState, setCallState] = useState('incoming') // 'incoming' | 'active'
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    let interval = null
    if (callState === 'active') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Simulated phone call"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 15, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '48px 24px',
        color: '#fff',
      }}
    >
      <div style={{ textAlign: 'center', width: '100%' }}>
        <span className="pill pill-coral" style={{ marginBottom: 16 }}>
          DEMO SIMULATION · NO REAL CALL
        </span>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            marginBottom: 16,
          }}
        >
          <User size={44} color="var(--accent)" />
        </div>
        <h2 style={{ fontSize: 28, margin: '0 0 6px' }}>{callerName}</h2>
        <p className="muted" style={{ fontSize: 14 }}>
          {callState === 'incoming' ? 'Incoming simulated call...' : `Connected · ${formatDuration(callDuration)}`}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {callState === 'incoming' ? (
          <>
            <button
              type="button"
              className="btn btn-danger"
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={onClose}
              aria-label="Decline fake call"
            >
              <PhoneOff size={28} />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--mint, #10b981)',
              }}
              onClick={() => setCallState('active')}
              aria-label="Accept fake call"
            >
              <PhoneCall size={28} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-danger"
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={onClose}
            aria-label="Hang up fake call"
          >
            <PhoneOff size={28} />
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={onClose}
          style={{ fontSize: 12, opacity: 0.7 }}
        >
          <X size={14} style={{ marginRight: 6 }} /> Close demo tool
        </button>
      </div>
    </div>
  )
}

export default FakeCallModal

