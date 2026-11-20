import { useEffect, useState } from 'react'
import {
  Clock3,
  Copy,
  HeartHandshake,
  Link as LinkIcon,
  Phone,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import useUserStorage from '../../hooks/useUserStorage'
import { useContacts } from '../../hooks/useContacts'
import PageHeader from '../../components/PageHeader'
import tripService from '../../services/tripService'
import storageService from '../../services/storageService'

function FamilySharing() {
  const { user } = useAuth()
  const isFamilyRole = user?.role === 'Family'

  const [preferences, setPreferences] = useUserStorage('preferences', {
    notifications: true,
    safetyAlerts: true,
    tripReminders: true,
    locationSharing: false,
    privacyMode: true,
  })
  const { contacts, removeContact, addContact: saveContact, isMaxReached, maxContacts } = useContacts()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', relationship: '', phone: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Sharing configuration & tokens
  const [shareConfig, setShareConfig] = useUserStorage('family_share_config', {
    isSharing: false,
    activeToken: null,
    expiresAt: null,
    durationHours: 6,
    privacyMode: true,
  })
  const [selectedDuration, setSelectedDuration] = useState(6)
  const [trackedToken, setTrackedToken] = useUserStorage('family_tracked_token', '')
  const [inputToken, setInputToken] = useState(() => (isFamilyRole ? trackedToken : ''))
  const [copied, setCopied] = useState(false)
  const [activeSharedPayload, setActiveSharedPayload] = useState(() => {
    const tokenToLoad = isFamilyRole
      ? (trackedToken || (user?.id ? storageService.get(`rakshapath:${user.id}:family_tracked_token`, '') : ''))
      : shareConfig.activeToken
    return tokenToLoad ? tripService.getSharedTripByToken(tokenToLoad) : null
  })

  const sharingEnabled = Boolean(preferences.locationSharing || shareConfig.isSharing)

  // Load and refresh shared telemetry in real time
  useEffect(() => {
    const handleUpdate = () => {
      const currentToken = isFamilyRole
        ? trackedToken || inputToken || null
        : shareConfig.activeToken
      if (currentToken) {
        setActiveSharedPayload(tripService.getSharedTripByToken(currentToken))
      } else {
        setActiveSharedPayload(null)
      }
    }

    window.addEventListener('rakshapath:family_share_updated', handleUpdate)
    window.addEventListener('rakshapath:family_alert_updated', handleUpdate)
    window.addEventListener('rakshapath:trip_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('rakshapath:family_share_updated', handleUpdate)
      window.removeEventListener('rakshapath:family_alert_updated', handleUpdate)
      window.removeEventListener('rakshapath:trip_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [shareConfig.activeToken, inputToken, trackedToken, isFamilyRole])

  const handleTrackToken = (tokenToTrack = inputToken) => {
    const trimmed = (tokenToTrack || '').trim()
    if (!trimmed) return
    setTrackedToken(trimmed)
    tripService.registerFamilySubscriber(trimmed, user?.id)
    const payload = tripService.getSharedTripByToken(trimmed)
    setActiveSharedPayload(payload)
  }

  const handleGenerateShareToken = () => {
    setError('')
    try {
      const payload = tripService.generateShareToken(user?.id, {
        durationHours: Number(selectedDuration) || 6,
        travellerName: user?.name || 'Demo Traveller',
        privacyMode: Boolean(preferences.privacyMode),
      })
      setShareConfig({
        isSharing: true,
        activeToken: payload.token,
        expiresAt: payload.expiresAt,
        durationHours: selectedDuration,
        privacyMode: preferences.privacyMode,
      })
      setActiveSharedPayload(payload)
      setMessage(`Demo share token generated (active for ${selectedDuration} hours).`)
    } catch (err) {
      setError(err.message || 'Could not generate share token.')
    }
  }

  const handleRevokeSharing = () => {
    tripService.revokeShareToken(user?.id, shareConfig.activeToken)
    setShareConfig({
      isSharing: false,
      activeToken: null,
      expiresAt: null,
      durationHours: 6,
      privacyMode: preferences.privacyMode,
    })
    setActiveSharedPayload(null)
    setMessage('Sharing has been revoked immediately.')
  }

  const handleSimulateMissedUpdate = () => {
    if (shareConfig.activeToken) {
      const updated = tripService.simulateMissedUpdate(shareConfig.activeToken)
      setActiveSharedPayload(updated)
      setMessage('Simulated 15-minute missed update condition.')
    }
  }

  const handleCopyToken = () => {
    if (shareConfig.activeToken && navigator.clipboard) {
      navigator.clipboard.writeText(shareConfig.activeToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleSharing = () => {
    const nextState = !preferences.locationSharing
    setPreferences((current) => ({
      ...current,
      locationSharing: nextState,
    }))
    if (!nextState && shareConfig.activeToken) {
      handleRevokeSharing()
    }
    setMessage('Preference saved in this browser.')
  }

  const addContact = (event) => {
    event.preventDefault()
    setError('')
    const result = saveContact({
      name: form.name,
      relationship: form.relationship,
      phone: form.phone,
      requirePhone: false,
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    setForm({ name: '', relationship: '', phone: '' })
    setShowForm(false)
    setError('')
  }

  return (
    <>
      <PageHeader
        eyebrow={isFamilyRole ? 'Family View' : 'Together, from anywhere'}
        title="Family sharing"
        description={
          isFamilyRole
            ? 'Monitor shared journey progress and safety status.'
            : 'Manage your trusted circle and share demonstration journey tracking.'
        }
        action={
          !isFamilyRole && (
            <button
              className="btn btn-primary"
              type="button"
              disabled={isMaxReached}
              onClick={() => {
                setError('')
                setShowForm((open) => !open)
              }}
            >
              <Plus size={15} /> Add family member
            </button>
          )
        }
      />

      {/* Role 1: Dedicated Family Monitoring View */}
      {isFamilyRole ? (
        <section className="grid main-split">
          <article className="panel panel-pad" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, margin: 0 }}>Shared Journey Monitor</h2>
                <span className="muted" style={{ fontSize: 11 }}>
                  Live demonstration telemetry from your traveller.
                </span>
              </div>
              <span className="badge-demo">
                SIMULATED FAMILY TRACKING
              </span>
            </div>

            {/* Token entry if none loaded */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Enter demo share token (e.g. SHR-...)"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.trim())}
                style={{ flex: '1 1 200px', minWidth: 0, fontSize: 12 }}
                aria-label="Share token input"
              />
              <button
                type="button"
                className="btn btn-quiet"
                style={{ minHeight: 44, padding: '0 16px' }}
                onClick={() => handleTrackToken(inputToken)}
              >
                Track
              </button>
            </div>

            {/* High-Priority Emergency Alert Banner on Family Dashboard */}
            {activeSharedPayload?.activeSosAlert && !activeSharedPayload.isRevoked && !activeSharedPayload.isExpired && (
              <div
                className="panel"
                role="alert"
                aria-live="assertive"
                style={{
                  padding: '16px',
                  marginBottom: 16,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(255, 90, 79, 0.14) 0%, rgba(217, 37, 37, 0.05) 100%)',
                  border: '1px solid var(--danger)',
                  boxShadow: '0 4px 20px rgba(255, 90, 79, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255, 90, 79, 0.2)', color: 'var(--danger)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: 'var(--danger)', letterSpacing: '0.02em' }}>
                        ACTIVE EMERGENCY SOS ALERT
                      </strong>
                      <span className="muted" style={{ fontSize: 11 }}>
                        Dispatched by {activeSharedPayload.travellerName} · Demo Mode
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span
                      className={`pill ${activeSharedPayload.activeSosAlert.status === 'Queued' ? 'pill-amber' : 'pill-coral'}`}
                      style={{ fontSize: 10, fontWeight: 700 }}
                    >
                      {activeSharedPayload.activeSosAlert.status}
                    </span>
                    {activeSharedPayload.activeSosAlert.policeStatus && (
                      <span className="pill pill-accent" style={{ fontSize: 10 }}>
                        Police: {activeSharedPayload.activeSosAlert.policeStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 8 }}>
                    <div>
                      <span className="muted" style={{ fontSize: 10, display: 'block' }}>ALERT TYPE</span>
                      <strong>{activeSharedPayload.activeSosAlert.alertType || 'Emergency SOS'}</strong>
                    </div>
                    <div>
                      <span className="muted" style={{ fontSize: 10, display: 'block' }}>TRIGGERED AT</span>
                      <span>{activeSharedPayload.activeSosAlert.displayTime || new Date(activeSharedPayload.activeSosAlert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <span className="muted" style={{ fontSize: 10, display: 'block' }}>CONNECTION</span>
                      <span>{activeSharedPayload.activeSosAlert.isOffline ? 'Offline (Queued)' : 'Online broadcast (simulated)'}</span>
                    </div>
                  </div>

                  {activeSharedPayload.activeSosAlert.location?.coordsText && (
                    <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 8 }}>
                      <span className="muted" style={{ fontSize: 10, display: 'block' }}>REPORTED LOCATION</span>
                      <strong style={{ color: 'var(--text)', wordBreak: 'break-word' }}>
                        {activeSharedPayload.activeSosAlert.location.coordsText}
                      </strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    <a
                      href="tel:112"
                      className="btn btn-danger"
                      style={{ flex: '1 1 180px', minHeight: 44, textDecoration: 'none' }}
                    >
                      <Phone size={14} style={{ marginRight: 6 }} /> Emergency Helpline (112)
                    </a>
                  </div>
                </div>
              </div>
            )}

            {!activeSharedPayload || activeSharedPayload.notFound ? (
              <div className="empty-state">
                <HeartHandshake size={23} />
                <strong>No shared journey active</strong>
                <span>Enter a valid demonstration share token to view live trip progress.</span>
              </div>
            ) : activeSharedPayload.isRevoked || activeSharedPayload.isExpired ? (
              <div
                className="notice"
                role="alert"
                style={{ borderColor: 'var(--danger)', background: 'rgba(255, 90, 79, 0.08)' }}
              >
                <XCircle size={16} color="var(--danger)" />
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--danger)' }}>
                    Sharing Link {activeSharedPayload.isRevoked ? 'Revoked' : 'Expired'}
                  </strong>
                  <span style={{ fontSize: 11 }}>
                    Sharing link is expired or has been revoked by the traveller. No active journey telemetry or emergency data is available.
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {/* Missed Update Warning State */}
                {activeSharedPayload.isMissedUpdate && (
                  <div
                    className="notice"
                    role="status"
                    style={{
                      borderColor: 'var(--amber)',
                      background: 'rgba(255, 198, 109, 0.08)',
                    }}
                  >
                    <Clock3 size={15} color="var(--amber)" />
                    <div>
                      <strong style={{ display: 'block', fontSize: 11, color: 'var(--amber)' }}>
                        Calm Status Advisory
                      </strong>
                      <span style={{ fontSize: 11 }}>
                        No update received in 15 minutes. Note: A missed update is not automatically treated as an emergency.
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="row-card"
                  style={{
                    padding: '14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="muted" style={{ fontSize: 10 }}>TRAVELLER</span>
                      <strong style={{ display: 'block', fontSize: 15 }}>{activeSharedPayload.travellerName}</strong>
                    </div>
                    <span className="pill pill-accent">{activeSharedPayload.status}</span>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {activeSharedPayload.start} → {activeSharedPayload.end}
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>
                    Route: {activeSharedPayload.routeName}
                  </span>

                  {/* Progress bar */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                      <span className="muted">Simulated Progress</span>
                      <strong style={{ color: 'var(--accent)' }}>{activeSharedPayload.progress}%</strong>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={activeSharedPayload.progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      style={{
                        height: 6,
                        width: '100%',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${activeSharedPayload.progress}%`,
                          background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>
                    <span>Remaining: {activeSharedPayload.remainingKm} km · {activeSharedPayload.remainingMins} mins</span>
                    <span>Last updated: {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(activeSharedPayload.lastUpdated))}</span>
                  </div>
                </div>

                <p className="muted" style={{ fontSize: 10, margin: 0 }}>
                  Simulated local demonstration link. Valid only within this browser session.
                </p>
              </div>
            )}
          </article>

          <div className="grid" style={{ alignContent: 'start', gap: 14 }}>
            {/* Dedicated Emergency Alert Status Panel in Right Column */}
            <article className="panel panel-pad">
              <div className="panel-head">
                <div>
                  <h2 style={{ fontSize: 15 }}>Emergency Alert Center</h2>
                  <p>Real-time distress monitoring for linked traveller.</p>
                </div>
                {activeSharedPayload?.activeSosAlert && !activeSharedPayload.isRevoked && !activeSharedPayload.isExpired ? (
                  <ShieldAlert size={19} color="var(--coral)" />
                ) : (
                  <ShieldCheck size={19} color="var(--accent)" />
                )}
              </div>

              {!activeSharedPayload || activeSharedPayload.notFound ? (
                <div className="empty-state" style={{ padding: '24px 12px' }}>
                  <ShieldCheck size={26} color="var(--muted)" />
                  <strong>No Linked Traveller</strong>
                  <span className="muted" style={{ fontSize: 11 }}>
                    Enter a valid share token from your traveller to monitor emergency distress status.
                  </span>
                </div>
              ) : activeSharedPayload.isRevoked || activeSharedPayload.isExpired ? (
                <div
                  className="notice"
                  role="alert"
                  style={{ borderColor: 'var(--coral)', background: 'rgba(255, 107, 107, 0.08)' }}
                >
                  <XCircle size={16} color="var(--coral)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: 12, color: 'var(--coral)' }}>
                      Telemetry Suppressed
                    </strong>
                    <span style={{ fontSize: 11 }}>
                      The traveller has revoked sharing or the token has expired. All location and emergency telemetry are strictly suppressed.
                    </span>
                  </div>
                </div>
              ) : activeSharedPayload.activeSosAlert ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255, 107, 107, 0.08)', border: '1px solid var(--coral)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="pill pill-coral" style={{ fontSize: 9 }}>DISTRESS ACTIVE</span>
                      <span className="muted" style={{ fontSize: 10 }}>{activeSharedPayload.activeSosAlert.status}</span>
                    </div>
                    <strong style={{ color: 'var(--coral)', fontSize: 13, display: 'block' }}>
                      {activeSharedPayload.travellerName} has requested emergency assistance.
                    </strong>
                    <span className="muted" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      Time: {activeSharedPayload.activeSosAlert.displayTime || new Date(activeSharedPayload.activeSosAlert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <a href="tel:112" className="btn btn-danger" style={{ minHeight: 44, textDecoration: 'none' }}>
                    <Phone size={14} style={{ marginRight: 6 }} /> Call Emergency Helpline (112)
                  </a>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px 12px' }}>
                  <ShieldCheck size={26} color="var(--accent)" />
                  <strong style={{ color: 'var(--accent)' }}>No Active Emergency Alerts</strong>
                  <span className="muted" style={{ fontSize: 11 }}>
                    {activeSharedPayload.travellerName} is travelling safely. Any confirmed SOS or distress alert will immediately appear here.
                  </span>
                </div>
              )}
            </article>

            <article className="panel panel-pad">
              <div className="panel-head">
                <div>
                  <h2>Privacy & Safety Notice</h2>
                  <p>Family members see only explicitly shared journey telemetry.</p>
                </div>
                <ShieldCheck size={19} color="var(--accent)" />
              </div>
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                This is a privacy-first demonstration. Passwords, emergency contact numbers, login credentials, and unrelated private trips are never exposed to family viewers.
              </p>
            </article>
          </div>
        </section>
      ) : (
        /* Role 2: Traveller Sharing Configuration View */
        <section className="grid main-split">
          <article className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Your trusted circle</h2>
                <p>Family and friends associated with your demo account.</p>
              </div>
              <span className="pill">
                <Users size={13} /> {contacts.length} / {maxContacts} people
              </span>
            </div>
            {!contacts.length ? (
              <div className="empty-state">
                <HeartHandshake size={23} />
                <strong>Your circle is ready to grow</strong>
                <span>Add someone you’d like to include.</span>
                <a href="/contacts" className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }}>
                  Add contact
                </a>
              </div>
            ) : (
              <div>
                {contacts.map((contact) => (
                  <div className="row-card" key={contact.id}>
                    <span className="row-icon">
                      <HeartHandshake size={17} />
                    </span>
                    <span className="row-main">
                      <strong>{contact.name}</strong>
                      <span>
                        {contact.relationship} {contact.phone ? `· ${contact.phone}` : ''}
                      </span>
                    </span>
                    <button
                      className="icon-btn"
                      type="button"
                      aria-label={`Remove ${contact.name}`}
                      title="Remove from trusted circle"
                      onClick={() => removeContact(contact.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Right column: Sharing token generator & preference */}
          <div className="grid" style={{ alignContent: 'start', gap: 14 }}>
            <article className="panel panel-pad">
              <div className="panel-head">
                <div>
                  <h2>Journey Sharing Link</h2>
                  <p>Generate a controlled demonstration link.</p>
                </div>
                <span className="badge-demo">DEMO SHARE LINK</span>
              </div>

              {shareConfig.isSharing && shareConfig.activeToken ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(100, 226, 186, 0.05)',
                      border: '1px solid rgba(100, 226, 186, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="muted" style={{ fontSize: 10 }}>ACTIVE SHARE TOKEN</span>
                      <span className="pill pill-accent" style={{ fontSize: 9 }}>ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                        {shareConfig.activeToken}
                      </code>
                      <button
                        type="button"
                        className="btn btn-quiet"
                        style={{ fontSize: 10, padding: '2px 8px', minHeight: 26 }}
                        onClick={handleCopyToken}
                        title="Copy token to clipboard"
                        aria-label="Copy token"
                      >
                        <Copy size={11} /> {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="muted" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
                      Expires:{' '}
                      {new Intl.DateTimeFormat(undefined, {
                        hour: 'numeric',
                        minute: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(shareConfig.expiresAt))}
                    </span>
                  </div>

                  {/* Actions: Revoke & Test Missed Update */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      style={{ fontSize: 11, minHeight: 32, color: 'var(--coral)' }}
                      onClick={handleRevokeSharing}
                    >
                      <XCircle size={13} /> Revoke Sharing
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      style={{ fontSize: 11, minHeight: 32 }}
                      onClick={handleSimulateMissedUpdate}
                    >
                      <Clock3 size={13} /> Test Missed Update
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <label htmlFor="duration-select" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Link Expiration Duration
                    </label>
                    <select
                      id="duration-select"
                      className="input"
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                      style={{ fontSize: 12, background: 'var(--panel)', color: 'inherit' }}
                    >
                      <option value={2}>2 Hours</option>
                      <option value={6}>6 Hours (Default)</option>
                      <option value={24}>24 Hours</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleGenerateShareToken}
                    style={{ fontSize: 12, minHeight: 36, marginTop: 4 }}
                  >
                    <LinkIcon size={13} /> Generate Demo Share Link
                  </button>
                </div>
              )}

              {message && (
                <p role="status" className="muted" style={{ fontSize: 10, marginTop: 8 }}>
                  {message}
                </p>
              )}

              <p className="muted" style={{ fontSize: 10, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                Simulated local demonstration link. Valid only within this browser session.
              </p>
            </article>

            <article className="panel panel-pad">
              <div className="panel-head">
                <div>
                  <h2>Location sharing preference</h2>
                  <p>Opt-in toggle saved for this user profile.</p>
                </div>
                <ShieldCheck size={19} color="var(--accent)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 12 }}>
                    {sharingEnabled ? 'Sharing preference enabled' : 'Sharing preference paused'}
                  </strong>
                  <span className="muted" style={{ display: 'block', marginTop: 3, fontSize: 10 }}>
                    Does not share real-time GPS location.
                  </span>
                </div>
                <button
                  className={`btn ${sharingEnabled ? 'btn-primary' : ''}`}
                  type="button"
                  role="switch"
                  aria-checked={sharingEnabled}
                  onClick={toggleSharing}
                >
                  {sharingEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </article>
          </div>
        </section>
      )}
      {showForm && (
        <form className="panel panel-pad" style={{ marginTop: 16 }} onSubmit={addContact}>
          <div className="panel-head">
            <div>
              <h2>Add a trusted person</h2>
              <p>This contact also appears under Emergency Contacts.</p>
            </div>
            <button className="btn btn-quiet" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="family-name">Name</label>
              <input
                className="input"
                id="family-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="family-relation">Relationship</label>
              <input
                className="input"
                id="family-relation"
                value={form.relationship}
                onChange={(event) => setForm({ ...form, relationship: event.target.value })}
                placeholder="Parent, friend..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="family-phone">Phone (optional)</label>
              <input
                className="input"
                id="family-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>
          {error && (
            <p role="alert" style={{ color: 'var(--coral)', fontSize: 11, marginTop: 10 }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" style={{ marginTop: 14 }}>
            Save person <Plus size={14} />
          </button>
        </form>
      )}
    </>
  )
}

export default FamilySharing
