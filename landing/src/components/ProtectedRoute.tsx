import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  /** If provided, only users with one of these roles can access the route */
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Role guard — redirect to appropriate home if role not allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const home = user.role === 'super_admin' ? '/superadmin' : '/dashboard'
    return <Navigate to={home} replace />
  }

  return <>{children}</>
}
