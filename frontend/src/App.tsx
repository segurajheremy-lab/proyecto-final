import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ReportePage from './pages/ReportePage'

/* ================= ADMIN PANEL ESTILIZADO ================= */
const AdminPanel = () => (
  // Fondo oscuro idéntico al Login
  <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
    
    {/* Tarjeta centralizada con sombras y bordes redondeados */}
    <div className="bg-[#1f2937] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col items-center text-center">
      
      {/* Icono decorativo azul */}
      <div className="bg-[#3b82f6] p-3 rounded-xl mb-6 shadow-lg shadow-blue-500/20">
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </div>

      <h2 className="text-white text-3xl font-extrabold mb-2 tracking-tight">
        Panel de Administración
      </h2>
      <p className="text-gray-400 mb-8 text-sm">
        Bienvenido. Selecciona una acción para continuar.
      </p>

      {/* Botón principal estilizado como el botón de "Iniciar Sesión" */}
      <Link 
        to="/reporte" 
        className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-6 rounded-xl transition duration-200 ease-in-out shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h4m0 0l-4-4m4 4l-4 4" />
        </svg>
        Ir a Enviar Reporte
      </Link>

      {/* Botón de cerrar sesión para limpiar el Local Storage */}
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }}
        className="text-gray-500 hover:text-red-400 text-xs mt-4 transition-colors underline"
      >
        Cerrar Sesión Segura
      </button>

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

  if (isLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center text-white">Cargando...</div>

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

  if (isLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center text-white">Cargando aplicación...</div>

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

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'reporter']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reporte"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'reporter']}>
            <ReportePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}