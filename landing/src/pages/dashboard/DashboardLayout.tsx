import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  PhoneCall, LayoutDashboard, Users, Settings,
  LogOut, Menu, X, ChevronDown, Bell,
  Building2, Phone, UsersRound, FileBarChart,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

type Role = 'owner' | 'admin' | 'sub_admin' | 'supervisor' | 'agent' | 'super_admin'

const navByRole: Record<Role, { to: string; icon: React.ElementType; label: string; end?: boolean; badge?: string }[]> = {
  owner: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen', end: true },
    { to: '/dashboard/empresa', icon: Building2, label: 'Mi Empresa' },
    { to: '/dashboard/reportes', icon: FileBarChart, label: 'Reportes' },
    { to: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen', end: true },
    { to: '/dashboard/equipo', icon: Users, label: 'Equipo' },
    { to: '/dashboard/clientes', icon: UsersRound, label: 'Clientes' },
    { to: '/dashboard/reportes', icon: FileBarChart, label: 'Reportes' },
    { to: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
  ],
  sub_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen', end: true },
    { to: '/dashboard/equipo', icon: Users, label: 'Mi Área' },
    { to: '/dashboard/clientes', icon: UsersRound, label: 'Clientes' },
    { to: '/dashboard/reportes', icon: FileBarChart, label: 'Reportes' },
    { to: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
  ],
  supervisor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen', end: true },
    { to: '/dashboard/equipo', icon: Users, label: 'Mi Equipo' },
    { to: '/dashboard/clientes', icon: UsersRound, label: 'Clientes' },
    { to: '/dashboard/reportes', icon: FileBarChart, label: 'Reportes' },
    { to: '/dashboard/alertas', icon: AlertTriangle, label: 'Alertas IA' },
    { to: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
  ],
  agent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Mi Panel', end: true },
    { to: '/dashboard/clientes', icon: UsersRound, label: 'Mis Clientes' },
    { to: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
  ],
  super_admin: [
    { to: '/superadmin', icon: LayoutDashboard, label: 'Panel SA', end: true },
  ],
}

const roleLabel: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', sub_admin: 'Sub Admin',
  supervisor: 'Supervisor', agent: 'Agente', super_admin: 'Super Admin',
}

const roleBadgeColor: Record<string, string> = {
  owner: 'bg-purple-600/20 text-purple-400',
  admin: 'bg-blue-600/20 text-blue-400',
  sub_admin: 'bg-indigo-600/20 text-indigo-400',
  supervisor: 'bg-green-600/20 text-green-400',
  agent: 'bg-slate-600/20 text-slate-400',
  super_admin: 'bg-red-600/20 text-red-400',
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const role = (user?.role ?? 'agent') as Role
  const navItems = navByRole[role] ?? navByRole.agent

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <PhoneCall size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm truncate">CallCenter IA</p>
            <p className="text-slate-400 text-xs truncate">{user?.nombre}</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3 border-b border-slate-800">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${roleBadgeColor[role]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {roleLabel[role]}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden text-slate-600 hover:text-slate-900" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />

          <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.nombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">{roleLabel[role]}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <NavLink to="/dashboard/configuracion"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}>
                  <Settings size={15} /> Configuración
                </NavLink>
                <hr className="my-1 border-slate-100" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
