import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from './Layout'

interface ProtectedRouteProps {
  role: 'parent' | 'admin' | 'teacher'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== role) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout role={role}>
      <Outlet />
    </Layout>
  )
}

export default ProtectedRoute
