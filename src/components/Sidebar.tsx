import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import {
  LayoutDashboard,
  ShoppingCart,
  Coffee,
  MonitorSmartphone,
  TrendingUp,
  Menu as MenuIcon,
  Boxes,
  Percent,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  Languages,
  LogOut,
  X,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { settings, currentUser, roles, logout } = useStore()
  const navigate = useNavigate()
  const [openMenus, setOpenMenus] = useState<string[]>(['sales'])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const userRole = roles.find(r => r.id === currentUser?.roleId)
  const permissions = userRole?.permissions || []

  const menuStructure = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard'), permission: 'dashboard' },
    { to: '/pos', icon: ShoppingCart, label: isRTL ? 'نقطة البيع' : 'POS', permission: 'pos' },
    { to: '/barista', icon: Coffee, label: isRTL ? 'شاشة الباريستا' : 'Barista Screen', permission: 'barista' },
    { to: '/cashier', icon: MonitorSmartphone, label: isRTL ? 'شاشة الكاشير' : 'Cashier Screen', permission: 'cashier' },
    {
      icon: TrendingUp,
      label: t('sales'),
      permission: 'orders',
      children: [
        { to: '/orders', label: t('orders'), permission: 'orders' },
        { to: '/invoices', label: t('invoices'), permission: 'invoices' },
        { to: '/payment-methods', label: t('paymentMethods'), permission: 'payment-methods' },
      ]
    },
    {
      icon: MenuIcon,
      label: t('menus'),
      permission: 'products',
      children: [
        { to: '/categories', label: t('categories'), permission: 'categories' },
        { to: '/products', label: t('products'), permission: 'products' },
      ]
    },
    {
      icon: Boxes,
      label: t('inventory'),
      permission: 'ingredients',
      children: [
        { to: '/inventory-analytics', label: t('analytics'), permission: 'inventory-analytics' },
        { to: '/units', label: t('units'), permission: 'units' },
        { to: '/suppliers', label: t('suppliers'), permission: 'suppliers' },
        { to: '/ingredients', label: t('ingredients'), permission: 'ingredients' },
        { to: '/stock-movement', label: t('stockMovement'), permission: 'stock-movement' },
        { to: '/purchases', label: t('purchases'), permission: 'purchases' },
      ]
    },
    {
      icon: Percent,
      label: t('offers'),
      permission: 'discounts',
      children: [
        { to: '/discounts', label: t('discounts'), permission: 'discounts' },
        { to: '/coupons', label: t('coupons'), permission: 'coupons' },
      ]
    },
    { to: '/reports', icon: BarChart3, label: t('reports'), permission: 'reports' },
    { to: '/users', icon: Users, label: t('users'), permission: 'users' },
    { to: '/settings', icon: Settings, label: t('settings'), permission: 'settings' },
  ].filter(item => item.permission ? permissions.includes(item.permission) : true)

  const shopName = isRTL ? settings.shopNameAr : settings.shopName

  const handleLogout = () => {
    logout()
    navigate('/login')
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'}
          z-50
          bg-gradient-to-b from-primary to-[#1a2233] text-white flex flex-col
          transition-all duration-300 shrink-0
          xl:static xl:z-auto
          ${isRTL ? 'xl:right-auto' : 'xl:left-auto'}
          w-64
          ${open ? 'translate-x-0' : isRTL ? 'translate-x-full xl:translate-x-0' : '-translate-x-full xl:translate-x-0'}
          xl:w-64
          shadow-2xl xl:shadow-none
          overflow-x-hidden
        `}
      >
        {/* الشعار */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          {settings.logo ? (
            <img src={settings.logo} alt={shopName} className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-lg" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 text-accent" />
            </div>
          )}
          <span className="text-lg font-bold truncate flex-1 min-w-0">{shopName}</span>
          <button onClick={onClose} className="xl:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* القائمة */}
        <nav className="sidebar-scroll flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {menuStructure.map((item, index) => {
            const Icon = item.icon

            if (item.to) {
              return (
                <NavLink
                  key={index}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 mx-2 px-4 py-3 rounded-xl text-sm w-[calc(100%-1rem)] min-w-0
                    transition-all duration-200
                    ${isActive
                      ? 'bg-accent text-primary font-semibold shadow-lg shadow-accent/20'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            }

            return (
              <div key={index} className="mt-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-start truncate min-w-0">{item.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      openMenus.includes(item.label)
                        ? 'rotate-0'
                        : isRTL
                          ? 'rotate-90'
                          : '-rotate-90'
                    }`}
                  />
                </button>

                {openMenus.includes(item.label) && item.children && (
                  <div className="mt-1 space-y-1">
                    {item.children
                      .filter(child => permissions.includes(child.permission))
                      .map((child, childIndex) => (
                        <NavLink
                          key={childIndex}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) => `
                            flex items-center gap-3 mx-2 pl-8 pr-4 py-2.5 rounded-xl text-sm w-[calc(100%-1rem)] min-w-0
                            transition-all duration-200
                            ${isActive
                              ? 'bg-accent/15 text-accent font-medium'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          <span className="truncate text-start">{child.label}</span>
                        </NavLink>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* أسفل السايدبار */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            <Languages className="w-5 h-5 shrink-0" />
            <span className="truncate min-w-0">{isRTL ? 'English' : 'العربية'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-sm text-red-300"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="truncate min-w-0">{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>

        {/* المستخدم الحالي */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center text-primary font-bold shrink-0 shadow-lg">
              {currentUser?.name?.[0] || '؟'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400 truncate">{userRole ? (isRTL ? userRole.nameAr : userRole.name) : ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}