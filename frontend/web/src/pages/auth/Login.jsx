import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import AuthShell from '../../components/auth/AuthShell'

function Login({ onNavigate }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')
    const result = await login({ email: normalizedEmail, password })
    if (!result.success) {
      setError(result.message)
    } else {
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    }
  }

  return (
    <AuthShell>
      <div className="eyebrow">
        <ShieldCheck size={14} /> Welcome back
      </div>
      <h2 style={{ marginTop: 12 }}>Sign in to your space.</h2>
      <p className="auth-lead">Pick up right where your journey begins.</p>
      <form onSubmit={submit} className="grid" style={{ gap: 14 }} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              color="#74808a"
              style={{ position: 'absolute', left: 13, top: 14 }}
            />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              id="login-email"
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
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="login-password">Password</label>
            <Link
              to="/forgot-password"
              className="text-link"
              onClick={() => onNavigate?.('Forgot Password')}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <LockKeyhole
              size={16}
              color="#74808a"
              style={{ position: 'absolute', left: 13, top: 14 }}
            />
            <input
              className="input"
              style={{ paddingLeft: 40, paddingRight: 43 }}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              className="icon-btn"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((shown) => !shown)}
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 40,
                height: 40,
                border: 0,
                background: 'transparent',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--coral)', fontSize: 11 }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 3 }}>
          Continue <ArrowRight size={15} />
        </button>
      </form>
      <div className="auth-footer">
        New to RakshaPath?{' '}
        <Link to="/register" onClick={() => onNavigate?.('Register')}>
          Create an account
        </Link>
      </div>
    </AuthShell>
  )
}

export default Login
