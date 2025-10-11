import React, { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Filter, Baby, Eye, Mail, Phone, X, MapPin, Calendar } from 'lucide-react'

const AdminParentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAddParentModal, setShowAddParentModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState<any>(null)
  
  // Form state
  const [newParent, setNewParent] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    relationship: 'mother',
    childName: '',
    childAge: '',
    childClass: '',
    emergencyContact: '',
    permissions: [] as string[]
  })

  const parents = [
    {
      id: 1,
      name: 'Lê Thị Hạnh',
      email: 'hanh.le@gmail.com',
      phone: '0903 456 789',
      address: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
      relationship: 'mother',
      status: 'active',
      joinDate: '2023-08-15',
      lastLogin: '2024-01-15 16:20',
      children: [
        {
          name: 'Lê Văn Đức',
          age: 4,
          class: 'Lớp Mẫu Giáo A',
          studentId: 'MG001'
        }
      ],
      emergencyContact: '0901 111 222',
      permissions: ['view_child', 'receive_alerts', 'view_reports']
    },
    {
      id: 2,
      name: 'Nguyễn Văn Minh',
      email: 'minh.nguyen@gmail.com',
      phone: '0904 567 890',
      address: '456 Đường Lê Văn Việt, Quận 9, TP.HCM',
      relationship: 'father',
      status: 'active',
      joinDate: '2023-09-10',
      lastLogin: '2024-01-15 14:45',
      children: [
        {
          name: 'Nguyễn Thị Mai',
          age: 5,
          class: 'Lớp Chồi A',
          studentId: 'CH001'
        }
      ],
      emergencyContact: '0902 222 333',
      permissions: ['view_child', 'receive_alerts']
    },
    {
      id: 3,
      name: 'Trần Thị Lan',
      email: 'lan.tran@gmail.com',
      phone: '0905 678 901',
      address: '789 Đường Võ Văn Kiệt, Quận 5, TP.HCM',
      relationship: 'mother',
      status: 'active',
      joinDate: '2023-07-20',
      lastLogin: '2024-01-15 18:30',
      children: [
        {
          name: 'Trần Văn Nam',
          age: 3,
          class: 'Lớp Mẫu Giáo B',
          studentId: 'MG002'
        },
        {
          name: 'Trần Thị Hoa',
          age: 5,
          class: 'Lớp Chồi B',
          studentId: 'CH002'
        }
      ],
      emergencyContact: '0903 333 444',
      permissions: ['view_child', 'receive_alerts', 'view_reports', 'communication']
    },
    {
      id: 4,
      name: 'Phạm Văn Dũng',
      email: 'dung.pham@gmail.com',
      phone: '0906 789 012',
      address: '321 Đường Điện Biên Phủ, Quận 3, TP.HCM',
      relationship: 'father',
      status: 'inactive',
      joinDate: '2023-06-05',
      lastLogin: '2024-01-10 10:15',
      children: [
        {
          name: 'Phạm Thị Linh',
          age: 4,
          class: 'Lớp Mẫu Giáo A',
          studentId: 'MG003'
        }
      ],
      emergencyContact: '0904 444 555',
      permissions: ['view_child']
    }
  ]

  const classes = [
    { id: 'kg-a', name: 'Lớp Mẫu Giáo A' },
    { id: 'kg-b', name: 'Lớp Mẫu Giáo B' },
    { id: 'g1-a', name: 'Lớp Chồi A' },
    { id: 'g1-b', name: 'Lớp Chồi B' }
  ]

  const parentStats = {
    total: parents.length,
    active: parents.filter(p => p.status === 'active').length,
    inactive: parents.filter(p => p.status === 'inactive').length,
    totalChildren: parents.reduce((sum, p) => sum + p.children.length, 0),
    mothers: parents.filter(p => p.relationship === 'mother').length,
    fathers: parents.filter(p => p.relationship === 'father').length
  }

  const getRelationshipIcon = (relationship: string) => {
    return relationship === 'mother' ? '👩' : '👨'
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200'
  }

  const handleAddParent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newParent.password !== newParent.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newParent.email)) {
      alert('Email không hợp lệ!')
      return
    }
    
    console.log('Adding parent:', newParent)
    setShowAddParentModal(false)
    setNewParent({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      relationship: 'mother',
      childName: '',
      childAge: '',
      childClass: '',
      emergencyContact: '',
      permissions: []
    })
    alert('Phụ huynh đã được thêm thành công!')
  }

  const handleViewDetail = (parent: any) => {
    setSelectedParent(parent)
    setShowDetailModal(true)
  }

  const filteredParents = parents.filter(parent => {
    const matchesSearch = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.children.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === 'all' || parent.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👨‍👩‍👧‍👦 Quản lý phụ huynh</h1>
            <p className="text-green-100">Quản lý thông tin và hoạt động của phụ huynh học sinh</p>
          </div>
          <button 
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
            onClick={() => setShowAddParentModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phụ huynh</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{parentStats.total}</div>
            <div className="text-sm text-green-600">Tổng phụ huynh</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-700">{parentStats.active}</div>
            <div className="text-sm text-emerald-600">Đang hoạt động</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">{parentStats.inactive}</div>
            <div className="text-sm text-red-600">Tạm dừng</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{parentStats.totalChildren}</div>
            <div className="text-sm text-blue-600">Tổng học sinh</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-700">{parentStats.mothers}</div>
            <div className="text-sm text-pink-600">Mẹ</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-700">{parentStats.fathers}</div>
            <div className="text-sm text-indigo-600">Bố</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🔍 Tìm kiếm và bộ lọc</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Tìm theo tên phụ huynh, email hoặc tên con..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">👥 Danh sách phụ huynh ({filteredParents.length})</h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Phụ huynh</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Con em</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Mối quan hệ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Liên hệ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-2">
                    <div>
                      <div className="font-medium text-gray-900">{parent.name}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <Mail className="w-3 h-3" />
                        <span>{parent.email}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-32">{parent.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="space-y-1">
                      {parent.children.map((child, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Baby className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium">{child.name}</div>
                            <div className="text-xs text-gray-500">
                              {child.age} tuổi - {child.class}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRelationshipIcon(parent.relationship)}</span>
                      <span className="text-sm font-medium">
                        {parent.relationship === 'mother' ? 'Mẹ' : 'Bố'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{parent.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">SOS:</span>
                        <span className="text-xs">{parent.emergencyContact}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(parent.status)}`}>
                      {parent.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => handleViewDetail(parent)}
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">➕ Thêm phụ huynh mới</h3>
              <button
                onClick={() => setShowAddParentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParent} className="space-y-4">
              {/* Parent Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin phụ huynh</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newParent.name}
                      onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      value={newParent.email}
                      onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                      placeholder="parent@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      className="input-field"
                      value={newParent.phone}
                      onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                      placeholder="0901 234 567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mối quan hệ *
                    </label>
                    <select
                      required
                      className="input-field"
                      value={newParent.relationship}
                      onChange={(e) => setNewParent({ ...newParent, relationship: e.target.value })}
                    >
                      <option value="mother">Mẹ</option>
                      <option value="father">Bố</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số liên lạc khẩn cấp
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      value={newParent.emergencyContact}
                      onChange={(e) => setNewParent({ ...newParent, emergencyContact: e.target.value })}
                      placeholder="0901 111 222"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newParent.address}
                    onChange={(e) => setNewParent({ ...newParent, address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  />
                </div>
              </div>

              {/* Child Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin con em</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên con *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newParent.childName}
                      onChange={(e) => setNewParent({ ...newParent, childName: e.target.value })}
                      placeholder="Nguyễn Văn B"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tuổi *
                    </label>
                    <input
                      type="number"
                      required
                      min="2"
                      max="6"
                      className="input-field"
                      value={newParent.childAge}
                      onChange={(e) => setNewParent({ ...newParent, childAge: e.target.value })}
                      placeholder="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lớp *
                    </label>
                    <select
                      required
                      className="input-field"
                      value={newParent.childClass}
                      onChange={(e) => setNewParent({ ...newParent, childClass: e.target.value })}
                    >
                      <option value="">Chọn lớp</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.name}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin tài khoản</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="input-field"
                      value={newParent.password}
                      onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={newParent.confirmPassword}
                      onChange={(e) => setNewParent({ ...newParent, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quyền truy cập
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newParent.permissions.includes('view_child')}
                      onChange={(e) => {
                        const perms = e.target.checked 
                          ? [...newParent.permissions, 'view_child']
                          : newParent.permissions.filter(p => p !== 'view_child')
                        setNewParent({ ...newParent, permissions: perms })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Xem thông tin con</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newParent.permissions.includes('receive_alerts')}
                      onChange={(e) => {
                        const perms = e.target.checked 
                          ? [...newParent.permissions, 'receive_alerts']
                          : newParent.permissions.filter(p => p !== 'receive_alerts')
                        setNewParent({ ...newParent, permissions: perms })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Nhận cảnh báo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newParent.permissions.includes('view_reports')}
                      onChange={(e) => {
                        const perms = e.target.checked 
                          ? [...newParent.permissions, 'view_reports']
                          : newParent.permissions.filter(p => p !== 'view_reports')
                        setNewParent({ ...newParent, permissions: perms })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Xem báo cáo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newParent.permissions.includes('communication')}
                      onChange={(e) => {
                        const perms = e.target.checked 
                          ? [...newParent.permissions, 'communication']
                          : newParent.permissions.filter(p => p !== 'communication')
                        setNewParent({ ...newParent, permissions: perms })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Liên lạc với giáo viên</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Thêm phụ huynh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Detail Modal */}
      {showDetailModal && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">👨‍👩‍👧‍👦 Chi tiết phụ huynh</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="card bg-green-50 border-green-200">
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Họ tên:</span>
                    <p className="text-gray-900">{selectedParent.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{selectedParent.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Điện thoại:</span>
                    <p className="text-gray-900">{selectedParent.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Mối quan hệ:</span>
                    <p className="text-gray-900 flex items-center space-x-2">
                      <span>{getRelationshipIcon(selectedParent.relationship)}</span>
                      <span>{selectedParent.relationship === 'mother' ? 'Mẹ' : 'Bố'}</span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Địa chỉ:</span>
                    <p className="text-gray-900">{selectedParent.address}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Liên lạc khẩn cấp:</span>
                    <p className="text-gray-900">{selectedParent.emergencyContact}</p>
                  </div>
                </div>
              </div>

              {/* Children Info */}
              <div className="card bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin con em</h4>
                <div className="space-y-3">
                  {selectedParent.children.map((child: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Tên:</span>
                          <p className="text-gray-900">{child.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Tuổi:</span>
                          <p className="text-gray-900">{child.age} tuổi</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Lớp:</span>
                          <p className="text-gray-900">{child.class}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="card bg-purple-50 border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3">Quyền truy cập</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedParent.permissions.map((permission: string) => (
                    <span key={permission} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {permission === 'view_child' && 'Xem thông tin con'}
                      {permission === 'receive_alerts' && 'Nhận cảnh báo'}
                      {permission === 'view_reports' && 'Xem báo cáo'}
                      {permission === 'communication' && 'Liên lạc với giáo viên'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div className="card bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-3">Hoạt động gần đây</h4>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Tham gia: {new Date(selectedParent.joinDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p>Đăng nhập lần cuối: {selectedParent.lastLogin}</p>
                  <p className="mt-1">
                    Trạng thái: 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedParent.status)}`}>
                      {selectedParent.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                Đóng
              </button>
              <button className="btn-primary">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminParentManagement