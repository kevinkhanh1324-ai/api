import React, { useState } from 'react'
import { Mail, Send, Users, AlertTriangle, Calendar, MessageSquare, Bell, Phone } from 'lucide-react'

const AdminCommunicationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compose')
  const [messageType, setMessageType] = useState('general')
  const [recipients, setRecipients] = useState('all-parents')

  const messageTemplates = [
    {
      id: 1,
      name: 'Cảnh báo khẩn cấp',
      type: 'emergency',
      subject: 'KHẨN CẤP: Tình huống cần xử lý ngay',
      content: 'Chúng tôi đang xử lý một tình huống khẩn cấp. Vui lòng làm theo hướng dẫn của nhân viên trường.'
    },
    {
      id: 2,
      name: 'Báo cáo hàng tuần',
      type: 'report',
      subject: 'Báo cáo an toàn tuần - Tuần [NGÀY]',
      content: 'Tóm tắt an toàn tuần này bao gồm báo cáo hoạt động và các sự cố đã xảy ra.'
    },
    {
      id: 3,
      name: 'Bảo trì hệ thống',
      type: 'maintenance',
      subject: 'Thông báo bảo trì hệ thống theo lịch',
      content: 'Hệ thống giám sát sẽ được bảo trì vào [NGÀY] từ [GIỜ] đến [GIỜ].'
    }
  ]

  const recentMessages = [
    {
      id: 1,
      type: 'Cảnh báo thời tiết',
      recipients: 'Tất cả phụ huynh',
      subject: 'Cảnh báo thời tiết xấu',
      sentAt: '2 giờ trước',
      status: 'delivered',
      readRate: 95
    },
    {
      id: 2,
      type: 'Báo cáo hàng tuần',
      recipients: 'Phụ huynh Lớp Mẫu Giáo A',
      subject: 'Tóm tắt an toàn hàng tuần',
      sentAt: '1 ngày trước',
      status: 'delivered',
      readRate: 87
    },
    {
      id: 3,
      type: 'Báo cáo sự cố',
      recipients: 'Phụ huynh cá nhân',
      subject: 'Báo cáo sự cố nhỏ - Nguyễn Minh An',
      sentAt: '2 ngày trước',
      status: 'delivered',
      readRate: 100
    }
  ]

  const recipientGroups = [
    { id: 'all-parents', name: 'Tất cả phụ huynh', count: 245 },
    { id: 'all-teachers', name: 'Tất cả giáo viên', count: 12 },
    { id: 'kg-parents', name: 'Phụ huynh Mẫu Giáo', count: 84 },
    { id: 'grade1-parents', name: 'Phụ huynh Lớp Chồi', count: 96 },
    { id: 'grade2-parents', name: 'Phụ huynh Lớp Lá', count: 65 },
    { id: 'high-alert-parents', name: 'Phụ huynh cảnh báo cao', count: 15 }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">📢 Trung tâm liên lạc</h1>
        <p className="text-teal-100">Gửi cảnh báo, báo cáo và tin nhắn đến phụ huynh và nhân viên</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'compose'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Mail className="w-4 h-4" />
            <span>Soạn tin nhắn</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'templates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mẫu tin nhắn</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch sử tin nhắn</span>
          </button>
        </nav>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Form */}
          <section className="lg:col-span-2 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✍️ Soạn tin nhắn mới</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại tin nhắn</label>
                  <select
                    className="input-field"
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    title="Chọn loại tin nhắn"
                  >
                    <option value="general">Thông báo chung</option>
                    <option value="emergency">Cảnh báo khẩn cấp</option>
                    <option value="report">Báo cáo hàng tuần</option>
                    <option value="incident">Báo cáo sự cố</option>
                    <option value="maintenance">Bảo trì hệ thống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Người nhận</label>
                  <select
                    className="input-field"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    title="Chọn người nhận tin nhắn"
                  >
                    {recipientGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nhập tiêu đề tin nhắn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
                <textarea
                  className="input-field"
                  rows={8}
                  placeholder="Nhập nội dung tin nhắn tại đây..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email" className="rounded border-gray-300" defaultChecked />
                  <label htmlFor="email" className="text-sm text-gray-700">Gửi qua Email</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sms" className="rounded border-gray-300" />
                  <label htmlFor="sms" className="text-sm text-gray-700">Gửi qua SMS</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="app" className="rounded border-gray-300" defaultChecked />
                  <label htmlFor="app" className="text-sm text-gray-700">Gửi qua App</label>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button className="btn-primary flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Gửi tin nhắn</span>
                </button>
                <button className="btn-secondary">Lưu nháp</button>
                <button className="btn-secondary">Xem trước</button>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <aside className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Thao tác nhanh</h3>

              <div className="space-y-3">
                <button className="w-full p-3 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Cảnh báo khẩn cấp</p>
                      <p className="text-xs text-red-600">Gửi ngay lập tức cho tất cả</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Báo cáo hàng tuần</p>
                      <p className="text-xs text-blue-600">Tạo và gửi báo cáo</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Thông báo hệ thống</p>
                      <p className="text-xs text-yellow-600">Bảo trì hoặc cập nhật</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Thống kê người nhận</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tổng phụ huynh:</span>
                  <span className="text-sm font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tổng giáo viên:</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phụ huynh cảnh báo cao:</span>
                  <span className="text-sm font-medium text-orange-600">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tỷ lệ gửi Email:</span>
                  <span className="text-sm font-medium text-green-600">98%</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messageTemplates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.type === 'emergency' ? 'bg-red-100 text-red-700' :
                  template.type === 'report' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                  {template.type === 'emergency' ? 'Khẩn cấp' :
                    template.type === 'report' ? 'Báo cáo' : 'Khác'}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-900 mb-2">{template.subject}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.content}</p>

              <div className="flex space-x-2">
                <button className="btn-primary flex-1">Sử dụng mẫu</button>
                <button className="btn-secondary">Chỉnh sửa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {recentMessages.map((message) => (
            <div key={message.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Đã gửi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Loại:</span> {message.type}
                    </div>
                    <div>
                      <span className="font-medium">Người nhận:</span> {message.recipients}
                    </div>
                    <div>
                      <span className="font-medium">Gửi lúc:</span> {message.sentAt}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Tỷ lệ đọc:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${message.readRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{message.readRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button className="btn-secondary">Xem chi tiết</button>
                  <button className="btn-secondary">Gửi lại</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminCommunicationCenter
