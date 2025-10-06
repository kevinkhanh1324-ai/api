import React from 'react'
import { User, MapPin, Activity, Clock, AlertTriangle, Camera, TrendingUp, Shield } from 'lucide-react'

const ParentDashboard: React.FC = () => {
  const childData = {
    name: 'Nguyễn Minh An',
    age: 5,
    class: 'Lớp Mẫu Giáo A',
    currentLocation: 'Phòng học',
    currentActivity: 'Đang vẽ tranh',
    lastUpdate: '2 phút trước'
  }

  const todayStats = {
    totalAlerts: 2,
    resolvedAlerts: 1,
    activeTime: '6h 30m',
    behaviorScore: 85
  }

  const recentAlerts = [
    {
      id: 1,
      type: 'Leo trèo',
      severity: 'Cao',
      time: '10:30',
      location: 'Sân chơi',
      status: 'Đã xử lý',
      description: 'Bé đã leo lên thiết bị chơi không an toàn'
    },
    {
      id: 2,
      type: 'Ra khỏi vùng an toàn',
      severity: 'Trung bình',
      time: '14:15',
      location: 'Hành lang',
      status: 'Đang xử lý',
      description: 'Bé đã di chuyển ra ngoài khu vực được phép'
    }
  ]

  const systemStatus = {
    cameras: { total: 6, active: 6, status: 'Hoạt động tốt' },
    ai: { status: 'Đang hoạt động', accuracy: 96 },
    connection: { status: 'Ổn định', signal: 98 }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Chào mừng trở lại! 👋</h1>
        <p className="text-amber-100">Theo dõi tình hình của {childData.name} hôm nay</p>
      </div>

      {/* Child Status Card */}
      <div className="card bg-gradient-to-br from-amber-25 to-orange-25 border-amber-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{childData.name}</h2>
              <p className="text-amber-700">{childData.class} • {childData.age} tuổi</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Đang hoạt động
            </div>
            <p className="text-sm text-gray-600 mt-1">{childData.lastUpdate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm">
            <MapPin className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm text-gray-600">Vị trí hiện tại</p>
              <p className="font-medium text-gray-900">{childData.currentLocation}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm">
            <Activity className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Hoạt động</p>
              <p className="font-medium text-gray-900">{childData.currentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-amber-25 to-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Cảnh báo hôm nay</p>
              <p className="text-2xl font-bold text-amber-900">{todayStats.totalAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-25 to-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Đã xử lý</p>
              <p className="text-2xl font-bold text-green-900">{todayStats.resolvedAlerts}</p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-25 to-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Thời gian hoạt động</p>
              <p className="text-2xl font-bold text-orange-900">{todayStats.activeTime}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-25 to-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Điểm hành vi</p>
              <p className="text-2xl font-bold text-yellow-900">{todayStats.behaviorScore}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Cảnh báo gần đây</h3>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>

          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-amber-25 rounded-lg hover:bg-amber-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{alert.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'Cao' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'Trung bình' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>🕐 {alert.time}</span>
                      <span>📍 {alert.location}</span>
                    </div>
                  </div>
                  <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${alert.status === 'Đã xử lý' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {alert.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 btn-secondary">
            Xem tất cả cảnh báo
          </button>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Tình trạng hệ thống</h3>
            <Camera className="w-5 h-5 text-blue-500" />
          </div>

          <div className="space-y-4">
            {/* Camera Status */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Camera giám sát</span>
                <span className="text-sm font-medium text-blue-700">{systemStatus.cameras.active}/{systemStatus.cameras.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-blue-700 mt-1">{systemStatus.cameras.status}</p>
            </div>

            {/* AI Status */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Hệ thống AI</span>
                <span className="text-sm font-medium text-green-700">{systemStatus.ai.accuracy}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
              <p className="text-sm text-green-700 mt-1">{systemStatus.ai.status}</p>
            </div>

            {/* Connection Status */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-purple-900">Kết nối mạng</span>
                <span className="text-sm font-medium text-purple-700">{systemStatus.connection.signal}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
              <p className="text-sm text-purple-700 mt-1">{systemStatus.connection.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors group">
            <Camera className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700">Xem trực tiếp</span>
          </button>

          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl text-center transition-colors group">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-700">Cảnh báo</span>
          </button>

          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors group">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700">Báo cáo</span>
          </button>

          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors group">
            <User className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700">Hồ sơ</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ParentDashboard
