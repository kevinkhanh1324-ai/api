import React, { useState } from 'react'
import { Camera, Play, Pause, SkipBack, SkipForward, Download, Calendar, Clock } from 'lucide-react'

const AdminCameraPlayback: React.FC = () => {
  const [selectedCamera, setSelectedCamera] = useState('classroom-a')
  const [selectedDate, setSelectedDate] = useState('2024-01-15')
  const [selectedTime, setSelectedTime] = useState('10:30')
  const [isPlaying, setIsPlaying] = useState(false)

  const cameras = [
    { id: 'classroom-a', name: 'Phòng học A', location: 'Tòa 1, Phòng 101' },
    { id: 'classroom-b', name: 'Phòng học B', location: 'Tòa 1, Phòng 102' },
    { id: 'playground', name: 'Sân chơi', location: 'Khu vực ngoài trời' },
    { id: 'hallway-1', name: 'Hành lang 1', location: 'Tòa 1, Hành lang chính' },
    { id: 'cafeteria', name: 'Phòng ăn', location: 'Tòa 2, Tầng trệt' },
    { id: 'entrance', name: 'Cổng chính', location: 'Tòa 1, Phía trước' }
  ]

  const alertEvents = [
    {
      id: 1,
      time: '10:30:15',
      type: 'Cảnh báo leo trèo',
      severity: 'Cao',
      child: 'Nguyễn Minh An',
      description: 'Phát hiện trẻ leo lên thiết bị sân chơi'
    },
    {
      id: 2,
      time: '11:15:42',
      type: 'Ra khỏi vùng',
      severity: 'Trung bình',
      child: 'Trần Thị Bích',
      description: 'Trẻ di chuyển ra ngoài khu vực an toàn được chỉ định'
    },
    {
      id: 3,
      time: '14:22:18',
      type: 'Nguy cơ va chạm',
      severity: 'Cao',
      child: 'Lê Văn Đức',
      description: 'Phát hiện nguy cơ va chạm với trẻ khác'
    }
  ]

  const timelineEvents = [
    { time: '09:00', event: 'Bắt đầu lớp học', type: 'normal' },
    { time: '10:30', event: 'Cảnh báo leo trèo', type: 'alert' },
    { time: '11:15', event: 'Cảnh báo ra khỏi vùng', type: 'alert' },
    { time: '12:00', event: 'Giờ ăn trưa', type: 'normal' },
    { time: '14:22', event: 'Nguy cơ va chạm', type: 'alert' },
    { time: '15:30', event: 'Kết thúc lớp học', type: 'normal' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">📹 Xem lại camera & Trích xuất sự kiện</h1>
        <p className="text-gray-300">Xem lại video trong quá khứ và trích xuất các clip liên quan đến sự kiện</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Camera Selection */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🎥 Chọn camera</h3>

            <div className="space-y-2">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${selectedCamera === camera.id
                      ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900 block">{camera.name}</span>
                      <span className="text-xs text-gray-500">{camera.location}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Ngày & Giờ</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày</label>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  title="Chọn ngày để xem lại video"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giờ</label>
                <input
                  type="time"
                  className="input-field"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  title="Chọn giờ để xem lại video"
                />
              </div>

              <button className="w-full btn-primary">Tải video</button>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">📺 Phát lại video</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{selectedDate} lúc {selectedTime}</span>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium">Video đã ghi - {selectedDate}</p>
                  <p className="text-sm opacity-75">Camera: {cameras.find(c => c.id === selectedCamera)?.name}</p>
                </div>
              </div>

              {/* AI Overlay Indicators */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  ✓ Đã theo dõi trẻ em
                </div>
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  ⚠ Vùng nguy hiểm
                </div>
              </div>

              {/* Playback Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
                  <button
                    className="text-white hover:text-blue-300 transition-colors"
                    title="Tua lùi"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    className="text-white hover:text-blue-300 transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? "Tạm dừng" : "Phát"}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button
                    className="text-white hover:text-blue-300 transition-colors"
                    title="Tua tiến"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    className="text-white hover:text-blue-300 transition-colors"
                    title="Tải xuống clip video"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Dòng thời gian</span>
                <span className="text-sm text-gray-500">Thời lượng: 8 giờ</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full">
                <div className="absolute h-2 bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                {timelineEvents.map((event, index) => (
                  <div
                    key={index}
                    className={`absolute w-3 h-3 rounded-full -top-0.5 cursor-pointer ${event.type === 'alert' ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                    style={{ left: `${(index / timelineEvents.length) * 100}%` }}
                    title={`${event.time}: ${event.event}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⏱️ Dòng thời gian sự kiện</h3>

            <div className="space-y-3">
              {timelineEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${event.type === 'alert' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    <div>
                      <span className="font-medium text-gray-900">{event.event}</span>
                      <p className="text-sm text-gray-500">{event.time}</p>
                    </div>
                  </div>
                  <button className="btn-secondary">Nhảy tới</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🚨 Sự kiện cảnh báo</h3>

            <div className="space-y-4">
              {alertEvents.map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{alert.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'Cao' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{alert.child}</span>
                    <span>{alert.time}</span>
                  </div>
                  <button className="w-full mt-2 btn-secondary text-xs">Trích xuất clip</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📤 Tùy chọn xuất</h3>

            <div className="space-y-3">
              <button className="w-full btn-primary">Xuất khung hình hiện tại</button>
              <button className="w-full btn-secondary">Xuất clip cảnh báo</button>
              <button className="w-full btn-secondary">Xuất tất cả ngày</button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Cài đặt xuất</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chất lượng:</span>
                  <span>HD 720p</span>
                </div>
                <div className="flex justify-between">
                  <span>Định dạng:</span>
                  <span>MP4</span>
                </div>
                <div className="flex justify-between">
                  <span>Lớp phủ AI:</span>
                  <span>Đã bật</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCameraPlayback
