import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Shield, ShieldCheck, User, Users } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import AuthShell from '../../components/auth/AuthShell'
import { Logo } from '../../components/common/Logo'
import { DEMO_ACCOUNTS } from '../../constants/demoUsers'

const ROLE_ICONS = {
  Traveller: User,
  Family: Users,
  Police: Shield,
}

function Login({ onNavigate }) {
  const { login, register, users } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeRole, setActiveRole] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return setError('Enter a valid email address.')
    }
    if (!password) {
      return setError('Enter your password.')
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await login({ email: normalizedEmail, password })
      if (!result.success) {
        setError(result.message)
      } else {
        const destination = location.state?.from?.pathname || '/dashboard'
        navigate(destination, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Unable to authenticate in this environment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoSignIn = async (account) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setActiveRole(account.role)
    setError('')

    try {
      // 1. Look for an existing seeded demo account in memory or storage
      const existingAccount =
        users.find((u) => u.email === account.email.trim().toLowerCase()) ||
        (() => {
          try {
            const stored = JSON.parse(localStorage.getItem('rakshapath_demo_users') || '[]')
            return stored.find((u) => u.email === account.email.trim().toLowerCase())
          } catch {
            return null
          }
        })()

      // 2. If it does not exist, provision via standard PBKDF2 registration path
      if (!existingAccount) {
        const regResult = await register({
          name: account.name,
          email: account.email,
          password: account.password,
          role: account.role,
        })

        if (!regResult.success) {
          setError(regResult.message || 'Unable to provision demo account.')
          return
        }
      } else {
        // 3. If account exists, authenticate through standard login function
        const loginResult = await login({
          email: account.email,
          password: account.password,
        })

        if (!loginResult.success) {
          setError(loginResult.message || 'Unable to authenticate demo account.')
          return
        }
      }

      // 4. Navigate to the verified role dashboard
      navigate(account.destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication error encountered.')
    } finally {
      setIsSubmitting(false)
      setActiveRole(null)
    }
  }

  return (
    <AuthShell>
      <div className="auth-brand-header">
        <Logo variant="full" size={190} />
      </div>

      <div className="auth-eyebrow">
        <ShieldCheck size={13} /> WELCOME BACK
      </div>

      <h2 className="auth-title">Sign in to your space.</h2>
      <p className="auth-lead">Pick up right where your journey begins.</p>

      <form onSubmit={submit} className="grid auth-form" style={{ gap: 16 }} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input-wrapper">
            <Mail size={16} className="auth-input-icon" />
            <input
              className="input auth-input"
              id="login-email"
              type="email"
              value={email}
              disabled={isSubmitting}
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

        <div className="field">
          <div className="auth-field-header">
            <label htmlFor="login-password">Password</label>
            <Link
              to="/forgot-password"
              className="auth-secondary-link"
              onClick={() => onNavigate?.('Forgot Password')}
            >
              Forgot password?
            </Link>
          </div>
          <div className="auth-input-wrapper">
            <LockKeyhole size={16} className="auth-input-icon" />
            <input
              className="input auth-input auth-password-input"
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              className="auth-password-toggle"
              type="button"
              disabled={isSubmitting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="auth-error-message">
            {error}
          </p>
        )}

        <button
          className="btn btn-primary auth-submit-btn"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting && !activeRole ? 'Continuing...' : (
            <>
              Continue <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Demo Accounts Section (FR-100) */}
      <div className="demo-accounts-section">
        <div className="demo-accounts-divider">
          <span>Demo accounts</span>
        </div>
        <p className="demo-accounts-hint">
          Instant access with pre-configured demonstration roles:
        </p>
        <div className="demo-accounts-grid">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = ROLE_ICONS[account.role] || User
            return (
              <button
                key={account.role}
                type="button"
                className="demo-account-btn"
                aria-label={account.accessibleName}
                disabled={isSubmitting}
                onClick={() => handleDemoSignIn(account)}
              >
                <Icon size={16} aria-hidden="true" className="demo-chip-icon" />
                <span>
                  {isSubmitting && activeRole === account.role
                    ? 'Signing in...'
                    : account.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="auth-footer">
        <span className="auth-footer-text">New to RakshaPath?</span>{' '}
        <Link
          to="/register"
          className="auth-accent-link"
          onClick={() => onNavigate?.('Register')}
        >
          Create an account
        </Link>
      </div>
    </AuthShell>
  )
}

export default Login
