import React, { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Filter, User, Camera, X } from 'lucide-react'

const AdminClassManagement: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  
  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    age: '',
    birthDate: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    class: '',
    address: '',
    emergencyContact: ''
  })
  
  const [newClass, setNewClass] = useState({
    name: '',
    teacher: '',
    ageRange: '',
    room: '',
    capacity: '',
    description: ''
  })

  const classes = [
    {
      id: 'kg-a',
      name: 'Lớp Mẫu Giáo A',
      teacher: 'Nguyễn Thị Lan',
      studentCount: 22,
      ageRange: '4-5 tuổi',
      room: 'Phòng 101'
    },
    {
      id: 'kg-b',
      name: 'Lớp Mẫu Giáo B',
      teacher: 'Trần Văn Minh',
      studentCount: 20,
      ageRange: '4-5 tuổi',
      room: 'Phòng 102'
    },
    {
      id: 'g1-a',
      name: 'Lớp Chồi A',
      teacher: 'Lê Thị Hạnh',
      studentCount: 25,
      ageRange: '5-6 tuổi',
      room: 'Phòng 201'
    },
    {
      id: 'g1-b',
      name: 'Lớp Chồi B',
      teacher: 'Phạm Văn Dũng',
      studentCount: 23,
      ageRange: '5-6 tuổi',
      room: 'Phòng 202'
    }
  ]

  const students = [
    {
      id: 1,
      name: 'Nguyễn Minh An',
      age: 5,
      class: 'kg-a',
      birthDate: '2019-03-15',
      parentName: 'Nguyễn Văn Bình',
      parentPhone: '0901 234 567',
      hasPhoto: true,
      alertCount: 12
    },
    {
      id: 2,
      name: 'Trần Thị Bích',
      age: 5,
      class: 'kg-a',
      birthDate: '2019-05-22',
      parentName: 'Trần Văn Minh',
      parentPhone: '0902 345 678',
      hasPhoto: true,
      alertCount: 8
    },
    {
      id: 3,
      name: 'Lê Văn Đức',
      age: 4,
      class: 'kg-a',
      birthDate: '2019-08-10',
      parentName: 'Lê Thị Hạnh',
      parentPhone: '0903 456 789',
      hasPhoto: false,
      alertCount: 15
    }
  ]

  const filteredStudents = selectedClass
    ? students.filter(student => student.class === selectedClass)
    : students

  // Handle form submissions
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Adding student:', newStudent)
    setShowAddStudentModal(false)
    setNewStudent({
      name: '',
      age: '',
      birthDate: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      class: '',
      address: '',
      emergencyContact: ''
    })
    alert('Học sinh đã được thêm thành công!')
  }

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Adding class:', newClass)
    setShowAddClassModal(false)
    setNewClass({
      name: '',
      teacher: '',
      ageRange: '',
      room: '',
      capacity: '',
      description: ''
    })
    alert('Lớp học đã được tạo thành công!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý lớp học & học sinh</h1>
          <p className="text-gray-600 mt-2">Quản lý lớp, học sinh và hồ sơ cá nhân</p>
        </div>

        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowAddStudentModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Thêm học sinh mới</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Danh sách lớp */}
        <aside className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách lớp</h2>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedClass(null)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${selectedClass === null
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Tất cả học sinh</span>
                  <span className="text-sm text-gray-500">{students.length}</span>
                </div>
              </button>

              {classes.map((classItem) => (
                <button
                  key={classItem.id}
                  onClick={() => setSelectedClass(classItem.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${selectedClass === classItem.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{classItem.name}</span>
                      <p className="text-xs text-gray-500">{classItem.teacher}</p>
                    </div>
                    <span className="text-sm text-gray-500">{classItem.studentCount}</span>
                  </div>
                </button>
              ))}
            </div>

            <button 
              className="w-full mt-4 btn-secondary flex items-center justify-center space-x-2"
              onClick={() => setShowAddClassModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm lớp học</span>
            </button>
          </div>
        </aside>

        {/* Quản lý học sinh */}
        <main className="lg:col-span-3 space-y-6">
          {/* Tìm kiếm và bộ lọc */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-secondary flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Bộ lọc</span>
              </button>
            </div>
          </div>

          {/* Thông tin lớp */}
          {selectedClass && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {classes.find(c => c.id === selectedClass)?.name} - Thông tin lớp
                </h2>
                <button className="btn-secondary flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Chỉnh sửa lớp</span>
                </button>
              </div>

              {classes
                .filter(c => c.id === selectedClass)
                .map(classItem => (
                  <div key={classItem.id} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Giáo viên chủ nhiệm</p>
                      <p className="font-medium">{classItem.teacher}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sĩ số</p>
                      <p className="font-medium">{classItem.studentCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Độ tuổi</p>
                      <p className="font-medium">{classItem.ageRange}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phòng học</p>
                      <p className="font-medium">{classItem.room}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Danh sách học sinh */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedClass ? 'Học sinh trong lớp' : 'Tất cả học sinh'}
              </h2>
              <span className="text-sm text-gray-500">
                {filteredStudents.length} học sinh
              </span>
            </div>

            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {student.hasPhoto ? (
                        <Camera className="w-6 h-6 text-gray-400" />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">
                        Tuổi {student.age} • Ngày sinh: {student.birthDate}
                      </p>
                      <p className="text-sm text-gray-500">
                        Phụ huynh: {student.parentName} • {student.parentPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{student.alertCount} cảnh báo</p>
                      <p className="text-xs text-gray-500">Tháng này</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Chỉnh sửa học sinh"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trạng thái nhận diện khuôn mặt */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trạng thái nhận diện khuôn mặt</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.hasPhoto).length}
                </div>
                <div className="text-sm text-green-700">Có ảnh</div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => !s.hasPhoto).length}
                </div>
                <div className="text-sm text-yellow-700">Thiếu ảnh</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((students.filter(s => s.hasPhoto).length / students.length) * 100)}%
                </div>
                <div className="text-sm text-blue-700">Sẵn sàng nhận diện</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal thêm học sinh */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Thêm học sinh mới</h2>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Nhập họ và tên học sinh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tuổi *
                  </label>
                  <input
                    type="number"
                    required
                    min="3"
                    max="7"
                    className="input-field"
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                    placeholder="Nhập tuổi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={newStudent.birthDate}
                    onChange={(e) => setNewStudent({ ...newStudent, birthDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lớp học *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                  >
                    <option value="">Chọn lớp học</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên phụ huynh *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                    placeholder="Nhập họ tên phụ huynh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại phụ huynh *
                  </label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    value={newStudent.parentPhone}
                    onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                    placeholder="0901 234 567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email phụ huynh
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={newStudent.parentEmail}
                    onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={newStudent.emergencyContact}
                    onChange={(e) => setNewStudent({ ...newStudent, emergencyContact: e.target.value })}
                    placeholder="0901 234 567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={newStudent.address}
                  onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                  placeholder="Nhập địa chỉ nhà"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm lớp học */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tạo lớp học mới</h2>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="Ví dụ: Lớp Mẫu Giáo C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giáo viên chủ nhiệm *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  placeholder="Nhập họ tên giáo viên"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ tuổi *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={newClass.ageRange}
                    onChange={(e) => setNewClass({ ...newClass, ageRange: e.target.value })}
                  >
                    <option value="">Chọn độ tuổi</option>
                    <option value="3-4 tuổi">3-4 tuổi</option>
                    <option value="4-5 tuổi">4-5 tuổi</option>
                    <option value="5-6 tuổi">5-6 tuổi</option>
                    <option value="6-7 tuổi">6-7 tuổi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng học *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder="Ví dụ: Phòng 103"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sĩ số tối đa *
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  max="30"
                  className="input-field"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                  placeholder="Ví dụ: 25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Mô tả về lớp học (tùy chọn)"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminClassManagement
