import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-gray-100">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="xl:ml-64 rtl:xl:mr-64 rtl:xl:ml-0">

        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-4 md:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  )
}