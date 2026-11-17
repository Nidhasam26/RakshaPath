import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import AuthShell from '../../components/auth/AuthShell'

function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return setError('Enter a valid email address.')
    setEmail(normalized)
    setError('')
    setSubmitted(true)
  }

  return (
    <AuthShell eyebrow="A fresh start is close">
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <span
            className="stat-icon"
            style={{ width: 50, height: 50, margin: '0 auto 18px', color: 'var(--mint)' }}
          >
            <CheckCircle2 size={23} />
          </span>
          <h2>Request noted.</h2>
          <p className="auth-lead" style={{ lineHeight: 1.7 }}>
            Your demo request for <strong style={{ color: '#e7ebe7' }}>{email}</strong> is ready. No email was sent and no password was changed.
          </p>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', gap: 8 }}
            onClick={() => onNavigate?.('Login')}
          >
            Return to sign in <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <>
          <div className="eyebrow">
            <ShieldCheck size={14} /> Account assistance
          </div>
          <h2 style={{ marginTop: 12 }}>Forgot your password?</h2>
          <p className="auth-lead">Enter the address you used to create your local demo account.</p>
          <form onSubmit={submit} className="grid" style={{ gap: 14 }} noValidate>
            <div className="field">
              <label htmlFor="forgot-email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#74808a"
                  style={{ position: 'absolute', left: 13, top: 14 }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: 40 }}
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            {error && (
              <p role="alert" style={{ margin: 0, color: 'var(--coral)', fontSize: 11 }}>
                {error}
              </p>
            )}
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Request reset <ArrowRight size={15} />
            </button>
          </form>
          <div className="auth-footer">
            <Link to="/login" onClick={() => onNavigate?.('Login')}>
              <ArrowLeft size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}

export default ForgotPassword
