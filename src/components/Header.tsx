import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { Bell, Search, X, AlertTriangle, Coffee, Menu } from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'order' | 'ingredient' | 'product'
  message: string
  time: string
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { currentUser, roles, orders, ingredients, products } = useStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentRole = roles.find(r => r.id === currentUser?.roleId)
  const roleName = currentRole ? (isRTL ? currentRole.nameAr : currentRole.name) : ''

  const notifications: NotificationItem[] = []

  orders.filter(o => o.status === 'pending').forEach(order => {
    notifications.push({
      id: `order-${order.id}`,
      type: 'order',
      message: `${isRTL ? 'طلب جديد' : 'New Order'}: ${order.number}${order.vehicleNumber ? ` - 🚗 ${order.vehicleNumber}` : ''}`,
      time: new Date(order.createdAt).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US'),
    })
  })

  ingredients.filter(ing => ing.quantity <= ing.minimumStock).forEach(ing => {
    notifications.push({
      id: `ing-${ing.id}`,
      type: 'ingredient',
      message: `${isRTL ? 'مخزون منخفض' : 'Low Stock'}: ${isRTL ? ing.nameAr : ing.name} (${ing.quantity})`,
      time: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US'),
    })
  })

  products.filter(p => p.productType === 'direct' && p.stock <= 20).forEach(product => {
    notifications.push({
      id: `prod-${product.id}`,
      type: 'product',
      message: `${isRTL ? 'مخزون منخفض' : 'Low Stock'}: ${isRTL ? product.nameAr : product.name} (${product.stock})`,
      time: new Date().toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US'),
    })
  })

  const sortedNotifications = notifications.sort((a, b) => a.time.localeCompare(b.time))

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Coffee className="w-4 h-4 text-blue-500" />
      case 'ingredient': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'product': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* ✅ تم تغيير md:hidden إلى xl:hidden ليعمل على الآيباد */}
        <button
          onClick={onMenuClick}
          className="xl:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <Search className="w-5 h-5 text-gray-400 hidden sm:block" />
        <input
          type="text"
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400 hidden sm:block"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm">{isRTL ? 'التنبيهات' : 'Notifications'}</span>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {sortedNotifications.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  {isRTL ? 'لا توجد تنبيهات' : 'No notifications'}
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sortedNotifications.slice(0, 15).map(notification => (
                    <div key={notification.id} className="p-3 hover:bg-gray-50 flex items-start gap-2">
                      <div className="mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
            {currentUser?.name?.[0] || '؟'}
          </div>
          <div>
            <p className="text-sm font-medium">{currentUser?.name || ''}</p>
            <p className="text-xs text-gray-500">{roleName}</p>
          </div>
        </div>
      </div>
    </header>
  )
}