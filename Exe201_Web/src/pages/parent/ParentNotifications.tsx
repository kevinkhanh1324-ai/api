import React, { useState } from 'react'
import { MessageSquare, Send, Phone, Mail, Bell, Clock, User, AlertTriangle } from 'lucide-react'

const ParentNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('messages')
  const [newMessage, setNewMessage] = useState('')

  const messages = [
    {
      id: 1,
      from: 'Cô Nguyễn Thị Lan',
      subject: 'Báo cáo tiến bộ của bé An',
      message: 'Hôm nay bé An có một ngày học rất tuyệt vời! Bé tham gia tích cực vào giờ đọc sách và có tiến bộ đáng kể trong giao tiếp với bạn bè.',
      timestamp: '2 giờ trước',
      read: false,
      type: 'message'
    },
    {
      id: 2,
      from: 'Hệ thống cảnh báo',
      subject: 'Cảnh báo leo trèo đã được xử lý',
      message: 'Cảnh báo leo trèo từ sân chơi đã được xem xét và đánh dấu đã giải quyết. Bé An đã được giám sát an toàn trong giờ chơi.',
      timestamp: '4 giờ trước',
      read: true,
      type: 'alert'
    },
    {
      id: 3,
      from: 'Ban giám hiệu',
      subject: 'Báo cáo tuần đã có',
      message: 'Báo cáo hành vi hàng tuần của con em đã sẵn sàng. Bạn có thể xem trong phần Báo cáo.',
      timestamp: '1 ngày trước',
      read: true,
      type: 'notification'
    },
    {
      id: 4,
      from: 'Cô Nguyễn Thị Lan',
      subject: 'Nhắc nhở đón con',
      message: 'Nhắc nhở thân thiện rằng giờ đón con hôm nay là 15:30. Bé An sẽ chờ ở lớp học chính.',
      timestamp: '2 ngày trước',
      read: true,
      type: 'message'
    }
  ]

  const notifications = [
    {
      id: 1,
      title: 'Cảnh báo mức độ cao',
      message: 'Phát hiện hành vi leo trèo tại khu vực sân chơi',
      timestamp: '1 giờ trước',
      priority: 'high',
      read: false
    },
    {
      id: 2,
      title: 'Báo cáo tuần sẵn sàng',
      message: 'Phân tích hành vi hàng tuần của con em đã có',
      timestamp: '3 giờ trước',
      priority: 'medium',
      read: false
    },
    {
      id: 3,
      title: 'Cập nhật hệ thống',
      message: 'Bảo trì hệ thống camera đã hoàn thành thành công',
      timestamp: '6 giờ trước',
      priority: 'low',
      read: true
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger-100 text-danger-700'
      case 'medium': return 'bg-warning-100 text-warning-700'
      case 'low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />
      case 'alert': return <Bell className="w-4 h-4" />
      case 'notification': return <Mail className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">💬 Thông báo & Tin nhắn</h1>
        <p className="text-green-100">Kết nối với giáo viên và nhận cập nhật quan trọng</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tin nhắn</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
        </nav>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <section className="lg:col-span-2 space-y-4">
            {messages.map((message) => (
              <article key={message.id} className={`card cursor-pointer transition-colors hover:bg-gray-50 ${!message.read ? 'border-blue-200 bg-blue-50' : ''
                }`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {getTypeIcon(message.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">{message.from}</h3>
                        {!message.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{message.timestamp}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mt-1">{message.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.message}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* Chat/Compose */}
          <aside className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Gửi tin nhắn</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gửi đến</label>
                  <select className="input-field" title="Chọn người nhận tin nhắn">
                    <option>Cô Nguyễn Thị Lan</option>
                    <option>Ban giám hiệu</option>
                    <option>Hiệu trưởng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                  <input type="text" className="input-field" placeholder="Nhập tiêu đề" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Nhập nội dung tin nhắn tại đây..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>

                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Gửi tin nhắn</span>
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Thao tác nhanh</h3>

              <div className="space-y-3">
                <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Yêu cầu gọi điện</p>
                      <p className="text-xs text-blue-600">Lên lịch cuộc gọi</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Báo cáo vấn đề</p>
                      <p className="text-xs text-yellow-600">Báo cáo mối quan tâm</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Tin nhắn nhanh</p>
                      <p className="text-xs text-green-600">Gửi tin nhắn nhanh</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <article key={notification.id} className={`card cursor-pointer transition-colors hover:bg-gray-50 ${!notification.read ? 'border-blue-200 bg-blue-50' : ''
              }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.priority === 'high' ? 'bg-red-100' :
                      notification.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-gray-100'
                    }`}>
                    <Bell className={`w-5 h-5 ${notification.priority === 'high' ? 'text-red-600' :
                        notification.priority === 'medium' ? 'text-yellow-600' :
                          'text-gray-600'
                      }`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{notification.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      Mức độ {notification.priority === 'high' ? 'cao' : notification.priority === 'medium' ? 'trung bình' : 'thấp'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default ParentNotifications
