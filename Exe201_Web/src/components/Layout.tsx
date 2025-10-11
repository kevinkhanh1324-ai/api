import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  role: 'parent' | 'admin' | 'teacher'
}

const Layout: React.FC<LayoutProps> = ({ children, role }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-amber-25 via-orange-25 to-yellow-25 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
