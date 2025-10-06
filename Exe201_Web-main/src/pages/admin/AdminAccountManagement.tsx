import React, { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, Shield, Mail, Phone, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminAccountManagement: React.FC = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  
  // Form state
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    class: '',
    permissions: [] as string[]
  })

  const accounts = [
    {
      id: 1,
      name: 'Nguyễn Thị Lan',
      email: 'lan.nguyen@truongmam.edu.vn',
      phone: '0901 234 567',
      role: 'teacher',
      status: 'active',
      class: 'Lớp Mẫu Giáo A',
      lastLogin: '2024-01-15 14:30',
      permissions: ['view_class', 'manage_students', 'send_alerts']
    },
    {
      id: 2,
      name: 'Trần Văn Minh',
      email: 'minh.tran@truongmam.edu.vn',
      phone: '0902 345 678',
      role: 'teacher',
      status: 'active',
      class: 'Lớp Mẫu Giáo B',
      lastLogin: '2024-01-15 13:45',
      permissions: ['view_class', 'manage_students']
    },
    {
      id: 3,
      name: 'Lê Thị Hạnh',
      email: 'hanh.le@gmail.com',
      phone: '0903 456 789',
      role: 'parent',
      status: 'active',
      children: ['Lê Văn Đức'],
      lastLogin: '2024-01-15 16:20',
      permissions: ['view_child', 'receive_alerts']
    },
    {
      id: 4,
      name: 'Phạm Văn Dũng',
      email: 'dung.pham@truongmam.edu.vn',
      phone: '0904 567 890',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15 09:15',
      permissions: ['full_access']
    }
  ]

  const roleStats = {
    total: accounts.length,
    admin: accounts.filter(acc => acc.role === 'admin').length,
    teacher: accounts.filter(acc => acc.role === 'teacher').length,
    parent: accounts.filter(acc => acc.role === 'parent').length,
    active: accounts.filter(acc => acc.status === 'active').length
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'teacher': return 'bg-green-100 text-green-700 border-green-200'
      case 'parent': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'teacher': return 'Giáo viên'
      case 'parent': return 'Phụ huynh'
      default: return role
    }
  }

  // Handle form submission
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password match
    if (newAccount.password !== newAccount.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAccount.email)) {
      alert('Email không hợp lệ!')
      return
    }
    
    console.log('Adding account:', newAccount)
    setShowAddAccountModal(false)
    setNewAccount({
      name: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
      class: '',
      permissions: []
    })
    alert('Tài khoản đã được tạo thành công!')
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesRole = selectedRole === 'all' || account.role === selectedRole
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👥 Quản lý tài khoản</h1>
            <p className="text-amber-100">Quản lý tài khoản giáo viên, phụ huynh và phân quyền</p>
          </div>
          <button 
            className="bg-white text-amber-600 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center space-x-2"
            onClick={() => setShowAddAccountModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-amber-25 to-amber-50 border-amber-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700">{roleStats.total}</div>
            <div className="text-sm text-amber-600">Tổng số tài khoản</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-25 to-orange-50 border-orange-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-700">{roleStats.admin}</div>
            <div className="text-sm text-orange-600">Quản trị viên</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-25 to-green-50 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{roleStats.teacher}</div>
            <div className="text-sm text-green-600">Giáo viên</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-25 to-yellow-50 border-yellow-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-700">{roleStats.parent}</div>
            <div className="text-sm text-yellow-600">Phụ huynh</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-25 to-emerald-50 border-emerald-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-700">{roleStats.active}</div>
            <div className="text-sm text-emerald-600">Đang hoạt động</div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Teacher Management Card */}
        <div className="card border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
             onClick={() => navigate('/admin/teachers')}>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-200 transition-colors">
              <UserCheck className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">👨‍🏫 Quản lý giáo viên</h3>
            <p className="text-gray-700 mb-4">Thêm, chỉnh sửa thông tin giáo viên và phân công lớp học</p>
            <button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-colors flex items-center justify-center space-x-2">
              <span>Quản lý giáo viên</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Parent Management Card */}
        <div className="card border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
             onClick={() => navigate('/admin/parents')}>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">👨‍👩‍👧‍👦 Quản lý phụ huynh</h3>
            <p className="text-gray-600 mb-4">Thêm tài khoản phụ huynh và liên kết với học sinh</p>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
              <span>Quản lý phụ huynh</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Permission Management Card */}
        <div className="card border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
             onClick={() => navigate('/admin/permissions')}>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">🔐 Phân quyền</h3>
            <p className="text-gray-600 mb-4">Thiết lập quyền truy cập cho từng vai trò</p>
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
              <span>Cài đặt quyền</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">🔍 Tìm kiếm và bộ lọc</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                className="input-field pl-10"
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
              title="Chọn vai trò để lọc"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="teacher">Giáo viên</option>
              <option value="parent">Phụ huynh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select className="input-field" title="Chọn trạng thái tài khoản">
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">📋 Danh sách tài khoản</h3>
          <span className="text-sm text-gray-500">{filteredAccounts.length} tài khoản</span>
        </div>

        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <div key={account.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {account.role === 'admin' ? (
                      <Shield className="w-6 h-6 text-purple-600" />
                    ) : account.role === 'teacher' ? (
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Users className="w-6 h-6 text-green-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{account.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(account.role)}`}>
                        {getRoleText(account.role)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Hoạt động
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{account.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{account.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Đăng nhập cuối: </span>
                        <span>{account.lastLogin}</span>
                      </div>
                    </div>

                    {account.class && (
                      <div className="mt-2">
                        <span className="text-sm text-blue-600 font-medium">Lớp: {account.class}</span>
                      </div>
                    )}

                    {account.children && (
                      <div className="mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          Con em: {account.children.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Chỉnh sửa tài khoản"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa tài khoản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h4 className="font-bold text-blue-900 mb-3">👨‍🏫 Quản lý giáo viên</h4>
          <p className="text-sm text-blue-700 mb-4">Thêm, chỉnh sửa thông tin giáo viên và phân công lớp học</p>
          <button className="w-full btn-primary bg-blue-600 hover:bg-blue-700">
            Quản lý giáo viên
          </button>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h4 className="font-bold text-green-900 mb-3">👨‍👩‍👧‍👦 Quản lý phụ huynh</h4>
          <p className="text-sm text-green-700 mb-4">Thêm tài khoản phụ huynh và liên kết với học sinh</p>
          <button className="w-full btn-primary bg-green-600 hover:bg-green-700">
            Quản lý phụ huynh
          </button>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h4 className="font-bold text-purple-900 mb-3">🔐 Phân quyền</h4>
          <p className="text-sm text-purple-700 mb-4">Thiết lập quyền truy cập cho từng vai trò</p>
          <button className="w-full btn-primary bg-purple-600 hover:bg-purple-700">
            Cài đặt quyền
          </button>
        </div>
      </div>

      {/* Modal thêm tài khoản */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h2>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="p-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    placeholder="example@truongmam.edu.vn"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    placeholder="0901 234 567"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Vai trò *
                  </label>
                  <select
                    required
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 text-base"
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                  >
                    <option value="">Chọn vai trò</option>
                    <option value="admin">Quản trị viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="parent">Phụ huynh</option>
                  </select>
                </div>

                {newAccount.role === 'teacher' && (
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-3">
                      Lớp phụ trách
                    </label>
                    <select
                      className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 text-base"
                      value={newAccount.class}
                      onChange={(e) => setNewAccount({ ...newAccount, class: e.target.value })}
                    >
                      <option value="">Chọn lớp</option>
                      <option value="kg-a">Lớp Mẫu Giáo A</option>
                      <option value="kg-b">Lớp Mẫu Giáo B</option>
                      <option value="g1-a">Lớp Chồi A</option>
                      <option value="g1-b">Lớp Chồi B</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-5 py-4 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white/80 backdrop-blur-sm placeholder-gray-500 text-gray-900 text-base"
                    value={newAccount.confirmPassword}
                    onChange={(e) => setNewAccount({ ...newAccount, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
              </div>

              {/* Permissions Section */}
              {newAccount.role && (
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-4">
                    Quyền truy cập
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {newAccount.role === 'admin' && (
                      <div className="col-span-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('full_access')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAccount({ ...newAccount, permissions: ['full_access'] })
                              } else {
                                setNewAccount({ ...newAccount, permissions: [] })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Toàn quyền truy cập</span>
                        </label>
                      </div>
                    )}
                    
                    {newAccount.role === 'teacher' && (
                      <>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('view_class')}
                            onChange={(e) => {
                              const perms = e.target.checked 
                                ? [...newAccount.permissions, 'view_class']
                                : newAccount.permissions.filter(p => p !== 'view_class')
                              setNewAccount({ ...newAccount, permissions: perms })
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Xem lớp học</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('manage_students')}
                            onChange={(e) => {
                              const perms = e.target.checked 
                                ? [...newAccount.permissions, 'manage_students']
                                : newAccount.permissions.filter(p => p !== 'manage_students')
                              setNewAccount({ ...newAccount, permissions: perms })
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Quản lý học sinh</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('send_alerts')}
                            onChange={(e) => {
                              const perms = e.target.checked 
                                ? [...newAccount.permissions, 'send_alerts']
                                : newAccount.permissions.filter(p => p !== 'send_alerts')
                              setNewAccount({ ...newAccount, permissions: perms })
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Gửi cảnh báo</span>
                        </label>
                      </>
                    )}
                    
                    {newAccount.role === 'parent' && (
                      <>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('view_child')}
                            onChange={(e) => {
                              const perms = e.target.checked 
                                ? [...newAccount.permissions, 'view_child']
                                : newAccount.permissions.filter(p => p !== 'view_child')
                              setNewAccount({ ...newAccount, permissions: perms })
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Xem thông tin con</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newAccount.permissions.includes('receive_alerts')}
                            onChange={(e) => {
                              const perms = e.target.checked 
                                ? [...newAccount.permissions, 'receive_alerts']
                                : newAccount.permissions.filter(p => p !== 'receive_alerts')
                              setNewAccount({ ...newAccount, permissions: perms })
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Nhận cảnh báo</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAccountManagement

