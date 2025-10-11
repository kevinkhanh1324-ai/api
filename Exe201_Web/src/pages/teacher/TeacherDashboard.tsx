import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Camera,
  MessageSquare,
  Bell,
  FileText,
  Award,
  Activity,
  Eye,
  UserCheck,
  BarChart3
} from 'lucide-react';

interface ClassStats {
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
  behaviorScore: number;
  averageGrade: number;
  completedAssignments: number;
  pendingTasks: number;
}

interface Student {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  behaviorScore: number;
  lastActivity: string;
  avatar?: string;
}

interface Alert {
  id: string;
  type: 'behavior' | 'attendance' | 'safety' | 'academic';
  message: string;
  student: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
}

const TeacherDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [classStats] = useState<ClassStats>({
    totalStudents: 25,
    presentToday: 23,
    attendanceRate: 92,
    behaviorScore: 85,
    averageGrade: 8.5,
    completedAssignments: 18,
    pendingTasks: 3
  });

  const [recentStudents] = useState<Student[]>([
    { id: '1', name: 'Nguyễn Văn An', status: 'present', behaviorScore: 95, lastActivity: '2 phút trước' },
    { id: '2', name: 'Trần Thị Bình', status: 'present', behaviorScore: 88, lastActivity: '5 phút trước' },
    { id: '3', name: 'Lê Văn Cường', status: 'late', behaviorScore: 75, lastActivity: '10 phút trước' },
    { id: '4', name: 'Phạm Thị Dung', status: 'absent', behaviorScore: 92, lastActivity: '1 giờ trước' },
    { id: '5', name: 'Hoàng Văn Em', status: 'present', behaviorScore: 87, lastActivity: '3 phút trước' }
  ]);

  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'behavior',
      message: 'Học sinh Lê Văn Cường có hành vi bất thường',
      student: 'Lê Văn Cường',
      time: '5 phút trước',
      severity: 'medium'
    },
    {
      id: '2',
      type: 'attendance',
      message: 'Phạm Thị Dung chưa đến lớp',
      student: 'Phạm Thị Dung',
      time: '10 phút trước',
      severity: 'high'
    },
    {
      id: '3',
      type: 'academic',
      message: 'Hoàng Văn Em hoàn thành bài tập xuất sắc',
      student: 'Hoàng Văn Em',
      time: '15 phút trước',
      severity: 'low'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const quickActions = [
    { icon: UserCheck, label: 'Điểm danh', path: '/teacher/attendance', color: 'blue' },
    { icon: Camera, label: 'Camera AI', path: '/teacher/camera', color: 'purple' },
    { icon: Users, label: 'Quản lý HS', path: '/teacher/students', color: 'green' },
    { icon: MessageSquare, label: 'Giao tiếp', path: '/teacher/messages', color: 'pink' },
    { icon: Eye, label: 'Giám sát', path: '/teacher/monitoring', color: 'indigo' }
  ];

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f4f1ea 0%, #e8dcc6 50%, #d4c2a0 100%)'
    }}>
      {/* Header */}
      <div className="glass-card mx-6 mt-6 mb-8">
        <div className="flex justify-between items-center p-8">
          <div className="flex items-center space-x-6">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce-subtle">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text">
                Dashboard Giáo viên
              </h1>
              <p className="text-gray-600 text-lg">Chào mừng trở lại! Hôm nay là {formatDate(currentTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="glass-button px-6 py-3 rounded-xl text-gray-700">
              <Clock className="w-5 h-5 inline mr-2" />
              {formatTime(currentTime)}
            </div>
            <button className="glass-button p-3 rounded-xl text-gray-700 hover:text-indigo-600">
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Tổng học sinh</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">{classStats.totalStudents}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-6">
              <span className="text-sm text-emerald-600 font-semibold bg-emerald-100 px-3 py-1 rounded-full">
                +2 học sinh mới
              </span>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Có mặt hôm nay</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text">{classStats.presentToday}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-6">
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Tỷ lệ: {classStats.attendanceRate}%
              </span>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Điểm hành vi TB</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">{classStats.behaviorScore}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-6">
              <span className="text-sm text-purple-600 font-semibold bg-purple-100 px-3 py-1 rounded-full">
                Tăng 5 điểm
              </span>
            </div>
          </div>

          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Điểm TB lớp</p>
                <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">{classStats.averageGrade}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-6">
              <span className="text-sm text-orange-600 font-semibold bg-orange-100 px-3 py-1 rounded-full">
                Tăng 0.3 điểm
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 hover:border-blue-300"
              >
                <div className={`p-3 rounded-lg bg-${action.color}-100 mb-2`}>
                  <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Students Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hoạt động học sinh gần đây</h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Xem tất cả
              </button>
            </div>
            
            <div className="space-y-4">
              {recentStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.lastActivity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {student.status === 'present' ? 'Có mặt' : 
                       student.status === 'absent' ? 'Vắng mặt' : 'Đến muộn'}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Hành vi: {student.behaviorScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Cảnh báo & Thông báo</h2>
              <Bell className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border-l-4 rounded-r-lg ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-600">{alert.student}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              Xem tất cả thông báo
            </button>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Bài tập đã hoàn thành</h3>
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(classStats.completedAssignments / classStats.totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-lg font-bold text-gray-900">
                {classStats.completedAssignments}/{classStats.totalStudents}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Nhiệm vụ đang chờ</h3>
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{classStats.pendingTasks}</p>
              <p className="text-sm text-gray-600">nhiệm vụ cần xử lý</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Hiệu suất lớp học</h3>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">95%</p>
              <p className="text-sm text-gray-600">hiệu suất trung bình</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
