import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User } from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        const savedUser = authService.getUser()
        const token = authService.getToken()
        
        if (savedUser && token) {
          // Validate token with server
          const isValid = await authService.validateToken(token)
          if (isValid) {
            setUser(savedUser)
          } else {
            // Token is invalid, clear auth data
            authService.clearAuth()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        authService.clearAuth()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      // Call API to login
      const loginResponse = await authService.login(email, password)
      
      // Auto-detect role from backend response instead of requiring user selection
      // This makes login more user-friendly
      const backendRole = loginResponse.role
      
      // Map backend role to frontend role
      const roleMapping: { [key: string]: 'admin' | 'teacher' | 'parent' } = {
        'admin': 'admin',
        'school': 'teacher',
        'parent': 'parent'
      }
      
      const detectedRole = roleMapping[backendRole] || 'parent'
      
      // Role is automatically detected from backend response
      console.log(`Auto-detected role: ${detectedRole} for user: ${email}`)
      
      // Get user information (using login response data)
      const userData = await authService.getCurrentUser(loginResponse.access_token, email, backendRole)

      // Store auth data
      authService.setToken(loginResponse.access_token)
      authService.setUser(userData)
      
      setUser(userData)
      setLoading(false)
      return true
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Đăng nhập thất bại')
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    authService.clearAuth()
    setUser(null)
    setError(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
