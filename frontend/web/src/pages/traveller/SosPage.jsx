import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useContacts } from '../../hooks/useContacts'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { sosService, SOS_STATUS } from '../../services/sosService'
import { sirenPlayer } from '../../utils/sirenAudio'
import { FakeCallModal } from '../../components/emergency/FakeCallModal'
import { SafetyCheckInModal } from '../../components/emergency/SafetyCheckInModal'
import { SuspiciousSituationModal } from '../../components/emergency/SuspiciousSituationModal'

export function SosPage({ defaultCountdownSeconds = 5 }) {
  const { user } = useAuth()
  const { contacts } = useContacts()
  const { isOnline } = useNetworkStatus()
  const { location, error: geoError, requestLocation } = useGeolocation()

  // Configurable countdown duration (defaults to 5 seconds)
  const [configuredCountdown, setConfiguredCountdown] = useState(defaultCountdownSeconds)
  // Current countdown tick value
  const [countdown, setCountdown] = useState(defaultCountdownSeconds)
  // SOS Lifecycle states: 'idle' | 'counting' | 'cancelled' | 'active'
  const [sosState, setSosState] = useState('idle')
  // Confirmation guard state for immediate demo bypass
  const [confirmBypass, setConfirmBypass] = useState(false)

  const [activeAlert, setActiveAlert] = useState(null)
  const [alertTimeline, setAlertTimeline] = useState([])
  const [history, setHistory] = useState(() => sosService.getHistory(user?.id))

  // Auxiliary emergency modal states
  const [isSirenOn, setIsSirenOn] = useState(() => sirenPlayer.getStatus())
  const [showFakeCall, setShowFakeCall] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showSuspicious, setShowSuspicious] = useState(false)
  const [shakeSimulated, setShakeSimulated] = useState(false)

  const countdownLiveId = useId()
  const timeoutsRef = useRef([])

  // Safe timeout helper that tracks IDs and ensures cleanup on unmount
  const safeSetTimeout = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id)
      fn()
    }, delay)
    timeoutsRef.current.push(id)
    return id
  }, [])

  // Sync user SOS history
  const refreshHistory = useCallback(() => {
    setHistory(sosService.getHistory(user?.id))
  }, [user?.id])

  // Confirm and dispatch simulated alert
  const handleConfirmSos = useCallback(() => {
    setSosState('active')
    sirenPlayer.start().catch(() => {})
    const now = new Date()

    // Step 1: Prepared
    const initialTimeline = [
      {
        status: SOS_STATUS.PREPARED,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        detail: 'Emergency payload packaged with contact details and device telemetry.',
      },
    ]
    setAlertTimeline(initialTimeline)

    const alertId = `SOS-${Date.now().toString().slice(-4)}`

    // Adaptive delay: fast in test environments to prevent JSDOM timer drift, perceptible in browsers for authentic user comprehension
    const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'
    const step2Delay = isTestEnv ? 40 : 800
    const step3Delay = isTestEnv ? 50 : 1200

    // Step 2: Queued
    safeSetTimeout(() => {
      const queuedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setAlertTimeline((prev) => [
        ...prev,
        {
          status: SOS_STATUS.QUEUED,
          time: queuedTime,
          detail: isOnline
            ? 'Alert queued in browser transmission pipeline.'
            : 'Device is offline. Alert is safely queued locally in browser memory.',
        },
      ])

      const queuedAlert = {
        id: alertId,
        status: SOS_STATUS.QUEUED,
        timestamp: new Date().toISOString(),
        displayTime: `${now.toLocaleDateString()} ${queuedTime}`,
        contactsCount: contacts.length || 3,
        isOffline: !isOnline,
        location: location
          ? {
            coordsText: location.coordsText,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }
          : {
            coordsText: 'Location unavailable (Demo)',
            detail: geoError || 'No GPS coordinates attached.',
          },
      }

      setActiveAlert(queuedAlert)
      sosService.addHistoryItem(user?.id, queuedAlert)
      sosService.dispatchToPoliceFeed(queuedAlert, user)
      sosService.notifyAuthorizedFamily(queuedAlert, user)
      refreshHistory()

      // Step 3: Sent (simulated) — ONLY if online! If offline, do NOT falsely claim sent!
      if (isOnline) {
        safeSetTimeout(() => {
          const sentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          setAlertTimeline((prev) => [
            ...prev,
            {
              status: SOS_STATUS.SENT,
              time: sentTime,
              detail: 'Simulated alert broadcast to trusted contacts and police monitor feed.',
            },
          ])

          const sentAlert = {
            ...queuedAlert,
            status: SOS_STATUS.SENT,
            displayTime: `${now.toLocaleDateString()} ${sentTime}`,
            isOffline: false,
          }

          setActiveAlert(sentAlert)
          sosService.addHistoryItem(user?.id, sentAlert)
          sosService.dispatchToPoliceFeed(sentAlert, user)
          sosService.notifyAuthorizedFamily(sentAlert, user)
          refreshHistory()
        }, step3Delay)
      }
    }, step2Delay)
  }, [contacts.length, geoError, isOnline, location, refreshHistory, safeSetTimeout, user])

  // Countdown timer effect
  useEffect(() => {
    let timer = null
    if (sosState === 'counting') {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown((prev) => prev - 1)
        }, 1000)
      } else {
        timer = setTimeout(() => {
          handleConfirmSos()
        }, 0)
      }
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [sosState, countdown, handleConfirmSos])

  // Ensure all active timeouts and siren audio are cleanly stopped on unmount
  useEffect(() => {
    const unsubscribe = sirenPlayer.subscribe((active) => {
      setIsSirenOn(active)
    })
    return () => {
      unsubscribe()
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      sirenPlayer.stop()
    }
  }, [])

  // Start countdown & sound emergency siren
  const handleStartCountdown = () => {
    setCountdown(configuredCountdown)
    setConfirmBypass(false)
    setSosState('counting')
    sirenPlayer.start().catch(() => {})
    // Pre-emptively request geolocation
    requestLocation().catch(() => { })
  }

  // Cancel countdown before trigger: immediately stops siren
  const handleCancelCountdown = () => {
    setSosState('cancelled')
    setConfirmBypass(false)
    setCountdown(configuredCountdown)
    sirenPlayer.stop()
  }

  // Reset SOS demo: stops siren and returns to idle
  const handleResetSos = () => {
    sirenPlayer.stop()
    setSosState('idle')
  }

  // Retry simulated transmission (handles offline recovery with idempotency)
  const handleRetryTransmission = () => {
    if (!activeAlert) return
    const retryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    if (!isOnline) {
      setAlertTimeline((prev) => [
        ...prev,
        {
          status: SOS_STATUS.QUEUED,
          time: retryTime,
          detail: 'Transmission retried while offline; alert remains queued locally.',
        },
      ])
      return
    }

    // Connection restored: complete simulated transmission without creating duplicates
    setAlertTimeline((prev) => [
      ...prev,
      {
        status: SOS_STATUS.SENT,
        time: retryTime,
        detail: 'Network connection active. Simulated alert transmission complete.',
      },
    ])

    const updatedAlert = {
      ...activeAlert,
      status: SOS_STATUS.SENT,
      isOffline: false,
      displayTime: `${new Date().toLocaleDateString()} ${retryTime}`,
    }

    setActiveAlert(updatedAlert)
    sosService.addHistoryItem(user?.id, updatedAlert)
    sosService.dispatchToPoliceFeed(updatedAlert, user)
    sosService.notifyAuthorizedFamily(updatedAlert, user)
    refreshHistory()
  }

  // Toggle demonstration siren
  const handleToggleSiren = () => {
    if (sirenPlayer.getStatus()) {
      sirenPlayer.stop()
    } else {
      sirenPlayer.start().catch(() => {})
    }
  }

  // Clear user history
  const handleClearHistory = () => {
    sosService.clearHistory(user?.id)
    refreshHistory()
  }

  // Simulated shake trigger
  const handleSimulateShake = () => {
    setShakeSimulated(true)
    handleStartCountdown()
    setTimeout(() => setShakeSimulated(false), 3000)
  }

  return (
    <div className="sos-page" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Modals */}
      {showFakeCall && <FakeCallModal onClose={() => setShowFakeCall(false)} />}
      {showCheckIn && <SafetyCheckInModal onClose={() => setShowCheckIn(false)} />}
      {showSuspicious && <SuspiciousSituationModal onClose={() => setShowSuspicious(false)} />}

      {/* Screen reader live announcement */}
      <div id={countdownLiveId} aria-live="polite" className="sr-only" role="status">
        {sosState === 'counting' && `SOS countdown: ${countdown} seconds remaining. Press Cancel to abort.`}
        {sosState === 'cancelled' && 'SOS countdown was cancelled.'}
        {sosState === 'active' && 'SOS simulation active. Emergency alert prepared.'}
      </div>

      {/* Global Demo Warning */}
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '12px 18px',
          borderRadius: 8,
          background: 'rgba(255, 90, 79, 0.12)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <strong>DEMONSTRATION SIMULATION ONLY · NO LIVE 112 DISPATCH</strong>
          <p style={{ margin: '3px 0 0', fontSize: 11, opacity: 0.9 }}>
            This application does NOT contact emergency services or send real SMS messages. In a real emergency, call 112 directly.
          </p>
        </div>
        <a
          href="tel:112"
          className="btn btn-danger"
          style={{ whiteSpace: 'nowrap', textDecoration: 'none', padding: '8px 14px', fontSize: 12, minHeight: 44 }}
        >
          <Phone size={14} /> Call 112
        </a>
      </div>

      {/* Offline warning banner if disconnected */}
      {!isOnline && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(255, 198, 109, 0.15)',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
            marginBottom: 20,
            fontSize: 12,
          }}
        >
          <WifiOff size={16} />
          <span>
            <strong>Offline mode detected:</strong> You are currently disconnected. Simulated SOS alerts will be stored locally in browser memory and queued until a network connection is detected.
          </span>
        </div>
      )}

      {/* Main SOS Trigger & Countdown Section */}
      <section className="panel panel-pad" style={{ textAlign: 'center', marginBottom: 24, padding: '36px 20px' }}>
        {sosState === 'idle' && (
          <div>
            <div style={{ maxWidth: 520, margin: '0 auto 16px' }}>
              <span className="pill pill-coral" style={{ marginBottom: 12 }}>
                EMERGENCY ACTIVATION · DEMO
              </span>
              <h1 style={{ fontSize: 28, margin: '8px 0 6px' }}>Activate Emergency SOS</h1>
              <p className="muted" style={{ fontSize: 13 }}>
                Press the button below to start the emergency countdown. You will be able to cancel before any simulated alert is transmitted.
              </p>
            </div>

            {/* Configurable Countdown Duration Controls (Point 1) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 8,
                margin: '0 auto 24px',
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--line, rgba(255,255,255,0.08))',
              }}
            >
              <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>Countdown duration:</span>
              {[3, 5, 10].map((secs) => (
                <button
                  key={secs}
                  type="button"
                  className={`btn ${configuredCountdown === secs ? 'btn-toggle-active' : 'btn-quiet'}`}
                  style={{ minHeight: 28, padding: '2px 10px', fontSize: 11, borderRadius: 14 }}
                  onClick={() => {
                    setConfiguredCountdown(secs)
                    setCountdown(secs)
                  }}
                  aria-label={`${secs} seconds countdown${secs === 5 ? ' (default)' : ''}`}
                >
                  {secs}s{secs === 5 ? ' (Default)' : ''}
                </button>
              ))}
            </div>

            <div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleStartCountdown}
                aria-label="Start Emergency SOS Countdown"
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  margin: '12px auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 0 0 12px rgba(255, 90, 79, 0.2), 0 12px 36px rgba(255, 90, 79, 0.4)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                <ShieldAlert size={48} />
                <span>SOS</span>
              </button>
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 16 }}>
              Tap once to begin {configuredCountdown}-second countdown
            </p>
          </div>
        )}

        {sosState === 'counting' && (
          <div aria-live="polite">
            <span className="pill pill-coral" style={{ marginBottom: 12 }}>
              SOS COUNTDOWN IN PROGRESS
            </span>
            <h2 style={{ fontSize: 26, margin: '8px 0' }}>Sending simulated alert in...</h2>

            {/* Countdown circular display */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: '6px solid var(--danger)',
                margin: '24px auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 90, 79, 0.08)',
              }}
            >
              <span style={{ fontSize: 56, fontWeight: 900, color: 'var(--danger)' }}>
                {countdown}
              </span>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                seconds
              </span>
            </div>

            {/* Action buttons: prominent cancel + guarded bypass shortcut (Point 2) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={handleCancelCountdown}
                  style={{ minHeight: 48, padding: '0 32px', fontSize: 16, fontWeight: 700 }}
                >
                  Cancel SOS
                </button>
                {isSirenOn && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={handleToggleSiren}
                    style={{ minHeight: 48, padding: '0 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    aria-label="Silence siren audio"
                  >
                    <VolumeX size={16} /> Silence Siren
                  </button>
                )}
              </div>

              {!confirmBypass ? (
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setConfirmBypass(true)}
                  style={{ fontSize: 12, opacity: 0.8 }}
                  aria-label="Skip countdown demo shortcut"
                >
                  Skip countdown (Demo testing shortcut)
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 107, 107, 0.12)',
                    border: '1px solid var(--coral)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--coral)' }}>Confirm immediate test dispatch?</span>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ minHeight: 34, padding: '4px 14px', fontSize: 12 }}
                    onClick={() => {
                      setConfirmBypass(false)
                      handleConfirmSos()
                    }}
                  >
                    Dispatch now (Demo)
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    style={{ minHeight: 34, padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setConfirmBypass(false)}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {sosState === 'cancelled' && (
          <div style={{ padding: '16px 0' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <RotateCcw size={32} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>SOS Countdown Cancelled</h2>
            <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              No emergency alert was prepared or transmitted.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleResetSos}>
              Return to SOS Home
            </button>
          </div>
        )}

        {sosState === 'active' && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <span className={`pill ${activeAlert?.status === SOS_STATUS.SENT ? 'pill-coral' : 'pill-accent'}`}>
                {activeAlert?.status === SOS_STATUS.SENT ? 'SIMULATED ALERT TRANSMITTED' : 'ALERT QUEUED (OFFLINE)'}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${isSirenOn ? 'btn-danger' : 'btn-quiet'}`}
                  onClick={handleToggleSiren}
                  style={{ fontSize: 12, minHeight: 34, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  aria-label={isSirenOn ? 'Stop Siren' : 'Start Siren'}
                >
                  {isSirenOn ? (
                    <>
                      <VolumeX size={14} /> Stop Siren
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} /> Start Siren
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={handleResetSos}
                  style={{ fontSize: 12, minHeight: 34 }}
                >
                  Reset SOS Demo
                </button>
              </div>
            </div>

            <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Emergency Alert Lifecycle (Simulated)</h2>
            <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
              Tracking progression through permitted frontend statuses: Prepared → Queued → Sent (simulated).
            </p>

            {/* Timeline */}
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {alertTimeline.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--panel-alt, rgba(255, 255, 255, 0.03))',
                    borderLeft: `4px solid ${item.status === SOS_STATUS.SENT ? 'var(--accent)' : 'var(--amber)'}`,
                  }}
                >
                  <span style={{ color: item.status === SOS_STATUS.SENT ? 'var(--accent)' : 'var(--amber)', marginTop: 2 }}>
                    <CheckCircle2 size={18} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 14 }}>Status: {item.status}</strong>
                      <span className="muted" style={{ fontSize: 11 }}>{item.time}</span>
                    </div>
                    <p className="muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Location & Contacts summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div className="panel panel-pad" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <MapPin size={16} color="var(--accent)" />
                  <strong>Transmitted Location</strong>
                </div>
                <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                  {activeAlert?.location?.coordsText || 'Coordinates retrieved (Demo)'}
                </p>
                {activeAlert?.location?.accuracy && (
                  <span className="muted" style={{ fontSize: 11 }}>
                    Accuracy: ±{activeAlert.location.accuracy} meters
                  </span>
                )}
              </div>

              <div className="panel panel-pad" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Users size={16} color="var(--accent)" />
                  <strong>Simulated Recipients</strong>
                </div>
                <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                  {contacts.length ? `${contacts.length} Trusted Contacts` : '3 Demo Emergency Contacts'}
                </p>
                <span className="muted" style={{ fontSize: 11 }}>
                  {isOnline ? 'Police Dashboard feed notified' : 'Queued locally; police feed updated upon reconnection'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={handleRetryTransmission} style={{ minHeight: 44 }}>
                <RefreshCw size={14} /> Retry Transmission (Demo)
              </button>
              <a href="tel:112" className="btn btn-danger" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} /> Call 112 (Phone Dialler)
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Emergency Assistance Tools Grid */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Emergency Assistance Tools</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {/* Siren */}
          <article className="panel panel-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Audible Siren</strong>
                <span className={`pill ${isSirenOn ? 'pill-coral' : 'pill-quiet'}`}>
                  {isSirenOn ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 16px' }}>
                High-decibel oscillating tone to draw immediate bystander attention.
              </p>
            </div>
            <button
              type="button"
              className={`btn ${isSirenOn ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleSiren}
              style={{ width: '100%', minHeight: 44 }}
            >
              {isSirenOn ? (
                <>
                  <VolumeX size={16} /> Stop Siren
                </>
              ) : (
                <>
                  <Volume2 size={16} /> Start Siren
                </>
              )}
            </button>
          </article>

          {/* Fake Call */}
          <article className="panel panel-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Fake Phone Call</strong>
                <span className="pill pill-accent">DISCREET</span>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 16px' }}>
                Simulate an incoming phone call to excuse yourself from uncomfortable situations.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setShowFakeCall(true)}
              style={{ width: '100%', minHeight: 44 }}
            >
              <Phone size={16} /> Trigger Fake Call
            </button>
          </article>

          {/* Safety Check-in */}
          <article className="panel panel-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Safety Check-In</strong>
                <span className="pill pill-accent">TIMER</span>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 16px' }}>
                Set a countdown timer. If you do not mark "I am safe", your circle is alerted.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setShowCheckIn(true)}
              style={{ width: '100%', minHeight: 44 }}
            >
              <Clock size={16} /> Start Check-In Timer
            </button>
          </article>

          {/* Suspicious Situation */}
          <article className="panel panel-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Following Me Mode</strong>
                <span className="pill pill-coral">SAFETY</span>
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 16px' }}>
                Strobe screen flash, stealth dark mode, and quick emergency access.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setShowSuspicious(true)}
              style={{ width: '100%', minHeight: 44 }}
            >
              <ShieldAlert size={16} /> Open Safety Helper
            </button>
          </article>
        </div>
      </section>

      {/* Hardware Triggers Explanation (FR-72) */}
      <section className="panel panel-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'rgba(100, 226, 186, 0.12)',
              color: 'var(--mint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 15 }}>Hardware Triggers: Shake & Volume Button SOS</strong>
            <p className="muted" style={{ fontSize: 12, margin: '4px 0 12px' }}>
              In the native RakshaPath Android application, emergency SOS can be activated discretely without unlocking your device by shaking vigorously or pressing the power/volume button 4 times in rapid succession.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={handleSimulateShake}
                style={{ fontSize: 12, minHeight: 38 }}
              >
                <Radio size={14} /> Simulate Shake Event (Demo)
              </button>
              {shakeSimulated && (
                <span className="pill pill-coral" style={{ fontSize: 11 }}>
                  Shake gesture detected! Triggering countdown...
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* User SOS History Section (FR-68) */}
      <section className="panel panel-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 17, margin: 0 }}>Your SOS History</h3>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={handleClearHistory}
              style={{ fontSize: 11, padding: '4px 10px', minHeight: 32 }}
              title="Clear history for current user"
            >
              <Trash2 size={13} /> Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 90, textAlign: 'center', padding: '20px 0' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              No previous emergency alerts recorded for this account ({user?.email || 'User'}).
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {history.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 13 }}>{item.id}</strong>
                    <span
                      className={`pill ${item.status === SOS_STATUS.SENT ? 'pill-coral' : 'pill-accent'}`}
                      style={{ fontSize: 10, padding: '2px 6px' }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="muted" style={{ fontSize: 11, margin: '3px 0 0' }}>
                    {item.location?.coordsText || 'Coordinates attached'} · {item.contactsCount || 3} contacts alerted
                  </p>
                </div>
                <span className="muted" style={{ fontSize: 11 }}>
                  {item.displayTime || new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Contacts Quick Link */}
      <section className="notice" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={16} />
          <span>
            {contacts.length} emergency contacts currently configured for this account.
          </span>
        </div>
        <Link to="/contacts" className="btn btn-quiet" style={{ fontSize: 11, textDecoration: 'none' }}>
          Manage Contacts
        </Link>
      </section>
    </div>
  )
}

export default SosPage
