import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const updateViewportHeight = () => {
      const viewport = window.visualViewport

      const height = viewport
        ? viewport.height
        : window.innerHeight

      document.documentElement.style.setProperty(
        '--app-height',
        `${height}px`
      )
    }

    updateViewportHeight()

    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        'resize',
        updateViewportHeight
      )

      window.visualViewport.addEventListener(
        'scroll',
        updateViewportHeight
      )
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener(
        'orientationchange',
        updateViewportHeight
      )

      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          'resize',
          updateViewportHeight
        )

        window.visualViewport.removeEventListener(
          'scroll',
          updateViewportHeight
        )
      }
    }
  }, [])

  return (
    <div className="app-shell flex bg-gray-100 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="app-main flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}