import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentLiveView from './pages/parent/ParentLiveView'
import ParentAlertsCenter from './pages/parent/ParentAlertsCenter'
import ParentBehaviorReports from './pages/parent/ParentBehaviorReports'
import ParentDangerZoneMap from './pages/parent/ParentDangerZoneMap'
import ParentChildProfile from './pages/parent/ParentChildProfile'
import ParentAccountSettings from './pages/parent/ParentAccountSettings'
import ParentNotifications from './pages/parent/ParentNotifications'

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherStudentManagement from './pages/teacher/TeacherStudentManagement'
import TeacherAttendanceCamera from './pages/teacher/TeacherAttendanceCamera'
import TeacherMessages from './pages/teacher/TeacherMessages'
import TeacherSettings from './pages/teacher/TeacherSettings'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClassManagement from './pages/admin/AdminClassManagement'
import AdminAccountManagement from './pages/admin/AdminAccountManagement'
import AdminTeacherManagement from './pages/admin/AdminTeacherManagement'
import AdminParentManagement from './pages/admin/AdminParentManagement'
import AdminPermissionManagement from './pages/admin/AdminPermissionManagement'
import AdminReports from './pages/admin/AdminReports'
import AdminLiveView from './pages/admin/AdminLiveView'
import AdminCameraPlayback from './pages/admin/AdminCameraPlayback'
import AdminAlertsCenter from './pages/admin/AdminAlertsCenter'
import AdminDangerZoneManager from './pages/admin/AdminDangerZoneManager'
import AdminCommunicationCenter from './pages/admin/AdminCommunicationCenter'
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Parent Routes */}
          <Route path="/parent" element={<ProtectedRoute role="parent" />}>
            <Route index element={<ParentDashboard />} />
            <Route path="live-view" element={<ParentLiveView />} />
            <Route path="alerts" element={<ParentAlertsCenter />} />
            <Route path="reports" element={<ParentBehaviorReports />} />
            <Route path="danger-zones" element={<ParentDangerZoneMap />} />
            <Route path="child-profile" element={<ParentChildProfile />} />
            <Route path="account" element={<ParentAccountSettings />} />
            <Route path="notifications" element={<ParentNotifications />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute role="teacher" />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudentManagement />} />
            <Route path="attendance" element={<TeacherAttendanceCamera />} />
            <Route path="messages" element={<TeacherMessages />} />
            <Route path="settings" element={<TeacherSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<AdminClassManagement />} />
            <Route path="accounts" element={<AdminAccountManagement />} />
            <Route path="teachers" element={<AdminTeacherManagement />} />
            <Route path="parents" element={<AdminParentManagement />} />
            <Route path="permissions" element={<AdminPermissionManagement />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="live-view" element={<AdminLiveView />} />
            <Route path="playback" element={<AdminCameraPlayback />} />
            <Route path="alerts" element={<AdminAlertsCenter />} />
            <Route path="danger-zones" element={<AdminDangerZoneManager />} />
            <Route path="communication" element={<AdminCommunicationCenter />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
