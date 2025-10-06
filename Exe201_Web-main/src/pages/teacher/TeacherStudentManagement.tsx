import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Phone, 
  Mail,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  Upload,
  MoreVertical,
  UserPlus,
  MessageSquare
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  attendanceRate: number;
  behaviorScore: number;
  averageGrade: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  medicalNotes?: string;
  lastUpdate: string;
  avatar?: string;
  recentActivity: string;
  alerts: number;
}

const TeacherStudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'Nguyễn Văn An',
      studentId: 'HS001',
      status: 'present',
      attendanceRate: 95,
      behaviorScore: 88,
      averageGrade: 8.5,
      parentName: 'Nguyễn Thị Bình',
      parentPhone: '0987654321',
      parentEmail: 'nguyenbinh@email.com',
      dateOfBirth: '2015-03-15',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      emergencyContact: '0912345678',
      medicalNotes: 'Dị ứng với đậu phộng',
      lastUpdate: '5 phút trước',
      recentActivity: 'Hoàn thành bài tập Toán',
      alerts: 0
    },
    {
      id: '2',
      name: 'Trần Thị Bình',
      studentId: 'HS002',
      status: 'present',
      attendanceRate: 92,
      behaviorScore: 92,
      averageGrade: 9.0,
      parentName: 'Trần Văn Cường',
      parentPhone: '0976543210',
      parentEmail: 'tranvancuong@email.com',
      dateOfBirth: '2015-07-22',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      emergencyContact: '0923456789',
      lastUpdate: '10 phút trước',
      recentActivity: 'Tham gia thảo luận nhóm',
      alerts: 0
    },
    {
      id: '3',
      name: 'Lê Văn Cường',
      studentId: 'HS003',
      status: 'late',
      attendanceRate: 85,
      behaviorScore: 75,
      averageGrade: 7.5,
      parentName: 'Lê Thị Dung',
      parentPhone: '0965432109',
      parentEmail: 'lethidung@email.com',
      dateOfBirth: '2015-11-08',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      emergencyContact: '0934567890',
      medicalNotes: 'Cận thị nhẹ',
      lastUpdate: '15 phút trước',
      recentActivity: 'Đến muộn 15 phút',
      alerts: 2
    },
    {
      id: '4',
      name: 'Phạm Thị Dung',
      studentId: 'HS004',
      status: 'absent',
      attendanceRate: 78,
      behaviorScore: 85,
      averageGrade: 8.0,
      parentName: 'Phạm Văn Em',
      parentPhone: '0954321098',
      parentEmail: 'phamvanem@email.com',
      dateOfBirth: '2015-05-30',
      address: '321 Đường GHI, Quận 4, TP.HCM',
      emergencyContact: '0945678901',
      lastUpdate: '1 giờ trước',
      recentActivity: 'Vắng mặt không phép',
      alerts: 1
    },
    {
      id: '5',
      name: 'Hoàng Văn Em',
      studentId: 'HS005',
      status: 'present',
      attendanceRate: 98,
      behaviorScore: 95,
      averageGrade: 9.5,
      parentName: 'Hoàng Thị Phương',
      parentPhone: '0943210987',
      parentEmail: 'hoangphuong@email.com',
      dateOfBirth: '2015-09-12',
      address: '654 Đường JKL, Quận 5, TP.HCM',
      emergencyContact: '0956789012',
      lastUpdate: '2 phút trước',
      recentActivity: 'Đạt điểm cao bài kiểm tra',
      alerts: 0
    }
  ]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Có mặt';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đến muộn';
      default: return 'Không rõ';
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý Học sinh</h1>
                <p className="text-gray-600">Theo dõi và quản lý thông tin học sinh lớp 5A</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Thêm học sinh</span>
              </button>
              
              <button className="btn-secondary flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Xuất danh sách</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Có mặt hôm nay</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'present').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vắng mặt</p>
                <p className="text-2xl font-bold text-red-600">
                  {students.filter(s => s.status === 'absent').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đến muộn</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => s.status === 'late').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="present">Có mặt</option>
                <option value="absent">Vắng mặt</option>
                <option value="late">Đến muộn</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedStudents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Đã chọn {selectedStudents.length} học sinh
                  </span>
                  <button className="btn-secondary text-sm">
                    Gửi thông báo
                  </button>
                </div>
              )}
              
              <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length}
                      onChange={selectAllStudents}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm danh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành vi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm TB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phụ huynh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {getStatusText(student.status)}
                      </span>
                      {student.alerts > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {student.alerts} cảnh báo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.attendanceRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${student.behaviorScore}%` }}
                          ></div>
                        </div>
                        <span>{student.behaviorScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.averageGrade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{student.parentName}</div>
                        <div className="text-gray-500">{student.parentPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Gọi điện">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="text-purple-600 hover:text-purple-900" title="Gửi email">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="text-orange-600 hover:text-orange-900" title="Nhắn tin">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin chi tiết học sinh</h2>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                    <p className="text-gray-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã học sinh</label>
                    <p className="text-gray-900">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                    <p className="text-gray-900">{selectedStudent.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <p className="text-gray-900">{selectedStudent.address}</p>
                  </div>
                  {selectedStudent.medicalNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ghi chú y tế</label>
                      <p className="text-gray-900">{selectedStudent.medicalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phụ huynh</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên phụ huynh</label>
                    <p className="text-gray-900">{selectedStudent.parentName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p className="text-gray-900">{selectedStudent.parentPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedStudent.parentEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Liên hệ khẩn cấp</label>
                    <p className="text-gray-900">{selectedStudent.emergencyContact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê học tập</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedStudent.attendanceRate}%</p>
                  <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedStudent.behaviorScore}</p>
                  <p className="text-sm text-gray-600">Điểm hành vi</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedStudent.averageGrade}</p>
                  <p className="text-sm text-gray-600">Điểm trung bình</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button 
                onClick={() => setSelectedStudent(null)}
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
  );
};

export default TeacherStudentManagement;
