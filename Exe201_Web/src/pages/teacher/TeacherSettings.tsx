import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Camera, 
  Smartphone, 
  Save,
  Lock,
  Eye,
  EyeOff,
  Settings as SettingsIcon
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  teacherId: string;
  department: string;
}

interface NotificationSettings {
  alertsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  behaviorAlerts: boolean;
  attendanceAlerts: boolean;
  safetyAlerts: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordChangeRequired: boolean;
  sessionTimeout: number;
}

const TeacherSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'privacy'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Nguyễn Thị Hoa',
    email: 'nguyenthihoa@school.edu.vn',
    phone: '0987654321',
    avatar: '',
    teacherId: 'GV001',
    department: 'Toán - Lý'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    alertsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    behaviorAlerts: true,
    attendanceAlerts: true,
    safetyAlerts: true
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    passwordChangeRequired: false,
    sessionTimeout: 30
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile' as const, label: 'Hồ Sơ Cá Nhân', icon: User },
    { id: 'notifications' as const, label: 'Thông Báo', icon: Bell },
    { id: 'security' as const, label: 'Bảo Mật', icon: Shield },
    { id: 'privacy' as const, label: 'Quyền Riêng Tư', icon: Eye }
  ];

  const handleSaveProfile = () => {
    // Implement save profile logic
    console.log('Saving profile:', profile);
  };

  const handleSaveNotifications = () => {
    // Implement save notifications logic
    console.log('Saving notifications:', notifications);
  };

  const handleSaveSecurity = () => {
    // Implement save security logic
    console.log('Saving security:', security);
  };

  const handleChangePassword = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Mật khẩu mới không khớp!');
      return;
    }
    // Implement change password logic
    console.log('Changing password...');
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f4f1ea 0%, #e8dcc6 50%, #d4c2a0 100%)'
    }}>
      {/* Header */}
      <div className="glass-card mx-6 pt-6 mb-8">
        <div className="flex items-center gap-4 p-6">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-3 rounded-2xl">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800">Cài Đặt</h1>
            <p className="text-gray-600 font-medium">Quản lý thông tin và tùy chọn cá nhân</p>
          </div>
        </div>
      </div>

      <div className="mx-6 mb-8">
        <div className="glass-card p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Thông Tin Cá Nhân</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mã Giáo Viên
                  </label>
                  <input
                    type="text"
                    value={profile.teacherId}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Khoa/Bộ Môn
                  </label>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Lưu Thay Đổi
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Cài Đặt Thông Báo</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'alertsEnabled', label: 'Kích hoạt cảnh báo', desc: 'Nhận thông báo từ hệ thống' },
                  { key: 'emailNotifications', label: 'Thông báo Email', desc: 'Gửi thông báo qua email' },
                  { key: 'smsNotifications', label: 'Thông báo SMS', desc: 'Gửi thông báo qua tin nhắn' },
                  { key: 'behaviorAlerts', label: 'Cảnh báo hành vi', desc: 'Thông báo về hành vi bất thường' },
                  { key: 'attendanceAlerts', label: 'Cảnh báo điểm danh', desc: 'Thông báo về tình trạng vắng mặt' },
                  { key: 'safetyAlerts', label: 'Cảnh báo an toàn', desc: 'Thông báo về tình huống nguy hiểm' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.label}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          [item.key]: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveNotifications}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Lưu Cài Đặt
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Bảo Mật Tài Khoản</h2>
              
              {/* Change Password */}
              <div className="bg-white/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Đổi Mật Khẩu</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Lock className="h-5 w-5" />
                    Đổi Mật Khẩu
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-800">Xác thực 2 bước</h3>
                    <p className="text-sm text-gray-600">Tăng cường bảo mật tài khoản</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.twoFactorEnabled}
                      onChange={(e) => setSecurity({...security, twoFactorEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="p-4 bg-white/50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Thời gian hết phiên</h3>
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={15}>15 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={60}>1 giờ</option>
                    <option value={120}>2 giờ</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveSecurity}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Lưu Cài Đặt
              </button>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Quyền Riêng Tư</h2>
              
              <div className="space-y-4">
                <div className="p-6 bg-white/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quyền Truy Cập Dữ Liệu</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-amber-600" />
                      <span className="text-gray-700">Truy cập camera giám sát</span>
                      <span className="ml-auto text-green-600 font-semibold">Được phép</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-amber-600" />
                      <span className="text-gray-700">Xem thông tin học sinh</span>
                      <span className="ml-auto text-green-600 font-semibold">Được phép</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-amber-600" />
                      <span className="text-gray-700">Gửi thông báo</span>
                      <span className="ml-auto text-green-600 font-semibold">Được phép</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chia Sẻ Dữ Liệu</h3>
                  <p className="text-gray-600 mb-4">
                    Dữ liệu của bạn được bảo vệ theo chính sách bảo mật của trường. 
                    Thông tin chỉ được chia sẻ với các bên có thẩm quyền.
                  </p>
                  <button className="text-amber-600 font-semibold hover:text-amber-700">
                    Xem chính sách bảo mật →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
