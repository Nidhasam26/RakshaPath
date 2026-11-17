import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import AuthShell from '../../components/auth/AuthShell'

function Register({ onNavigate }) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Traveller',
  })
  const [error, setError] = useState('')

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    if (name.length < 2) return setError('Enter a name with at least two characters.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.')
    if (form.password.length < 6) return setError('Your password needs at least six characters.')
    if (form.password !== form.confirmPassword) return setError('Those passwords do not match.')

    const result = await register({
      name,
      email,
      password: form.password,
      role: form.role,
    })

    if (!result.success) {
      setError(result.message)
    } else {
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    }
  }

  return (
    <AuthShell eyebrow="Start with a little more clarity">
      <div className="eyebrow">
        <ShieldCheck size={14} /> Create your account
      </div>
      <h2 style={{ marginTop: 12 }}>Your journey, considered.</h2>
      <p className="auth-lead">Set up your local demo workspace in a moment.</p>
      <form onSubmit={submit} className="grid" style={{ gap: 12 }} noValidate>
        <div className="field">
          <label htmlFor="register-name">Full name</label>
          <div style={{ position: 'relative' }}>
            <UserRound
              size={16}
              color="#74808a"
              style={{ position: 'absolute', left: 13, top: 14 }}
            />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              id="register-name"
              value={form.name}
              onChange={update('name')}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="register-email">Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              color="#74808a"
              style={{ position: 'absolute', left: 13, top: 14 }}
            />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              id="register-email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <div style={{ position: 'relative' }}>
              <LockKeyhole
                size={15}
                color="#74808a"
                style={{ position: 'absolute', left: 13, top: 14 }}
              />
              <input
                className="input"
                style={{ paddingLeft: 38 }}
                id="register-password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              className="input"
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="register-role">Workspace role</label>
          <select className="select" id="register-role" value={form.role} onChange={update('role')}>
            <option value="Traveller">Traveller</option>
            <option value="Family">Family member</option>
            <option value="Police">Police demo operator</option>
          </select>
        </div>
        {error && (
          <p role="alert" style={{ margin: 0, color: 'var(--coral)', fontSize: 11 }}>
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 3 }}>
          Create account <ArrowRight size={15} />
        </button>
      </form>
      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/login" onClick={() => onNavigate?.('Login')}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

export default Register
