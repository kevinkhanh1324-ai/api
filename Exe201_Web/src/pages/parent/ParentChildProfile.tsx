import React, { useState } from 'react'
import { User, Edit, Camera, Calendar, Heart, Award, MapPin, Phone, Mail, X } from 'lucide-react'

const ParentChildProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false)

  const childProfile = {
    name: 'Nguyễn Minh An',
    age: 5,
    birthDate: '15/03/2019',
    class: 'Lớp Mẫu Giáo A',
    teacher: 'Cô Nguyễn Thị Lan',
    startDate: '01/09/2023',
    allergies: ['Đậu phộng', 'Sữa bò'],
    medicalNotes: 'Không có vấn đề sức khỏe đặc biệt',
    emergencyContacts: [
      { name: 'Nguyễn Văn Bình (Bố)', phone: '0901 234 567', relationship: 'Bố' },
      { name: 'Trần Thị Hoa (Mẹ)', phone: '0902 345 678', relationship: 'Mẹ' }
    ],
    achievements: [
      { title: 'Học sinh giỏi tháng 10', date: '31/10/2023', type: 'academic' },
      { title: 'Bé ngoan nhất tuần', date: '15/10/2023', type: 'behavior' },
      { title: 'Giải nhất cuộc thi vẽ', date: '20/09/2023', type: 'creativity' }
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👶 Hồ sơ con em</h1>
            <p className="text-purple-100">Thông tin chi tiết và theo dõi phát triển</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
            title={isEditing ? 'Lưu thay đổi hồ sơ' : 'Chỉnh sửa thông tin hồ sơ'}
          >
            <Edit className="w-4 h-4" />
            <span>{isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
              <button
                className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">{childProfile.name}</h2>
            <p className="text-gray-600 mb-4">{childProfile.class}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tuổi:</span>
                <span className="font-medium">{childProfile.age} tuổi</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Ngày sinh:</span>
                <span className="font-medium">{childProfile.birthDate}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Giáo viên:</span>
                <span className="font-medium">{childProfile.teacher}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="card mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📞 Liên hệ khẩn cấp</h3>
            <div className="space-y-3">
              {childProfile.emergencyContacts.map((contact, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {contact.relationship}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{contact.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Thông tin cơ bản</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    defaultValue={childProfile.name}
                    title="Nhập họ và tên đầy đủ của trẻ"
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg">{childProfile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                {isEditing ? (
                  <input
                    type="date"
                    className="input-field"
                    title="Chọn ngày sinh của trẻ"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg">{childProfile.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lớp học</label>
                {isEditing ? (
                  <select
                    className="input-field"
                    title="Chọn lớp học của trẻ"
                  >
                    <option>{childProfile.class}</option>
                    <option>Lớp Mẫu Giáo B</option>
                    <option>Lớp Chồi A</option>
                  </select>
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg">{childProfile.class}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày nhập học</label>
                {isEditing ? (
                  <input
                    type="date"
                    className="input-field"
                    title="Chọn ngày nhập học"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg">{childProfile.startDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🏥 Thông tin y tế</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dị ứng</label>
                {isEditing ? (
                  <div className="space-y-2">
                    {childProfile.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="input-field flex-1"
                          defaultValue={allergy}
                          title={`Chỉnh sửa dị ứng ${index + 1}`}
                          placeholder="Nhập loại dị ứng"
                        />
                        <button
                          className="text-red-500 hover:text-red-700"
                          title={`Xóa dị ứng ${allergy}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Thêm dị ứng mới"
                    >
                      + Thêm dị ứng
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {childProfile.allergies.map((allergy, index) => (
                      <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                        {allergy}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú y tế</label>
                {isEditing ? (
                  <textarea
                    className="input-field"
                    rows={3}
                    defaultValue={childProfile.medicalNotes}
                    title="Nhập ghi chú y tế"
                    placeholder="Nhập thông tin y tế quan trọng"
                  />
                ) : (
                  <p className="p-3 bg-gray-50 rounded-lg">{childProfile.medicalNotes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Thành tích và khen thưởng</h3>

            <div className="space-y-3">
              {childProfile.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex-shrink-0">
                    {achievement.type === 'academic' && (
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {achievement.type === 'behavior' && (
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {achievement.type === 'creativity' && (
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-500 flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{achievement.date}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParentChildProfile
