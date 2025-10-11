import React, { useState } from 'react'
import { BarChart3, Download, Calendar, Filter, TrendingUp, Users, AlertTriangle } from 'lucide-react'

const AdminReports: React.FC = () => {
  const [reportType, setReportType] = useState('behavior')
  const [timeRange, setTimeRange] = useState('week')

  const reportData = {
    behavior: {
      totalAlerts: 156,
      resolvedAlerts: 142,
      averagePerDay: 22,
      mostCommonType: 'Leo trèo'
    },
    class: {
      totalClasses: 12,
      averageStudents: 21,
      highestAlerts: 'Lớp Mẫu Giáo A',
      lowestAlerts: 'Lớp Lá B'
    },
    safety: {
      incidentRate: 2.3,
      responseTime: '3.2 phút',
      resolutionRate: 91,
      criticalAlerts: 8
    }
  }

  const classComparison = [
    { class: 'Lớp Mẫu Giáo A', alerts: 45, trend: 'up', students: 22 },
    { class: 'Lớp Mẫu Giáo B', alerts: 32, trend: 'down', students: 20 },
    { class: 'Lớp Chồi A', alerts: 28, trend: 'stable', students: 25 },
    { class: 'Lớp Chồi B', alerts: 19, trend: 'down', students: 23 },
    { class: 'Lớp Lá A', alerts: 15, trend: 'down', students: 24 },
    { class: 'Lớp Lá B', alerts: 12, trend: 'stable', students: 21 }
  ]

  const behaviorTrends = [
    { type: 'Leo trèo', count: 67, percentage: 43, trend: 'up' },
    { type: 'Ra khỏi vùng an toàn', count: 34, percentage: 22, trend: 'down' },
    { type: 'Lang thang', count: 28, percentage: 18, trend: 'stable' },
    { type: 'Nguy cơ va chạm', count: 19, percentage: 12, trend: 'up' },
    { type: 'Khác', count: 8, percentage: 5, trend: 'down' }
  ]

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈'
    if (trend === 'down') return '📉'
    return '➡️'
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-red-600'
    if (trend === 'down') return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📊 Báo cáo hệ thống</h1>
            <p className="text-blue-100">Phân tích chi tiết và báo cáo toàn diện</p>
          </div>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">⚙️ Cấu hình báo cáo</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại báo cáo</label>
            <select
              className="input-field"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              title="Chọn loại báo cáo"
            >
              <option value="behavior">Phân tích hành vi</option>
              <option value="class">So sánh lớp học</option>
              <option value="safety">Chỉ số an toàn</option>
              <option value="system">Hiệu suất hệ thống</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
            <select
              className="input-field"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              title="Chọn khoảng thời gian"
            >
              <option value="day">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bộ lọc lớp</label>
            <select className="input-field" title="Chọn bộ lọc lớp">
              <option value="all">Tất cả lớp</option>
              <option value="kg">Chỉ Mẫu Giáo</option>
              <option value="grade1">Chỉ Lớp Chồi</option>
              <option value="grade2">Chỉ Lớp Lá</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng</label>
            <select className="input-field" title="Chọn định dạng xuất">
              <option value="pdf">Báo cáo PDF</option>
              <option value="excel">Bảng tính Excel</option>
              <option value="csv">Dữ liệu CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Tổng cảnh báo</p>
              <p className="text-3xl font-bold text-blue-900">{reportData.behavior.totalAlerts}</p>
              <p className="text-sm text-green-600">+12% từ tuần trước</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Tỷ lệ giải quyết</p>
              <p className="text-3xl font-bold text-green-900">91%</p>
              <p className="text-sm text-green-600">+3% cải thiện</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Thời gian phản hồi TB</p>
              <p className="text-3xl font-bold text-yellow-900">3.2p</p>
              <p className="text-sm text-yellow-600">-0.5p nhanh hơn</p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-full">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Học sinh đang học</p>
              <p className="text-3xl font-bold text-purple-900">245</p>
              <p className="text-sm text-purple-600">Trên 12 lớp</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-full">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Comparison */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📊 So sánh lớp học</h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>

          <div className="space-y-4">
            {classComparison.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.class}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{item.alerts} cảnh báo</span>
                      <span className={`text-xs ${getTrendColor(item.trend)}`}>
                        {getTrendIcon(item.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.alerts / 50) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.students} học sinh</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Trends */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">📈 Xu hướng hành vi</h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>

          <div className="space-y-4">
            {behaviorTrends.map((behavior, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{behavior.type}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{behavior.count} ({behavior.percentage}%)</span>
                      <span className={`text-xs ${getTrendColor(behavior.trend)}`}>
                        {getTrendIcon(behavior.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${behavior.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Phân tích chi tiết</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">⏰ Thời gian hoạt động cao nhất</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 10:00 - 11:00 (Giờ chơi ngoài trời)</li>
              <li>• 14:00 - 15:00 (Hoạt động chiều)</li>
              <li>• 11:30 - 12:30 (Giờ ăn trưa)</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Vấn đề cần quan tâm</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Leo trèo thiết bị sân chơi</li>
              <li>• Lang thang trong hành lang</li>
              <li>• Nguy cơ va chạm tại phòng ăn</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✅ Cải thiện đáng chú ý</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Giảm 15% cảnh báo ra khỏi vùng</li>
              <li>• Thời gian phản hồi nhanh hơn</li>
              <li>• Giao tiếp với phụ huynh tốt hơn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📥 Tùy chọn xuất dữ liệu</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors group">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700">Báo cáo tuần</span>
          </button>

          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors group">
            <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700">Phân tích tháng</span>
          </button>

          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors group">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700">Tóm tắt lớp</span>
          </button>

          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-xl text-center transition-colors group">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-red-700">Báo cáo an toàn</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
