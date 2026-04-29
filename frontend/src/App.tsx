import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin'
import AdminReports from './pages/Admin/Reports'

/* ================= Placeholder para módulos de compañeros ================= */
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8 flex items-center justify-center min-h-[60vh]">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
        <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm">Este módulo está siendo desarrollado por tu compañero de equipo</p>
    </div>
  </div>
)

/* ================= PROTECTED ROUTE ================= */
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
    return (
      <Navigate
        to={user.role === 'worker' ? '/dashboard' : '/admin'}
        replace
      />
    )
  }

  return <>{children}</>
}

/* ================= APP ================= */
export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando aplicación...</div>

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'worker' ? '/dashboard' : '/admin'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'worker' ? '/dashboard' : '/admin'} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['worker', 'super_admin', 'admin', 'reporter']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin routes con layout compartido */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'reporter']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<PlaceholderPage title="Gestión de Usuarios" />} />
        <Route path="asistencia" element={<PlaceholderPage title="Vista de Asistencia" />} />
        <Route path="reportes" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}