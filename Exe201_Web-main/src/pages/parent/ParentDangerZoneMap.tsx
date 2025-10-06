import React, { useState } from 'react'
import { Map, AlertTriangle, Eye, EyeOff, Settings, MapPin, Clock } from 'lucide-react'

const ParentDangerZones: React.FC = () => {
  const [showZones, setShowZones] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)

  const dangerZones = [
    {
      id: 'playground-equipment',
      name: 'Thiết bị sân chơi cao',
      type: 'Nguy hiểm vật lý',
      level: 'Cao',
      description: 'Khu vực có thiết bị chơi cao, nguy cơ ngã từ độ cao',
      alertCount: 12,
      lastIncident: '2 ngày trước',
      coordinates: { x: 150, y: 200 }
    },
    {
      id: 'kitchen-area',
      name: 'Khu vực bếp ăn',
      type: 'Nguy hiểm hóa chất',
      level: 'Rất cao',
      description: 'Khu vực có dụng cụ nấu ăn và hóa chất tẩy rửa',
      alertCount: 5,
      lastIncident: '1 tuần trước',
      coordinates: { x: 300, y: 150 }
    },
    {
      id: 'storage-room',
      name: 'Phòng kho',
      type: 'Khu vực hạn chế',
      level: 'Trung bình',
      description: 'Phòng chứa đồ dùng, không phù hợp cho trẻ em',
      alertCount: 3,
      lastIncident: '3 ngày trước',
      coordinates: { x: 450, y: 100 }
    },
    {
      id: 'stairs',
      name: 'Cầu thang bộ',
      type: 'Nguy hiểm ngã',
      level: 'Cao',
      description: 'Cầu thang có thể gây nguy hiểm nếu không có giám sát',
      alertCount: 8,
      lastIncident: '5 ngày trước',
      coordinates: { x: 100, y: 300 }
    }
  ]

  const recentAlerts = [
    {
      id: 1,
      zone: 'Thiết bị sân chơi cao',
      child: 'Nguyễn Minh An',
      time: '14:30',
      action: 'Đã can thiệp kịp thời',
      severity: 'Cao'
    },
    {
      id: 2,
      zone: 'Cầu thang bộ',
      child: 'Trần Thị Bích',
      time: '10:15',
      action: 'Nhắc nhở và hướng dẫn',
      severity: 'Trung bình'
    }
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Rất cao': return 'bg-red-500'
      case 'Cao': return 'bg-orange-500'
      case 'Trung bình': return 'bg-yellow-500'
      case 'Thấp': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🗺️ Bản đồ vùng nguy hiểm</h1>
            <p className="text-red-100">Theo dõi và cảnh báo về các khu vực có nguy cơ cao</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowZones(!showZones)}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              {showZones ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showZones ? 'Ẩn vùng' : 'Hiện vùng'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">4</div>
            <div className="text-sm text-red-600">Vùng nguy hiểm</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-700">28</div>
            <div className="text-sm text-orange-600">Cảnh báo tháng này</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-700">2</div>
            <div className="text-sm text-yellow-600">Sự cố hôm nay</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">95%</div>
            <div className="text-sm text-green-600">Hiệu quả phòng ngừa</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🗺️ Bản đồ trường học</h3>
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Chế độ xem phụ huynh</span>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl overflow-hidden" style={{ height: '500px' }}>
              {/* School Layout */}
              <div className="absolute inset-4 bg-white rounded-lg shadow-sm border-2 border-gray-200">
                <div className="p-4 text-center text-gray-500">
                  <Map className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sơ đồ trường mầm non</p>
                </div>

                {/* Danger Zones */}
                {showZones && dangerZones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform ${getLevelColor(zone.level)} opacity-80 hover:opacity-100`}
                    style={{
                      left: `${zone.coordinates.x}px`,
                      top: `${zone.coordinates.y}px`
                    }}
                    onClick={() => setSelectedZone(zone.id)}
                    title={zone.name}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Mức độ nguy hiểm</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Rất cao</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Cao</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Trung bình</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone Details */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Danh sách vùng nguy hiểm</h3>

            <div className="space-y-3">
              {dangerZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedZone === zone.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{zone.name}</h4>
                    <span className={`w-3 h-3 rounded-full ${getLevelColor(zone.level)}`}></span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{zone.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{zone.alertCount} cảnh báo</span>
                    <span>{zone.lastIncident}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚨 Cảnh báo gần đây</h3>

            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{alert.child}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'Cao' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">{alert.zone}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.time}</span>
                    </div>
                    <span>{alert.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Lời khuyên an toàn</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🏃‍♂️ Giám sát chặt chẽ</h4>
            <p className="text-sm text-blue-700">
              Luôn đảm bảo trẻ em được giám sát khi ở gần các vùng nguy hiểm
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">📚 Giáo dục an toàn</h4>
            <p className="text-sm text-green-700">
              Dạy trẻ nhận biết và tránh xa các khu vực nguy hiểm
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">🔔 Cảnh báo kịp thời</h4>
            <p className="text-sm text-yellow-700">
              Hệ thống sẽ gửi thông báo ngay khi phát hiện trẻ ở vùng nguy hiểm
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParentDangerZones
