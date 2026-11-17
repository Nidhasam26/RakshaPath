import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        state={{
          denied: true,
          message: `Access to ${location.pathname} is restricted to ${allowedRoles.join(' / ')} accounts.`,
        }}
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute
