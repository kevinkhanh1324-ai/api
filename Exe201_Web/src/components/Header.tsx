import React from 'react'
import { Bell, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-amber-200/50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SC</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Smart Child Monitoring
            </h1>
            <p className="text-xs text-gray-600">
              {user?.role === 'parent' ? 'Cổng Phụ Huynh' : user?.role === 'teacher' ? 'Cổng Giáo Viên' : 'Cổng Quản Trị'}
            </p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-amber-50 rounded-lg transition-colors"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 bg-amber-50/50 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-600 capitalize">
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                title="Cài đặt"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
