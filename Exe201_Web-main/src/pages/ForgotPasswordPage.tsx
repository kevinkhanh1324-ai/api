import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import AuthService from '../services/authService'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock forgot password - always succeeds
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 2000)
  }

  // Success state
  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-amber-200/50 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email đã được gửi!</h2>
            <p className="text-gray-600 text-sm mb-6">
              Sau khi gửi, hãy kiểm tra hộp thư đến và thư mục spam của bạn
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm"
            >
              Quay về đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 flex items-center justify-center p-4 relative">
      {/* Logo in top left corner */}
      <div className="absolute top-4 left-4 xl:top-6 xl:left-6">
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
      </div>

      <div className="w-full max-w-md">
        {/* Back to Login */}
        <Link 
          to="/login" 
          className="inline-flex items-center text-gray-600 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Quay lại đăng nhập</span>
        </Link>

        {/* Forgot Password Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl border border-amber-200/50">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Child</h2>
            <p className="text-gray-700 text-sm mb-4">Hệ thống giám sát thông minh dành cho gia đình</p>
            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h1>
            <p className="text-gray-600 text-sm">
              Đừng lo lắng, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email của bạn
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                Địa chỉ email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-sm"
                placeholder="Nhập email của bạn"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </div>
              ) : (
                'Gửi link đặt lại mật khẩu'
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
  )
}

export default ForgotPasswordPage
