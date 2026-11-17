import { AlertTriangle, Navigation, Pause, Play, Square } from 'lucide-react'

export function ActiveTripTracker({ activeTrip, onPause, onResume, onEnd }) {
  if (!activeTrip) return null

  const isPaused = activeTrip.isPaused || activeTrip.status === 'Paused'

  return (
    <article
      role="region"
      className="panel panel-pad active-trip-tracker"
      style={{
        border: '1px solid rgba(100, 226, 186, 0.4)',
        background: 'linear-gradient(135deg, rgba(100, 226, 186, 0.05) 0%, rgba(9, 13, 18, 0.95) 100%)',
        marginBottom: 16,
      }}
      aria-label="Active journey monitoring"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isPaused ? 'rgba(255, 198, 109, 0.2)' : 'rgba(100, 226, 186, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isPaused ? 'var(--amber)' : 'var(--mint)',
            }}
          >
            <Navigation size={16} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>
                {activeTrip.start} → {activeTrip.end}
              </h3>
              <span className={`pill ${isPaused ? 'pill-quiet' : 'pill-mint'}`} style={{ fontSize: 9 }}>
                {isPaused ? 'PAUSED' : 'EN ROUTE'}
              </span>
            </div>
            <span className="muted" style={{ fontSize: 11 }}>
              {activeTrip.route?.name || 'Selected Corridor'} · {activeTrip.totalDistanceKm} km total
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pill pill-lime" style={{ fontSize: 10 }}>
            SIMULATED MOVEMENT (DEMO)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span className="muted">Journey Progress</span>
          <strong style={{ color: 'var(--mint)' }}>{activeTrip.progress}%</strong>
        </div>
        <div
          role="progressbar"
          aria-valuenow={activeTrip.progress}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Journey progress"
          style={{
            height: 8,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${activeTrip.progress}%`,
              background: isPaused
                ? 'var(--amber, #ffc66d)'
                : 'linear-gradient(90deg, #64e2ba 0%, #c6f36a 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Metric Dials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Remaining Dist</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
            {activeTrip.remainingKm} <span style={{ fontSize: 10, fontWeight: 400 }}>km</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Est. Time Left</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
            {activeTrip.remainingMins} <span style={{ fontSize: 10, fontWeight: 400 }}>mins</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Status</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: isPaused ? 'var(--amber)' : 'var(--mint)', marginTop: 2 }}>
            {activeTrip.status}
          </div>
        </div>
      </div>

      {/* Proactive Route Hazard Warning */}
      {activeTrip.warnings && activeTrip.warnings.length > 0 && (
        <div
          className="notice"
          role="alert"
          style={{
            marginBottom: 14,
            borderColor: 'var(--amber, #ffc66d)',
            background: 'rgba(255, 198, 109, 0.08)',
          }}
        >
          <AlertTriangle size={15} color="var(--amber)" />
          <div>
            <strong style={{ display: 'block', fontSize: 11, color: 'var(--amber)' }}>
              SIMULATED ROUTE ADVISORY
            </strong>
            <span style={{ fontSize: 11 }}>{activeTrip.warnings[activeTrip.warnings.length - 1]}</span>
          </div>
        </div>
      )}

      {/* Control Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {isPaused ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onResume}
              style={{ fontSize: 12, minHeight: 36 }}
            >
              <Play size={13} /> Resume Journey
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={onPause}
              style={{ fontSize: 12, minHeight: 36 }}
            >
              <Pause size={13} /> Pause Journey
            </button>
          )}

          <button
            type="button"
            className="btn btn-quiet"
            onClick={onEnd}
            style={{ fontSize: 12, minHeight: 36, color: 'var(--coral)' }}
          >
            <Square size={13} /> End Journey
          </button>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: 10, textAlign: 'right', flex: 1, minWidth: 200 }}>
          Simulated journey progress for UI evaluation. No real-world GPS tracking or physical vehicle movement is active.
        </p>
      </div>
    </article>
  )
}

export default ActiveTripTracker
