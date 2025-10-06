import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'parent'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: 'admin' | 'teacher' | 'parent') => Promise<boolean>
  logout: () => void
  loading: boolean
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

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('smart-child-user')
    const token = localStorage.getItem('smart-child-token')
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('smart-child-user')
        localStorage.removeItem('smart-child-token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role: 'admin' | 'teacher' | 'parent'): Promise<boolean> => {
    try {
      setLoading(true)
      
      // Mock authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create mock user based on input
      const mockUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: getRoleName(role, email),
        email: email.toLowerCase(),
        role: role
      }

      // Save to localStorage with prefixed keys
      localStorage.setItem('smart-child-user', JSON.stringify(mockUser))
      localStorage.setItem('smart-child-token', 'mock-jwt-token-' + Date.now())
      
      setUser(mockUser)
      setLoading(false)
      return true
    } catch (error) {
      console.error('Mock login error:', error)
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('smart-child-user')
    localStorage.removeItem('smart-child-token')
    setUser(null)
  }

  // Helper function to generate display name based on role
  const getRoleName = (role: string, email: string): string => {
    const emailPrefix = email.split('@')[0]
    switch (role) {
      case 'admin':
        return `Admin ${emailPrefix}`
      case 'teacher':
        return `Giáo viên ${emailPrefix}`
      case 'parent':
        return `Phụ huynh ${emailPrefix}`
      default:
        return emailPrefix
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
