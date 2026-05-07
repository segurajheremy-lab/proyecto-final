import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AceptarInvitacionPage from './pages/AceptarInvitacionPage'

// Dashboard shell
import DashboardLayout from './pages/dashboard/DashboardLayout'
import ResumenPage from './pages/dashboard/ResumenPage'
import EquipoPage from './pages/dashboard/EquipoPage'
import EmpresaPage from './pages/dashboard/EmpresaPage'
import ConfiguracionPage from './pages/dashboard/ConfiguracionPage'

// Role-specific pages
import AdminPage from './pages/dashboard/roles/AdminPage'
import SubAdminPage from './pages/dashboard/roles/SubAdminPage'
import SupervisorPage from './pages/dashboard/roles/SupervisorPage'
import AgentePage from './pages/dashboard/roles/AgentePage'
import ClienteFichaPage from './pages/dashboard/ClienteFichaPage'
import ClientesPage from './pages/dashboard/ClientesPage'
import ReportesPage from './pages/dashboard/ReportesPage'
import AlertasPage from './pages/dashboard/AlertasPage'

// Super Admin pages
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import EmpresasPage from './pages/superadmin/EmpresasPage'
import EstadisticasPage from './pages/superadmin/EstadisticasPage'

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/aceptar-invitacion" element={<AceptarInvitacionPage />} />

            {/* Protected — Dashboard (all roles except super_admin) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin', 'sub_admin', 'supervisor', 'agent']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ResumenPage />} />
              <Route path="equipo" element={<EquipoPage />} />
              <Route path="empresa" element={<EmpresaPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="sub-admin" element={<SubAdminPage />} />
              <Route path="supervisor" element={<SupervisorPage />} />
              <Route path="agente" element={<AgentePage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="clientes/:id" element={<ClienteFichaPage />} />
              <Route path="reportes" element={<ReportesPage />} />
              <Route path="alertas" element={<AlertasPage />} />
            </Route>

            {/* Protected — Super Admin */}
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="empresas" replace />} />
              <Route path="empresas" element={<EmpresasPage />} />
              <Route path="estadisticas" element={<EstadisticasPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  )
}
