import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from './Field'

export default function ProtectedRoute({ children, adminOnly = false, userOnly = false }) {
  const { user, isAdmin, loading, profile } = useAuth()
  const loc = useLocation()

  if (loading) return <Spinner full />
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  if (userOnly && isAdmin) return <Navigate to="/admin" replace />
  if (adminOnly) {
    if (!profile) return <Spinner full />
    if (!isAdmin) return <Navigate to="/dashboard" replace />
  }
  return children
}
