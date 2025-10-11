import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Play, 
  Pause, 
  Square, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Download,
  Upload,
  Scan,
  UserCheck,
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Eye,
  Activity
} from 'lucide-react';

interface DetectedStudent {
  id: string;
  name: string;
  confidence: number;
  status: 'recognized' | 'unknown' | 'absent';
  timestamp: string;
  position: { x: number; y: number };
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  checkInTime: string;
  status: 'present' | 'late' | 'absent';
  confidence: number;
}

const TeacherAttendanceCamera: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [detectionMode, setDetectionMode] = useState<'attendance' | 'behavior' | 'safety'>('attendance');
  const [autoDetection, setAutoDetection] = useState(true);

  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([
    {
      id: '1',
      name: 'Nguyễn Văn An',
      confidence: 95,
      status: 'recognized',
      timestamp: '08:15:23',
      position: { x: 120, y: 180 }
    },
    {
      id: '2',
      name: 'Trần Thị Bình',
      confidence: 89,
      status: 'recognized',
      timestamp: '08:15:45',
      position: { x: 280, y: 160 }
    },
    {
      id: 'unknown',
      name: 'Học sinh chưa xác định',
      confidence: 72,
      status: 'unknown',
      timestamp: '08:16:12',
      position: { x: 200, y: 220 }
    }
  ]);

  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      studentId: 'HS001',
      studentName: 'Nguyễn Văn An',
      checkInTime: '08:15:23',
      status: 'present',
      confidence: 95
    },
    {
      studentId: 'HS002',
      studentName: 'Trần Thị Bình',
      checkInTime: '08:15:45',
      status: 'present',
      confidence: 89
    },
    {
      studentId: 'HS003',
      studentName: 'Lê Văn Cường',
      checkInTime: '08:20:12',
      status: 'late',
      confidence: 91
    },
    {
      studentId: 'HS004',
      studentName: 'Phạm Thị Dung',
      checkInTime: '-',
      status: 'absent',
      confidence: 0
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'recognized': return 'text-blue-600 bg-blue-100';
      case 'unknown': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDetectionModeColor = (mode: string) => {
    switch (mode) {
      case 'attendance': return 'from-blue-600 to-indigo-600';
      case 'behavior': return 'from-purple-600 to-pink-600';
      case 'safety': return 'from-red-600 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implement stop recording logic
  };

  const takeSnapshot = () => {
    // Implement snapshot logic
    console.log('Taking snapshot...');
  };

  const exportAttendance = () => {
    // Implement export logic
    console.log('Exporting attendance...');
  };

  const totalStudents = 25;
  const presentStudents = attendanceRecords.filter(r => r.status === 'present').length;
  const lateStudents = attendanceRecords.filter(r => r.status === 'late').length;
  const absentStudents = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-xl">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Camera AI - Điểm danh Thông minh</h1>
                <p className="text-gray-600">Hệ thống nhận diện và điểm danh tự động</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  {currentTime.toLocaleTimeString('vi-VN')}
                </span>
              </div>
              
              <button
                onClick={exportAttendance}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Xuất điểm danh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số HS</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Có mặt</p>
                <p className="text-2xl font-bold text-green-600">{presentStudents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đến muộn</p>
                <p className="text-2xl font-bold text-yellow-600">{lateStudents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vắng mặt</p>
                <p className="text-2xl font-bold text-red-600">{absentStudents}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Camera Controls */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isLive ? 'TRỰC TIẾP' : 'OFFLINE'}
                    </span>
                  </div>
                  
                  <select
                    value={detectionMode}
                    onChange={(e) => setDetectionMode(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="attendance">Điểm danh</option>
                    <option value="behavior">Hành vi</option>
                    <option value="safety">An toàn</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoDetection(!autoDetection)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      autoDetection 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {autoDetection ? 'Tự động BẬT' : 'Tự động TẮT'}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={takeSnapshot}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>

                  <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative bg-gray-900 h-96 flex items-center justify-center">
              {/* Simulated Camera Feed */}
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Camera Feed</p>
                    <p className="text-sm text-gray-300">Lớp 5A - Phòng 101</p>
                  </div>
                </div>

                {/* Detection Overlays */}
                {detectedStudents.map((student, index) => (
                  <div
                    key={index}
                    className="absolute bg-blue-500 bg-opacity-20 border-2 border-blue-400 rounded"
                    style={{
                      left: `${student.position.x}px`,
                      top: `${student.position.y}px`,
                      width: '80px',
                      height: '100px'
                    }}
                  >
                    <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {student.name}
                      <br />
                      {student.confidence}%
                    </div>
                  </div>
                ))}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">REC</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Dừng ghi</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Bắt đầu ghi</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isLive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isLive ? 'Trực tiếp' : 'Offline'}</span>
                </button>

                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                  <Scan className="w-4 h-4" />
                  <span>Quét điểm danh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Detection Results */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Nhận diện thời gian thực</h3>
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="space-y-3">
                {detectedStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {student.status === 'recognized' ? 'Đã nhận diện' : 'Chưa xác định'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{student.confidence}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng kết điểm danh</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attendanceRecords.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{record.studentName}</p>
                      <p className="text-sm text-gray-600">{record.studentId}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status === 'present' ? 'Có mặt' : 
                         record.status === 'late' ? 'Đến muộn' : 'Vắng mặt'}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {record.checkInTime !== '-' ? record.checkInTime : 'Chưa điểm danh'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>
              
              <div className="space-y-2">
                <button className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Điểm danh thủ công</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 hover:bg-green-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">Import danh sách HS</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Cài đặt camera</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceCamera;
