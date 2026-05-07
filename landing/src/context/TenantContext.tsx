import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenantColores {
  primario: string
  secundario: string
}

interface TenantConfig {
  _id: string
  nombre: string
  dominio: string
  slug: string
  logo?: string
  colores: TenantColores
  plan: string
  status: string
  trialExpira: string
  agentesLimit: number
}

interface TenantContextValue {
  tenant: TenantConfig | null
  colores: TenantColores
  isLoading: boolean
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_COLORES: TenantColores = {
  primario: '#3B82F6',
  secundario: '#1E293B',
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  colores: DEFAULT_COLORES,
  isLoading: false,
  refresh: async () => {},
})

export function TenantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const { data } = await api.get<{ success: boolean; data: TenantConfig }>('/tenants/mio')
      setTenant(data.data)
      // Apply CSS variables for dynamic theming
      applyTheme(data.data.colores)
    } catch {
      // Silently fail — use defaults
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) load()
    else {
      setTenant(null)
      applyTheme(DEFAULT_COLORES)
    }
  }, [isAuthenticated])

  const colores = tenant?.colores ?? DEFAULT_COLORES

  return (
    <TenantContext.Provider value={{ tenant, colores, isLoading, refresh: load }}>
      {children}
    </TenantContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Apply theme to CSS variables
// ---------------------------------------------------------------------------

function applyTheme(colores: TenantColores) {
  const root = document.documentElement
  root.style.setProperty('--color-primary', colores.primario)
  root.style.setProperty('--color-secondary', colores.secundario)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  return useContext(TenantContext)
}
