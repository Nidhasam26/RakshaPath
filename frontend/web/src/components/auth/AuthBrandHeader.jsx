import { Logo } from '../common/Logo'

export function AuthBrandHeader({ className = '' }) {
  return (
    <div className={`auth-brand-header ${className}`}>
      <Logo variant="full" size={165} />
    </div>
  )
}

export default AuthBrandHeader
