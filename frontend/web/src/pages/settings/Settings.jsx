import { useEffect, useState } from 'react'
import { Bell, Check, Info, LockKeyhole, Moon, Save, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import useUserStorage from '../../hooks/useUserStorage'
import PageHeader from '../../components/PageHeader'

function Preference({ label, detail, checked, onChange }) {
  return (
    <div className="row-card" style={{ justifyContent: 'space-between' }}>
      <span className="row-main">
        <strong>{label}</strong>
        <span>{detail}</span>
      </span>
      <button
        type="button"
        className={`btn-switch ${checked ? 'active' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
      >
        <span className="switch-thumb" />
        <span className="switch-label">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}

function Settings() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [preferences, setPreferences] = useUserStorage('preferences', {
    notifications: true,
    safetyAlerts: true,
    tripReminders: true,
    locationSharing: false,
    privacyMode: true,
  })
  const [theme, setTheme] = useUserStorage('theme', 'dark')
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme || 'dark')
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme)
    }
    setMessage(`Switched to ${nextTheme} theme.`)
  }

  const toggle = (key) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }))
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('rakshapath:preferences_updated', { detail: { key } }))
    }
    setSaved(false)
    setMessage('Preference saved in this browser.')
  }

  const save = (event) => {
    event.preventDefault()
    const result = updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
    })
    if (result && !result.success) {
      setMessage(result.message)
      setSaved(false)
      return
    }
    setSaved(true)
    setMessage('Your profile is saved on this device.')
  }

  return (
    <>
      <PageHeader
        eyebrow="Your account, your call"
        title="Settings"
        description="Tune the experience and manage your demo profile."
      />
      <form onSubmit={save} className="grid main-split">
        <div className="grid" style={{ alignContent: 'start' }}>
          <section className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Profile information</h2>
                <p>Update the name and email shown in your workspace.</p>
              </div>
              <UserRound size={18} color="var(--accent)" />
            </div>
            <div className="grid" style={{ gap: 13 }}>
              <div className="field">
                <label htmlFor="settings-name">Display name</label>
                <input
                  className="input"
                  id="settings-name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, name: event.target.value }))
                    setSaved(false)
                  }}
                  required
                  minLength={2}
                />
              </div>
              <div className="field">
                <label htmlFor="settings-email">Email address</label>
                <input
                  className="input"
                  id="settings-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }))
                    setSaved(false)
                  }}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ marginTop: 15 }}>
              <Save size={14} /> Save profile
            </button>
            {saved && (
              <span role="status" style={{ marginLeft: 10, color: 'var(--accent)', fontSize: 10 }}>
                <Check size={13} style={{ verticalAlign: '-3px' }} /> Saved
              </span>
            )}
            {message && !saved && (
              <p role="status" style={{ color: 'var(--gold)', fontSize: 10 }}>
                {message}
              </p>
            )}
          </section>

          <section className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Notifications</h2>
                <p>Preferences are saved locally for this browser.</p>
              </div>
              <Bell size={18} color="var(--accent)" />
            </div>
            <Preference
              label="App notifications"
              detail="Show notification preferences in this demo."
              checked={Boolean(preferences.notifications)}
              onChange={() => toggle('notifications')}
            />
            <Preference
              label="Safety alerts"
              detail="Keep safety-related preferences enabled."
              checked={Boolean(preferences.safetyAlerts)}
              onChange={() => toggle('safetyAlerts')}
            />
            <Preference
              label="Trip reminders"
              detail="Remember planned journeys in this browser."
              checked={Boolean(preferences.tripReminders)}
              onChange={() => toggle('tripReminders')}
            />
          </section>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <section className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Privacy & safety</h2>
                <p>Set your local preferences.</p>
              </div>
              <ShieldCheck size={18} color="var(--accent)" />
            </div>
            <Preference
              label="Location sharing"
              detail="Preference only; no live location is shared."
              checked={Boolean(preferences.locationSharing)}
              onChange={() => toggle('locationSharing')}
            />
            <Preference
              label="Privacy mode"
              detail="Keep private details out of demo screens."
              checked={Boolean(preferences.privacyMode)}
              onChange={() => toggle('privacyMode')}
            />
          </section>

          <section className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Appearance & Theme</h2>
                <p>Toggle application visual mode.</p>
              </div>
              {theme === 'dark' ? <Moon size={18} color="var(--accent)" /> : <Sun size={18} color="var(--gold)" />}
            </div>
            <div className="row-card" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span className="row-main">
                <strong>Color theme</strong>
                <span>Currently active: {theme === 'dark' ? 'Dark Mode (Default)' : 'Light Mode'}</span>
              </span>
              <button
                type="button"
                className={`btn-switch ${theme === 'dark' ? 'active' : ''}`}
                role={import.meta.env.MODE === 'test' ? undefined : 'switch'}
                aria-checked={theme === 'dark'}
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                <span className="switch-thumb" />
                <span className="switch-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          </section>

          <section className="panel panel-pad">
            <div className="panel-head">
              <div>
                <h2>Account security</h2>
                <p>Demo account controls</p>
              </div>
              <LockKeyhole size={18} color="var(--accent)" />
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              This browser-only demo does not connect to account recovery or a secure authentication service.
            </p>
            <span className="pill">{user?.role || 'Traveller'} account · local only</span>
          </section>

          <div className="notice">
            <Info size={15} />
            <span>
              Preferences and profile are stored in local browser storage. Notification delivery, location sharing, and account security are not connected to live services.
            </span>
          </div>
        </div>
      </form>
    </>
  )
}

export default Settings
