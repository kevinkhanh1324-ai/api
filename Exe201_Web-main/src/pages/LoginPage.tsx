import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Shield, Eye, EyeOff, Users, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'parent' | 'admin' | 'teacher'>('parent')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated, user } = useAuth()

  // Redirect if already logged in
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}`} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Always successful mock login
    const success = await login(email, password, role)
    
    if (!success) {
      // This should never happen in mock mode, but just in case
      console.error('Unexpected login failure in mock mode')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-orange-50/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-amber-100/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-16 w-40 h-40 bg-orange-100/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-100/15 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between pt-4 px-4 xl:px-6 pb-8 h-full">
          <div className="max-w-md">
            {/* Tag line */}
            <div className="mb-2">
              <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                CHILD MONITORING SYSTEM
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold text-gray-900">Smart Child</h1>
                <p className="text-gray-700 text-sm">Monitoring System</p>
              </div>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="max-w-lg flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-xl xl:text-2xl font-bold text-gray-900 mb-4 leading-tight">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  An toàn cho con yêu của bạn
                </span>
              </h2>
              <p className="text-base xl:text-lg text-gray-700 leading-relaxed">
                Công nghệ AI tiên tiến kết hợp camera thông minh, mang đến sự yên tâm hoàn toàn cho phụ huynh trong việc bảo vệ và chăm sóc trẻ em.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 xl:w-1/2 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Smart Child</h1>
            <p className="text-gray-700 text-sm">Đăng nhập vào hệ thống</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl border border-amber-200/50">
            <div className="hidden lg:block mb-5 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Child</h2>
              <p className="text-gray-700 text-sm">Hệ thống giám sát thông minh dành cho gia đình</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Chọn vai trò của bạn</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={`group relative p-3 rounded-lg border-2 transition-all duration-200 ${role === 'parent'
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50'
                        : 'border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-100/50'
                      }`}
                    onClick={() => setRole('parent')}
                  >
                    <Users className={`w-6 h-6 mx-auto mb-1 ${role === 'parent' ? 'text-blue-600' : 'text-amber-600 group-hover:text-amber-700'}`} />
                    <div className={`text-xs font-medium ${role === 'parent' ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-800'}`}>
                      Phụ Huynh
                    </div>
                    {role === 'parent' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`group relative p-3 rounded-lg border-2 transition-all duration-200 ${role === 'teacher'
                        ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200/50'
                        : 'border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-100/50'
                      }`}
                    onClick={() => setRole('teacher')}
                  >
                    <GraduationCap className={`w-6 h-6 mx-auto mb-1 ${role === 'teacher' ? 'text-green-600' : 'text-amber-600 group-hover:text-amber-700'}`} />
                    <div className={`text-xs font-medium ${role === 'teacher' ? 'text-green-600' : 'text-gray-700 group-hover:text-gray-800'}`}>
                      Giáo Viên
                    </div>
                    {role === 'teacher' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`group relative p-3 rounded-lg border-2 transition-all duration-200 ${role === 'admin'
                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-200/50'
                        : 'border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-100/50'
                      }`}
                    onClick={() => setRole('admin')}
                  >
                    <Shield className={`w-6 h-6 mx-auto mb-1 ${role === 'admin' ? 'text-orange-600' : 'text-amber-600 group-hover:text-amber-700'}`} />
                    <div className={`text-xs font-medium ${role === 'admin' ? 'text-orange-600' : 'text-gray-700 group-hover:text-gray-800'}`}>
                      Quản Trị
                    </div>
                    {role === 'admin' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-sm"
                  placeholder="test@example.com"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-sm"
                    placeholder="123456"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Bảo mật thông tin với công nghệ mã hóa tiên tiến
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
