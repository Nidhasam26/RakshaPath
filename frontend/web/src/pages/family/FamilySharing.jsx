import { useEffect, useState } from 'react'
import {
  Clock3,
  Copy,
  HeartHandshake,
  Link as LinkIcon,
  Plus,
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
  const [inputToken, setInputToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeSharedPayload, setActiveSharedPayload] = useState(() => {
    const tokenToLoad = isFamilyRole
      ? null
      : shareConfig.activeToken
    return tokenToLoad ? tripService.getSharedTripByToken(tokenToLoad) : null
  })

  const sharingEnabled = Boolean(preferences.locationSharing || shareConfig.isSharing)

  // Load and refresh shared telemetry
  useEffect(() => {
    const handleUpdate = () => {
      const currentToken = isFamilyRole
        ? inputToken || null
        : shareConfig.activeToken
      if (currentToken) {
        setActiveSharedPayload(tripService.getSharedTripByToken(currentToken))
      } else {
        setActiveSharedPayload(null)
      }
    }

    window.addEventListener('rakshapath:family_share_updated', handleUpdate)
    window.addEventListener('rakshapath:trip_updated', handleUpdate)

    return () => {
      window.removeEventListener('rakshapath:family_share_updated', handleUpdate)
      window.removeEventListener('rakshapath:trip_updated', handleUpdate)
    }
  }, [shareConfig.activeToken, inputToken, isFamilyRole])

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
              <span className="pill pill-lime" style={{ fontSize: 10 }}>
                SIMULATED FAMILY TRACKING
              </span>
            </div>

            {/* Token entry if none loaded */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Enter demo share token (e.g. SHR-...)"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.trim())}
                style={{ fontSize: 12 }}
              />
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  if (inputToken) {
                    setActiveSharedPayload(tripService.getSharedTripByToken(inputToken))
                  }
                }}
              >
                Track
              </button>
            </div>

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
                style={{ borderColor: 'var(--coral)', background: 'rgba(255, 107, 107, 0.08)' }}
              >
                <XCircle size={16} color="var(--coral)" />
                <div>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--coral)' }}>
                    Sharing Link {activeSharedPayload.isRevoked ? 'Revoked' : 'Expired'}
                  </strong>
                  <span style={{ fontSize: 11 }}>
                    Sharing link is expired or has been revoked by the traveller. No active journey telemetry is available.
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
                      borderColor: 'var(--amber, #ffc66d)',
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
                    <span className="pill pill-mint">{activeSharedPayload.status}</span>
                  </div>

                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>
                    {activeSharedPayload.start} → {activeSharedPayload.end}
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>
                    Route: {activeSharedPayload.routeName}
                  </span>

                  {/* Progress bar */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                      <span className="muted">Simulated Progress</span>
                      <strong style={{ color: 'var(--mint)' }}>{activeSharedPayload.progress}%</strong>
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
                          background: 'linear-gradient(90deg, #64e2ba 0%, #c6f36a 100%)',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>
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

          <div className="grid" style={{ alignContent: 'start' }}>
            <article className="panel panel-pad">
              <div className="panel-head">
                <div>
                  <h2>Privacy & Safety Notice</h2>
                  <p>Family members see only explicitly shared journey telemetry.</p>
                </div>
                <ShieldCheck size={19} color="var(--mint)" />
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
                <span className="pill pill-lime" style={{ fontSize: 9 }}>DEMO SHARE LINK</span>
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
                      <span className="pill pill-mint" style={{ fontSize: 9 }}>ACTIVE</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--mint)' }}>
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
                    className="btn btn-primary"
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
                <ShieldCheck size={19} color="var(--lime)" />
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
