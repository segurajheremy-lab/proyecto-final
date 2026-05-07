import axios from 'axios'

// ---------------------------------------------------------------------------
// Axios instance — apunta al backend Node.js
// ---------------------------------------------------------------------------

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT en cada petición si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirige al login si el token expira — solo en rutas protegidas
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err.config?.url?.includes('/auth/registro') ||
      err.config?.url?.includes('/auth/login') ||
      err.config?.url?.includes('/auth/aceptar-invitacion')

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export interface RegistroPayload {
  nombreEmpresa: string
  dominio: string
  slug: string
  nombreOwner: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id?: string
  nombre: string
  email: string
  role: string
  tenantId?: string
  horario?: unknown
}

export interface AuthResponse {
  success: boolean
  data: {
    token: string
    tenant?: { nombre: string; slug: string }
    user: AuthUser
  }
}

export const authApi = {
  registro: (payload: RegistroPayload) =>
    api.post<AuthResponse>('/auth/registro', payload),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  me: () => api.get<{ success: boolean; data: AuthUser }>('/auth/me'),

  invitar: (payload: { email: string; role: string }) =>
    api.post('/auth/invitar', payload),

  aceptarInvitacion: (payload: { token: string; nombre: string; password: string }) =>
    api.post<AuthResponse>('/auth/aceptar-invitacion', payload),
}

// ---------------------------------------------------------------------------
// Owner / Tenant endpoints
// ---------------------------------------------------------------------------

export const tenantApi = {
  getMio: () => api.get('/tenants/mio'),
  update: (data: Partial<{ nombre: string; logo: string; colores: unknown }>) =>
    api.patch('/tenants/mio', data),
}

export const userApi = {
  listar: () => api.get('/users'),
  crear: (data: unknown) => api.post('/users', data),
  desactivar: (id: string) => api.patch(`/users/${id}/desactivar`),
}
