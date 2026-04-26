import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IUser } from '../types/user.types'
import { loginService } from '../services/auth.service'

interface AuthContextType {
  user: IUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
})

// Inicializamos desde localStorage directamente para evitar cascading renders
const getInitialToken = () => localStorage.getItem('token')
const getInitialUser = (): IUser | null => {
  const saved = localStorage.getItem('user')
  return saved ? (JSON.parse(saved) as IUser) : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(getInitialUser)
  const [token, setToken] = useState<string | null>(getInitialToken)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    const response = await loginService(email, password)
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
  }

  const logout = (): void => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext)
}