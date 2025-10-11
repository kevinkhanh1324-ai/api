import React, { useState } from 'react'
import { MapPin, Plus, Edit, Trash2, Settings, Save, AlertTriangle } from 'lucide-react'

const AdminDangerZoneManager: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)

  const dangerZones = [
    {
      id: 1,
      name: 'Khu thiết bị sân chơi',
      type: 'Nguy cơ leo trèo',
      severity: 'Cao',
      alertCount: 25,
      enabled: true,
      coordinates: { x: 150, y: 100, width: 120, height: 80 },
      description: 'Thiết bị chơi cao có nguy cơ ngã',
      alertThreshold: 'Trung bình',
      autoUpdate: true
    },
    {
      id: 2,
      name: 'Cầu thang chính',
      type: 'Nguy cơ ngã',
      severity: 'Cao',
      alertCount: 12,
      enabled: true,
      coordinates: { x: 350, y: 200, width: 80, height: 60 },
      description: 'Khu vực cầu thang có thể gây nguy hiểm ngã',
      alertThreshold: 'Cao',
      autoUpdate: false
    },
    {
      id: 3,
      name: 'Lối vào bếp',
      type: 'Khu vực hạn chế',
      severity: 'Trung bình',
      alertCount: 8,
      enabled: true,
      coordinates: { x: 450, y: 150, width: 90, height: 70 },
      description: 'Hạn chế tiếp cận khu vực bếp',
      alertThreshold: 'Thấp',
      autoUpdate: true
    },
    {
      id: 4,
      name: 'Lối thoát khẩn cấp',
      type: 'Nguy cơ lang thang',
      severity: 'Trung bình',
      alertCount: 15,
      enabled: true,
      coordinates: { x: 50, y: 250, width: 60, height: 100 },
      description: 'Giám sát cửa thoát khẩn cấp',
      alertThreshold: 'Trung bình',
      autoUpdate: true
    },
    {
      id: 5,
      name: 'Phòng kho',
      type: 'Khu vực hạn chế',
      severity: 'Thấp',
      alertCount: 3,
      enabled: false,
      coordinates: { x: 300, y: 50, width: 70, height: 50 },
      description: 'Khu vực chứa vật dụng tẩy rửa',
      alertThreshold: 'Cao',
      autoUpdate: false
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Cao': return 'border-red-500 bg-red-100'
      case 'Trung bình': return 'border-yellow-500 bg-yellow-100'
      case 'Thấp': return 'border-gray-500 bg-gray-100'
      default: return 'border-gray-500 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🗺️ Quản lý vùng nguy hiểm</h1>
            <p className="text-red-100">Cấu hình và quản lý các vùng an toàn trong trường</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${editMode ? 'bg-white text-red-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <Edit className="w-4 h-4" />
              <span>{editMode ? 'Thoát chỉnh sửa' : 'Chỉnh sửa vùng'}</span>
            </button>

            <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Thêm vùng mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">🗺️ Sơ đồ trường học</h3>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            {/* School Layout Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
              {/* Building Elements */}
              <div className="absolute top-8 left-8 w-32 h-24 bg-blue-200 rounded opacity-50" title="Tòa nhà chính" />
              <div className="absolute top-8 right-8 w-28 h-32 bg-yellow-200 rounded opacity-50" title="Phòng thể dục" />
              <div className="absolute bottom-8 left-8 w-40 h-32 bg-green-200 rounded opacity-50" title="Sân chơi" />
              <div className="absolute bottom-8 right-8 w-36 h-28 bg-purple-200 rounded opacity-50" title="Phòng ăn" />

              {/* Pathways */}
              <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-300 opacity-30" title="Hành lang chính" />
              <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-gray-300 opacity-30" title="Hành lang ngang" />
            </div>

            {/* Danger Zones */}
            {dangerZones.map((zone) => (
              <div
                key={zone.id}
                className={`absolute border-2 border-dashed cursor-pointer transition-all duration-200 ${getSeverityColor(zone.severity)} ${selectedZone === zone.id ? 'ring-2 ring-blue-500' : ''
                  } ${!zone.enabled ? 'opacity-50' : ''}`}
                style={{
                  left: `${zone.coordinates.x}px`,
                  top: `${zone.coordinates.y}px`,
                  width: `${zone.coordinates.width}px`,
                  height: `${zone.coordinates.height}px`
                }}
                onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
                title={zone.name}
              >
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2 h-2 text-white" />
                </div>
                <div className="absolute top-1 left-1 text-xs font-medium text-gray-700">
                  {zone.alertCount}
                </div>
                {editMode && (
                  <div className="absolute -top-1 -right-1 flex space-x-1">
                    <button
                      className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                      title="Chỉnh sửa vùng"
                    >
                      <Edit className="w-2 h-2 text-white" />
                    </button>
                    <button
                      className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                      title="Xóa vùng"
                    >
                      <Trash2 className="w-2 h-2 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Nguy cơ cao</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Nguy cơ trung bình</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Nguy cơ thấp</span>
              </div>
            </div>
            <span>Cập nhật lần cuối: 5 phút trước</span>
          </div>
        </div>

        {/* Zone Configuration */}
        <div className="space-y-6">
          {selectedZone ? (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Cấu hình vùng</h3>

              {dangerZones
                .filter(zone => zone.id === selectedZone)
                .map(zone => (
                  <div key={zone.id} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tên vùng</label>
                      <input
                        type="text"
                        className="input-field"
                        defaultValue={zone.name}
                        title="Nhập tên vùng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại vùng</label>
                      <select className="input-field" defaultValue={zone.type} title="Chọn loại vùng">
                        <option value="Nguy cơ leo trèo">Nguy cơ leo trèo</option>
                        <option value="Nguy cơ ngã">Nguy cơ ngã</option>
                        <option value="Khu vực hạn chế">Khu vực hạn chế</option>
                        <option value="Nguy cơ lang thang">Nguy cơ lang thang</option>
                        <option value="Nguy cơ va chạm">Nguy cơ va chạm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ nghiêm trọng</label>
                      <select className="input-field" defaultValue={zone.severity} title="Chọn mức độ nghiêm trọng">
                        <option value="Cao">Cao</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Thấp">Thấp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ngưỡng cảnh báo</label>
                      <select className="input-field" defaultValue={zone.alertThreshold} title="Chọn ngưỡng cảnh báo">
                        <option value="Thấp">Độ nhạy thấp</option>
                        <option value="Trung bình">Độ nhạy trung bình</option>
                        <option value="Cao">Độ nhạy cao</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        defaultValue={zone.description}
                        title="Nhập mô tả vùng"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Kích hoạt vùng</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={zone.enabled}
                            title="Bật/tắt vùng"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Tự động cập nhật với AI</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={zone.autoUpdate}
                            title="Bật/tắt tự động cập nhật với AI"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tổng cảnh báo:</span>
                        <span className="font-medium">{zone.alertCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tuần này:</span>
                        <span className="font-medium">{Math.floor(zone.alertCount * 0.3)}</span>
                      </div>
                    </div>

                    <button className="w-full btn-primary flex items-center justify-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Tổng quan vùng</h3>
              <p className="text-gray-500 text-center py-8">
                Nhấp vào một vùng nguy hiểm để cấu hình cài đặt
              </p>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Thống kê vùng</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tổng số vùng:</span>
                <span className="text-sm font-medium">{dangerZones.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vùng đang hoạt động:</span>
                <span className="text-sm font-medium text-green-600">
                  {dangerZones.filter(z => z.enabled).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Nguy cơ cao:</span>
                <span className="text-sm font-medium text-red-600">
                  {dangerZones.filter(z => z.severity === 'Cao').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tự học AI:</span>
                <span className="text-sm font-medium text-blue-600">
                  {dangerZones.filter(z => z.autoUpdate).length}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 Trạng thái học AI</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tiến độ học:</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI liên tục phân tích các mô hình và đề xuất cập nhật vùng dựa trên hành vi quan sát được.
              </p>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Đề xuất gần đây từ AI:</p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>• Mở rộng vùng thiết bị sân chơi thêm 15%</li>
                  <li>• Thêm vùng mới gần vòi nước</li>
                  <li>• Giảm độ nhạy cho phòng kho</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDangerZoneManager
