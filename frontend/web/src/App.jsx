import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useInRouterContext,
} from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/traveller/Dashboard'
import MyTrips from './pages/traveller/MyTrips'
import EmergencyContacts from './pages/traveller/EmergencyContacts'
import SosPage from './pages/traveller/SosPage'
import FamilySharing from './pages/family/FamilySharing'
import Settings from './pages/settings/Settings'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import NotFound from './pages/common/NotFound'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import { PageSkeleton } from './components/common/Skeleton'
import { useAuth } from './context/useAuth'

// Lazy-loaded heavy modules
const LiveMap = lazy(() => import('./pages/traveller/LiveMap'))
const SafePlaces = lazy(() => import('./pages/traveller/SafePlaces'))
const PoliceDashboard = lazy(() => import('./pages/police/PoliceDashboard'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))

function AppRoutes() {
  const { user } = useAuth()

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public auth routes - authenticated users get redirected to /dashboard */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />

        {/* Protected workspace routes with shared layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              user?.role === 'Police' ? (
                <Suspense fallback={<PageSkeleton />}>
                  <PoliceDashboard overview />
                </Suspense>
              ) : (
                <Dashboard />
              )
            }
          />
          <Route
            path="/map"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <LiveMap />
              </Suspense>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute allowedRoles={['Traveller']}>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute allowedRoles={['Traveller', 'Family']}>
                <FamilySharing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute allowedRoles={['Traveller']}>
                <EmergencyContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sos"
            element={
              <ProtectedRoute allowedRoles={['Traveller']}>
                <SosPage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<Settings key={user?.id} />} />
          <Route
            path="/notifications"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Notifications />
              </Suspense>
            }
          />
          <Route
            path="/safe-places"
            element={
              <ProtectedRoute allowedRoles={['Traveller', 'Family']}>
                <Suspense fallback={<PageSkeleton />}>
                  <SafePlaces />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/police"
            element={
              <ProtectedRoute allowedRoles={['Police']}>
                <Suspense fallback={<PageSkeleton />}>
                  <PoliceDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  )
}

function App() {
  const inRouter = useInRouterContext()

  if (!inRouter) {
    return (
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    )
  }

  return <AppRoutes />
}

export default App
