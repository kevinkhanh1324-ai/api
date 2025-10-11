// API Base URL - adjust this to match your backend server
const API_BASE_URL = 'http://127.0.0.1:8000'

// Types for API responses
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'parent'
}

export interface ApiError {
  detail: string | Array<{
    loc: string[]
    msg: string
    type: string
  }>
}

class AuthService {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(this.formatErrorMessage(errorData))
      }

      const data: LoginResponse = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred during login')
    }
  }

  /**
   * Get current user info from login response
   */
  async getCurrentUser(token: string, email: string, role: string): Promise<User> {
    try {
      // Since backend doesn't have /api/auth/me endpoint, we'll create user info from login data
      // Extract user ID from token (basic implementation)
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]))
          const userId = payload.user_id || 'unknown'
          
          return {
            id: userId.toString(),
            name: this.getDisplayName(email, role),
            email: email,
            role: this.mapBackendRoleToFrontend(role)
          }
        } catch (e) {
          // Fallback if token parsing fails
          return {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            name: this.getDisplayName(email, role),
            email: email,
            role: this.mapBackendRoleToFrontend(role)
          }
        }
      }
      
      // Fallback
      return {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: this.getDisplayName(email, role),
        email: email,
        role: this.mapBackendRoleToFrontend(role)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while fetching user data')
    }
  }

  /**
   * Map backend role to frontend role
   */
  private mapBackendRoleToFrontend(backendRole: string): 'admin' | 'teacher' | 'parent' {
    switch (backendRole) {
      case 'admin':
        return 'admin'
      case 'school':
        return 'teacher'
      case 'parent':
        return 'parent'
      default:
        return 'parent' // fallback
    }
  }

  /**
   * Generate display name based on email and role
   */
  private getDisplayName(email: string, role: string): string {
    const emailPrefix = email.split('@')[0]
    switch (role) {
      case 'admin':
        return `Admin ${emailPrefix}`
      case 'teacher':
      case 'school':
        return `Giáo viên ${emailPrefix}`
      case 'parent':
        return `Phụ huynh ${emailPrefix}`
      default:
        return emailPrefix
    }
  }

  /**
   * Forgot password request
   */
  async forgotPassword(email: string): Promise<{ msg: string }> {
    try {
      const formData = new FormData()
      formData.append('email', email)

      const response = await fetch(`${this.baseURL}/api/auth/forgot-password`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(this.formatErrorMessage(errorData))
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred during password reset request')
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ msg: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        throw new Error(this.formatErrorMessage(errorData))
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred during password reset')
    }
  }

  /**
   * Validate token (basic validation without calling backend)
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Basic JWT token validation
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        return false
      }
      
      // Check if token is expired
      const payload = JSON.parse(atob(tokenParts[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < currentTime) {
        return false
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Format error messages from API
   */
  private formatErrorMessage(error: ApiError): string {
    if (typeof error.detail === 'string') {
      return error.detail
    }

    if (Array.isArray(error.detail)) {
      return error.detail.map(err => err.msg).join(', ')
    }

    return 'An error occurred'
  }

  /**
   * Store token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('smart-child-token', token)
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('smart-child-token')
  }

  /**
   * Remove token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem('smart-child-token')
  }

  /**
   * Store user data in localStorage
   */
  setUser(user: User): void {
    localStorage.setItem('smart-child-user', JSON.stringify(user))
  }

  /**
   * Get user data from localStorage
   */
  getUser(): User | null {
    const userData = localStorage.getItem('smart-child-user')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (error) {
        console.error('Error parsing user data:', error)
        return null
      }
    }
    return null
  }

  /**
   * Remove user data from localStorage
   */
  removeUser(): void {
    localStorage.removeItem('smart-child-user')
  }

  /**
   * Clear all auth data
   */
  clearAuth(): void {
    this.removeToken()
    this.removeUser()
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService