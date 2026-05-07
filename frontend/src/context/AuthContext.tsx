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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await loginService(email, password)
    setUser(res.user)
    setToken(res.token)

    localStorage.setItem('user', JSON.stringify(res.user))
    localStorage.setItem('token', res.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)