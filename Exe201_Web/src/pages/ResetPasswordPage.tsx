import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    }
  }

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValidation.isValid) {
      setError('Mật khẩu không đáp ứng yêu cầu bảo mật')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  // Invalid token
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link không hợp lệ</h2>
            <p className="text-gray-700 mb-6">
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
            </p>
            
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] inline-block text-center"
              >
                Yêu cầu link mới
              </Link>
              
              <Link
                to="/login"
                className="w-full text-gray-600 hover:text-gray-700 font-medium py-2 transition-colors inline-block text-center"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thành công!</h2>
            <p className="text-gray-700 mb-6">
              Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập.
            </p>
            
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] inline-block text-center"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-orange-50/20"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-amber-100/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 right-16 w-40 h-40 bg-orange-100/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-100/15 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-12">
          <div className="max-w-sm ml-auto mr-8">
            {/* Tag line */}
            <div className="mb-3">
              <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                CHILD MONITORING SYSTEM
              </span>
            </div>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Child</h1>
                <p className="text-gray-700 text-sm">Monitoring System</p>
              </div>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Đặt lại<br />
              <span className="text-gray-900">
                mật khẩu mới
              </span>
            </h2>
            
            <p className="text-base text-gray-700 mb-6 leading-relaxed">
              Tạo mật khẩu mới an toàn cho tài khoản của bạn. Đảm bảo mật khẩu đủ mạnh để bảo vệ thông tin.
            </p>
            
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Secure Reset</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Strong Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 lg:w-1/2 xl:w-3/5 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Smart Child</h1>
            <p className="text-gray-700 text-sm">Đặt lại mật khẩu</p>
          </div>

          {/* Reset Password Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-10 shadow-2xl border border-amber-200/50">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu</h2>
              <p className="text-gray-700 text-base">
                Tạo mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Input */}
              <div>
                <label htmlFor="password" className="block text-base font-medium text-gray-800 mb-3">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 pr-14 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    placeholder="Nhập mật khẩu mới"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-800 mb-2">Yêu cầu mật khẩu:</p>
                  <div className="space-y-1">
                    {[
                      { key: 'minLength', text: 'Ít nhất 8 ký tự' },
                      { key: 'hasUpper', text: 'Có chữ hoa' },
                      { key: 'hasLower', text: 'Có chữ thường' },
                      { key: 'hasNumber', text: 'Có số' },
                      { key: 'hasSpecial', text: 'Có ký tự đặc biệt' }
                    ].map(({ key, text }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          passwordValidation[key as keyof typeof passwordValidation] 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`} />
                        <span className={`text-xs ${
                          passwordValidation[key as keyof typeof passwordValidation]
                            ? 'text-green-700'
                            : 'text-gray-600'
                        }`}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-800 mb-3">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 pr-14 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Mật khẩu xác nhận không khớp</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-base"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang cập nhật...</span>
                  </div>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>

            {/* Footer Info */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
