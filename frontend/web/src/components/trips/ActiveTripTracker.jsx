import { useState } from 'react'
import {
  AlertTriangle,
  Compass,
  Loader2,
  Navigation,
  Pause,
  Play,
  RotateCw,
  Square,
} from 'lucide-react'

export function ActiveTripTracker({
  activeTrip,
  onPause,
  onResume,
  onEnd,
  onRecalculate,
  onToggleMode,
  onStartTracking,
  onStopTracking,
  isTracking = false,
  userLocation = null,
}) {
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [recalcError, setRecalcError] = useState(null)

  if (!activeTrip) return null

  const isPaused = activeTrip.isPaused || activeTrip.status === 'Paused'
  const isLiveGps = activeTrip.mode === 'live' || Boolean(activeTrip.isLiveGps)

  // Determine current GPS status label and styling
  let gpsStatusText = 'Inactive'
  let gpsToneColor = 'var(--muted)'
  const accuracy = userLocation?.accuracy || activeTrip.gpsAccuracy || null

  if (isLiveGps) {
    if (isTracking && userLocation) {
      if (accuracy && accuracy > 65) {
        gpsStatusText = `Poor Accuracy (±${accuracy}m)`
        gpsToneColor = 'var(--amber)'
      } else {
        gpsStatusText = `Tracking (±${accuracy || 15}m)`
        gpsToneColor = 'var(--accent)'
      }
    } else if (isTracking && !userLocation) {
      gpsStatusText = 'Waiting for GPS Fix...'
      gpsToneColor = 'var(--amber)'
    } else {
      gpsStatusText = 'GPS Ready (Click Start Tracking)'
      gpsToneColor = 'var(--muted)'
    }
  } else {
    gpsStatusText = 'Demo Simulation Active'
    gpsToneColor = 'var(--accent)'
  }

  // Next maneuver step extraction (if available from OSRM route steps)
  const steps = activeTrip.route?.steps || []
  let nextStep = null
  if (steps.length > 0) {
    // Find the next step based on journey progress fraction
    const stepIndex = Math.min(
      steps.length - 1,
      Math.floor(((activeTrip.progress || 0) / 100) * steps.length)
    )
    nextStep = steps[stepIndex]
  }

  // Handle route recalculation when deviated off-route
  const handleRecalculate = async () => {
    if (!onRecalculate) return
    setIsRecalculating(true)
    setRecalcError(null)
    try {
      const coords = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : activeTrip.currentPosition || activeTrip.route?.waypoints?.[0]
      await onRecalculate(coords)
    } catch (err) {
      setRecalcError(err.message || 'Route recalculation failed. Please ensure network connectivity.')
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <article
      role="region"
      className="panel panel-pad active-trip-tracker"
      style={{
        border: isLiveGps
          ? '1px solid rgba(45, 226, 176, 0.4)'
          : '1px solid rgba(45, 226, 176, 0.4)',
        background:
          'linear-gradient(135deg, rgba(45, 226, 176, 0.05) 0%, rgba(9, 13, 18, 0.95) 100%)',
        marginBottom: 16,
      }}
      aria-label="Active journey monitoring"
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isPaused
                ? 'rgba(255, 198, 109, 0.2)'
                : 'rgba(100, 226, 186, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isPaused ? 'var(--amber)' : 'var(--mint)',
              flexShrink: 0,
            }}
          >
            <Navigation size={18} />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>
                {activeTrip.start} → {activeTrip.end}
              </h3>
              <span
                className={`pill ${isPaused ? 'pill-quiet' : 'pill-accent'}`}
                style={{ fontSize: 9 }}
              >
                {isPaused ? 'PAUSED' : 'EN ROUTE'}
              </span>
            </div>
            <span className="muted" style={{ fontSize: 11 }}>
              {activeTrip.route?.name || 'Selected Corridor'} · {activeTrip.totalDistanceKm} km total
            </span>
          </div>
        </div>

        {/* Tracking Mode Badges & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            className={isLiveGps ? 'pill pill-accent' : 'badge-demo'}
          >
            {isLiveGps ? 'LIVE GPS NAVIGATION' : 'SIMULATED MOVEMENT (DEMO)'}
          </span>
          {onToggleMode && (
            <button
              type="button"
              className="btn btn-quiet"
              style={{ fontSize: 10, padding: '3px 8px', minHeight: 28 }}
              onClick={onToggleMode}
            >
              {isLiveGps ? 'Switch to Demo' : 'Switch to Live GPS'}
            </button>
          )}
        </div>
      </div>

      {/* Live GPS Status Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--line)',
          marginBottom: 14,
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: gpsToneColor,
              display: 'inline-block',
            }}
          />
          <span className="muted">GPS Status:</span>
          <strong style={{ color: gpsToneColor }}>{gpsStatusText}</strong>
        </div>

        {/* Live Tracking Controls */}
        {isLiveGps && (
          <div style={{ display: 'flex', gap: 6 }}>
            {isTracking ? (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={onStopTracking}
                style={{ fontSize: 10, padding: '2px 8px', minHeight: 26 }}
              >
                Stop GPS Tracking
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStartTracking}
                style={{ fontSize: 10, padding: '2px 8px', minHeight: 26 }}
              >
                Start Live Tracking
              </button>
            )}
          </div>
        )}
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
                ? 'var(--amber)'
                : 'linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Metric Dials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Remaining Dist</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {activeTrip.remainingKm} <span style={{ fontSize: 10, fontWeight: 400 }}>km</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Est. Time Left</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {activeTrip.remainingMins} <span style={{ fontSize: 10, fontWeight: 400 }}>mins</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '8px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <span className="muted" style={{ fontSize: 10 }}>Navigation State</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: isPaused ? 'var(--amber)' : 'var(--accent)', marginTop: 2 }}>
            {activeTrip.status}
          </div>
        </div>
      </div>

      {/* Next Road Maneuver Step Banner (from OSRM Steps) */}
      {nextStep && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(45, 226, 176, 0.06)',
            border: '1px solid rgba(45, 226, 176, 0.2)',
            marginBottom: 14,
            fontSize: 12,
          }}
        >
          <Compass size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div>
            <span className="muted" style={{ fontSize: 10, display: 'block' }}>
              Next Maneuver:
            </span>
            <strong>{nextStep.instruction}</strong>
            {nextStep.distanceMeters > 0 && (
              <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>
                ({nextStep.distanceMeters >= 1000
                  ? `${(nextStep.distanceMeters / 1000).toFixed(1)} km`
                  : `${nextStep.distanceMeters} m`})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Confirmed Off-Route Deviation Warning Alert */}
      {activeTrip.isOffRoute && (
        <div
          className="notice"
          role="alert"
          style={{
            marginBottom: 14,
            borderColor: 'var(--coral, #ff6b6b)',
            background: 'rgba(255, 107, 107, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--coral)" />
            <div>
              <strong style={{ color: 'var(--coral)', display: 'block', fontSize: 12 }}>
                Route Deviation Detected
              </strong>
              <span style={{ fontSize: 11 }}>
                You have deviated approximately ~{activeTrip.offRouteDistanceMeters || 60}m from the planned route.
              </span>
            </div>
          </div>

          {recalcError && (
            <span style={{ fontSize: 10, color: 'var(--coral)' }}>
              {recalcError}
            </span>
          )}

          {onRecalculate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              style={{
                fontSize: 11,
                alignSelf: 'flex-start',
                minHeight: 36,
                marginTop: 2,
              }}
            >
              {isRecalculating ? (
                <>
                  <Loader2 size={13} className="spin" /> Recalculating Route (OSRM)...
                </>
              ) : (
                <>
                  <RotateCw size={13} /> Recalculate Route from Current GPS
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Proactive Route Hazard Warning */}
      {activeTrip.warnings && activeTrip.warnings.length > 0 && !activeTrip.isOffRoute && (
        <div
          className="notice"
          role="alert"
          style={{
            marginBottom: 14,
            borderColor: 'var(--amber)',
            background: 'rgba(255, 198, 109, 0.08)',
          }}
        >
          <AlertTriangle size={15} color="var(--amber)" />
          <div>
            <strong style={{ display: 'block', fontSize: 11, color: 'var(--amber)' }}>
              ROUTE ADVISORY
            </strong>
            <span style={{ fontSize: 11 }}>{activeTrip.warnings[activeTrip.warnings.length - 1]}</span>
          </div>
        </div>
      )}

      {/* Control Actions (Touch targets >= 44px) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {isPaused ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onResume}
              style={{ fontSize: 12, minHeight: 44, padding: '0 16px' }}
            >
              <Play size={14} /> Resume Journey
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={onPause}
              style={{ fontSize: 12, minHeight: 44, padding: '0 16px' }}
            >
              <Pause size={14} /> Pause Journey
            </button>
          )}

          <button
            type="button"
            className="btn btn-quiet"
            onClick={onEnd}
            style={{ fontSize: 12, minHeight: 44, padding: '0 16px', color: 'var(--coral)' }}
          >
            <Square size={14} /> End Journey
          </button>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: 10, textAlign: 'right', flex: 1, minWidth: 200 }}>
          {isLiveGps
            ? 'Live GPS tracking active on device. Progress updates strictly from actual location fixes.'
            : 'Simulated journey progress for UI evaluation. No real-world GPS tracking or physical vehicle movement.'}
        </p>
      </div>
    </article>
  )
}

export default ActiveTripTracker
