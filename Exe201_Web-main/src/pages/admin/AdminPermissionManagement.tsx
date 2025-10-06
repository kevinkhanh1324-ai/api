import React, { useState } from 'react'
import { Shield, Users, Key, Lock, Plus, Edit, Trash2, Search, Filter, Eye, X, Check, AlertTriangle } from 'lucide-react'

const AdminPermissionManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [showEditPermissionModal, setShowEditPermissionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })

  const [userPermissions, setUserPermissions] = useState<string[]>([])

  // All available permissions
  const allPermissions = [
    {
      category: 'Hệ thống',
      permissions: [
        { id: 'full_access', name: 'Toàn quyền truy cập', description: 'Quyền truy cập không giới hạn' },
        { id: 'admin_panel', name: 'Truy cập admin', description: 'Truy cập vào panel quản trị' },
        { id: 'system_settings', name: 'Cài đặt hệ thống', description: 'Thay đổi cài đặt hệ thống' },
        { id: 'backup_restore', name: 'Sao lưu & khôi phục', description: 'Quản lý sao lưu dữ liệu' }
      ]
    },
    {
      category: 'Người dùng',
      permissions: [
        { id: 'manage_users', name: 'Quản lý người dùng', description: 'Tạo, sửa, xóa tài khoản' },
        { id: 'view_users', name: 'Xem người dùng', description: 'Xem danh sách người dùng' },
        { id: 'manage_roles', name: 'Quản lý vai trò', description: 'Tạo và chỉnh sửa vai trò' },
        { id: 'assign_permissions', name: 'Phân quyền', description: 'Gán quyền cho người dùng' }
      ]
    },
    {
      category: 'Giáo viên',
      permissions: [
        { id: 'view_class', name: 'Xem lớp học', description: 'Xem thông tin lớp học' },
        { id: 'manage_students', name: 'Quản lý học sinh', description: 'Thêm, sửa thông tin học sinh' },
        { id: 'send_alerts', name: 'Gửi cảnh báo', description: 'Gửi thông báo cảnh báo' },
        { id: 'view_reports', name: 'Xem báo cáo', description: 'Xem các báo cáo hoạt động' },
        { id: 'manage_attendance', name: 'Điểm danh', description: 'Quản lý điểm danh học sinh' }
      ]
    },
    {
      category: 'Phụ huynh',
      permissions: [
        { id: 'view_child', name: 'Xem thông tin con', description: 'Xem thông tin của con em' },
        { id: 'receive_alerts', name: 'Nhận cảnh báo', description: 'Nhận thông báo cảnh báo' },
        { id: 'communication', name: 'Liên lạc', description: 'Liên lạc với giáo viên' },
        { id: 'view_child_reports', name: 'Xem báo cáo con', description: 'Xem báo cáo về con em' }
      ]
    },
    {
      category: 'Giám sát',
      permissions: [
        { id: 'view_cameras', name: 'Xem camera', description: 'Xem feed camera trực tiếp' },
        { id: 'playback_video', name: 'Phát lại video', description: 'Xem lại video đã ghi' },
        { id: 'manage_cameras', name: 'Quản lý camera', description: 'Cài đặt và quản lý camera' },
        { id: 'export_footage', name: 'Xuất video', description: 'Xuất và tải video' }
      ]
    },
    {
      category: 'Báo cáo',
      permissions: [
        { id: 'view_analytics', name: 'Xem phân tích', description: 'Xem báo cáo thống kê' },
        { id: 'generate_reports', name: 'Tạo báo cáo', description: 'Tạo báo cáo tùy chỉnh' },
        { id: 'export_data', name: 'Xuất dữ liệu', description: 'Xuất dữ liệu ra file' }
      ]
    }
  ]

  // Predefined roles
  const roles = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'Quyền quản trị tối cao',
      permissions: ['full_access'],
      userCount: 1,
      color: 'purple',
      system: true
    },
    {
      id: 2,
      name: 'Quản trị viên',
      description: 'Quản trị hệ thống và người dùng',
      permissions: ['admin_panel', 'manage_users', 'view_users', 'manage_roles', 'assign_permissions', 'view_cameras', 'view_analytics'],
      userCount: 2,
      color: 'red',
      system: true
    },
    {
      id: 3,
      name: 'Giáo viên chính',
      description: 'Giáo viên có quyền cao',
      permissions: ['view_class', 'manage_students', 'send_alerts', 'view_reports', 'manage_attendance', 'view_cameras', 'communication'],
      userCount: 3,
      color: 'blue',
      system: false
    },
    {
      id: 4,
      name: 'Giáo viên',
      description: 'Giáo viên thông thường',
      permissions: ['view_class', 'manage_students', 'send_alerts', 'manage_attendance'],
      userCount: 8,
      color: 'green',
      system: false
    },
    {
      id: 5,
      name: 'Phụ huynh',
      description: 'Quyền dành cho phụ huynh',
      permissions: ['view_child', 'receive_alerts', 'communication', 'view_child_reports'],
      userCount: 15,
      color: 'yellow',
      system: true
    }
  ]

  // Users with their permissions
  const users = [
    {
      id: 1,
      name: 'Phạm Văn Dũng',
      email: 'dung.pham@truongmam.edu.vn',
      role: 'Super Admin',
      permissions: ['full_access'],
      lastActive: '2024-01-15 09:15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Nguyễn Thị Lan',
      email: 'lan.nguyen@truongmam.edu.vn',
      role: 'Giáo viên chính',
      permissions: ['view_class', 'manage_students', 'send_alerts', 'view_reports', 'manage_attendance', 'view_cameras'],
      lastActive: '2024-01-15 14:30',
      status: 'active'
    },
    {
      id: 3,
      name: 'Trần Văn Minh',
      email: 'minh.tran@truongmam.edu.vn',
      role: 'Giáo viên',
      permissions: ['view_class', 'manage_students', 'send_alerts', 'manage_attendance'],
      lastActive: '2024-01-15 13:45',
      status: 'active'
    },
    {
      id: 4,
      name: 'Lê Thị Hạnh',
      email: 'hanh.le@gmail.com',
      role: 'Phụ huynh',
      permissions: ['view_child', 'receive_alerts', 'communication', 'view_child_reports'],
      lastActive: '2024-01-15 16:20',
      status: 'active'
    }
  ]

  const roleStats = {
    totalRoles: roles.length,
    systemRoles: roles.filter(r => r.system).length,
    customRoles: roles.filter(r => !r.system).length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length
  }

  const getRoleColor = (color: string) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getPermissionName = (permId: string) => {
    for (const category of allPermissions) {
      const perm = category.permissions.find(p => p.id === permId)
      if (perm) return perm.name
    }
    return permId
  }

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating role:', newRole)
    setShowCreateRoleModal(false)
    setNewRole({ name: '', description: '', permissions: [] })
    alert('Vai trò đã được tạo thành công!')
  }

  const handleEditPermissions = (user: any) => {
    setSelectedUser(user)
    setUserPermissions([...user.permissions])
    setShowEditPermissionModal(true)
  }

  const handleSavePermissions = () => {
    console.log('Saving permissions for', selectedUser.name, ':', userPermissions)
    setShowEditPermissionModal(false)
    setSelectedUser(null)
    setUserPermissions([])
    alert('Quyền đã được cập nhật thành công!')
  }

  const togglePermission = (permissionId: string) => {
    if (userPermissions.includes(permissionId)) {
      setUserPermissions(userPermissions.filter(p => p !== permissionId))
    } else {
      setUserPermissions([...userPermissions, permissionId])
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔐 Quản lý phân quyền</h1>
            <p className="text-purple-100">Quản lý vai trò và quyền truy cập của người dùng</p>
          </div>
          <button 
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
            onClick={() => setShowCreateRoleModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo vai trò</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-700">{roleStats.totalRoles}</div>
            <div className="text-sm text-purple-600">Tổng vai trò</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{roleStats.systemRoles}</div>
            <div className="text-sm text-blue-600">Vai trò hệ thống</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{roleStats.customRoles}</div>
            <div className="text-sm text-green-600">Vai trò tùy chỉnh</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-700">{roleStats.totalUsers}</div>
            <div className="text-sm text-yellow-600">Tổng người dùng</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-700">{roleStats.activeUsers}</div>
            <div className="text-sm text-emerald-600">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Roles Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">🎭 Vai trò hệ thống</h3>
          <Shield className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="card border-2 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{role.name}</h4>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(role.color)}`}>
                  {role.userCount} người
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500">Quyền truy cập:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permId) => (
                    <span key={permId} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {getPermissionName(permId)}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{role.permissions.length - 3} khác
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 btn-secondary text-sm py-2">
                  <Eye className="w-3 h-3 mr-1" />
                  Xem chi tiết
                </button>
                {!role.system && (
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Permissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">👥 Quyền người dùng</h3>
          <Key className="w-5 h-5 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Tìm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
            <select
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Người dùng</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Vai trò</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Quyền</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Hoạt động</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-2">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(roles.find(r => r.name === user.role)?.color || 'gray')}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 2).map((permId) => (
                        <span key={permId} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {getPermissionName(permId)}
                        </span>
                      ))}
                      {user.permissions.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{user.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-gray-600">
                      {user.lastActive}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => handleEditPermissions(user)}
                        title="Chỉnh sửa quyền"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">➕ Tạo vai trò mới</h3>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên vai trò *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Tên vai trò"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="Mô tả vai trò"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quyền truy cập
                </label>
                <div className="space-y-4">
                  {allPermissions.map((category) => (
                    <div key={category.category} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.permissions.map((permission) => (
                          <label key={permission.id} className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={newRole.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRole({ 
                                    ...newRole, 
                                    permissions: [...newRole.permissions, permission.id] 
                                  })
                                } else {
                                  setNewRole({ 
                                    ...newRole, 
                                    permissions: newRole.permissions.filter(p => p !== permission.id) 
                                  })
                                }
                              }}
                              className="rounded border-gray-300 mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permission Modal */}
      {showEditPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">🔑 Chỉnh sửa quyền - {selectedUser.name}</h3>
              <button
                onClick={() => setShowEditPermissionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">Lưu ý</div>
                  <div className="text-sm text-yellow-700">
                    Thay đổi quyền sẽ ảnh hưởng đến khả năng truy cập của người dùng
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {allPermissions.map((category) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.permissions.map((permission) => (
                      <label key={permission.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={userPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="rounded border-gray-300 mt-1"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                            <span>{permission.name}</span>
                            {userPermissions.includes(permission.id) && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-gray-600">
                Đã chọn: {userPermissions.length} quyền
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditPermissionModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSavePermissions}
                  className="btn-primary"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPermissionManagement