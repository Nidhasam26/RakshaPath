import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (isAuthenticated && user) {
    const destination = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={destination} replace />
  }

  return children
}

export default PublicOnlyRoute
