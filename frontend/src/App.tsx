import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin'
import AdminReports from './pages/Admin/Reports'
import UsersPage from './pages/Admin/Users'

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8 flex items-center justify-center min-h-[60vh]">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm">Este módulo está siendo desarrollado por tu compañero de equipo</p>
    </div>
  </div>
)

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'worker' ? '/dashboard' : '/admin'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando aplicación...</div>

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? (user.role === 'worker' ? '/dashboard' : '/admin') : '/login'} replace />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'worker' ? '/dashboard' : '/admin'} replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['worker', 'super_admin', 'admin', 'reporter']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'reporter']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="asistencia" element={<PlaceholderPage title="Vista de Asistencia" />} />
        <Route path="reportes" element={<AdminReports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}