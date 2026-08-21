import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Bell, Search, X, AlertTriangle, Coffee, Menu, Calculator, ShoppingCart } from 'lucide-react'

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
  const navigate = useNavigate()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const calculatorRef = useRef<HTMLDivElement>(null)

  // ✅ إصلاح منطق الآلة الحاسبة
  const [calcDisplay, setCalcDisplay] = useState('0')
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null)
  const [calcOperation, setCalcOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (calculatorRef.current && !calculatorRef.current.contains(event.target as Node)) {
        setShowCalculator(false)
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

  // ✅ دوال الآلة الحاسبة الصحيحة
  const clearCalc = () => {
    setCalcDisplay('0')
    setCalcPrevValue(null)
    setCalcOperation(null)
    setWaitingForOperand(false)
  }

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setCalcDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setCalcDisplay(prev => prev === '0' ? digit : prev + digit)
    }
  }

  const inputDot = () => {
    if (waitingForOperand) {
      setCalcDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!calcDisplay.includes('.')) {
      setCalcDisplay(prev => prev + '.')
    }
  }

  const performOperation = (nextOperation: string) => {
    const currentValue = parseFloat(calcDisplay)
    if (calcPrevValue === null) {
      setCalcPrevValue(currentValue)
    } else if (calcOperation) {
      const result = calculate(calcPrevValue, currentValue, calcOperation)
      setCalcDisplay(String(result))
      setCalcPrevValue(result)
    }
    setWaitingForOperand(true)
    setCalcOperation(nextOperation)
  }

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const handleEquals = () => {
    if (calcPrevValue === null || !calcOperation) return
    const current = parseFloat(calcDisplay)
    const result = calculate(calcPrevValue, current, calcOperation)
    setCalcDisplay(String(result))
    setCalcPrevValue(null)
    setCalcOperation(null)
    setWaitingForOperand(true)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
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

      <div className="flex items-center gap-2 md:gap-3">
        {/* زر POS مباشر */}
        <button
          onClick={() => navigate('/pos')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
          title={isRTL ? 'نقطة البيع' : 'POS'}
        >
          <ShoppingCart className="w-5 h-5 text-gray-600" />
        </button>

        {/* زر الآلة الحاسبة */}
        <div className="relative" ref={calculatorRef}>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title={isRTL ? 'آلة حاسبة' : 'Calculator'}
          >
            <Calculator className="w-5 h-5 text-gray-600" />
          </button>

          {showCalculator && (
            <div
              className={`absolute top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 z-[60] p-4 ${
                isRTL ? 'left-0' : 'right-0'
              }`}
            >
              <div className="bg-gray-100 rounded-lg p-3 text-right mb-3">
                <span className="text-2xl font-bold text-gray-800 block truncate">{calcDisplay}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={clearCalc} className="p-3 bg-red-50 text-red-600 rounded-lg font-bold">C</button>
                <button onClick={() => performOperation('/')} className="p-3 bg-gray-50 rounded-lg font-bold">/</button>
                <button onClick={() => performOperation('*')} className="p-3 bg-gray-50 rounded-lg font-bold">×</button>
                <button onClick={() => performOperation('-')} className="p-3 bg-gray-50 rounded-lg font-bold">-</button>
                <button onClick={() => inputDigit('7')} className="p-3 bg-white rounded-lg">7</button>
                <button onClick={() => inputDigit('8')} className="p-3 bg-white rounded-lg">8</button>
                <button onClick={() => inputDigit('9')} className="p-3 bg-white rounded-lg">9</button>
                <button onClick={() => performOperation('+')} className="p-3 bg-gray-50 rounded-lg font-bold">+</button>
                <button onClick={() => inputDigit('4')} className="p-3 bg-white rounded-lg">4</button>
                <button onClick={() => inputDigit('5')} className="p-3 bg-white rounded-lg">5</button>
                <button onClick={() => inputDigit('6')} className="p-3 bg-white rounded-lg">6</button>
                <button onClick={handleEquals} className="p-3 bg-accent text-primary rounded-lg font-bold row-span-2">=</button>
                <button onClick={() => inputDigit('1')} className="p-3 bg-white rounded-lg">1</button>
                <button onClick={() => inputDigit('2')} className="p-3 bg-white rounded-lg">2</button>
                <button onClick={() => inputDigit('3')} className="p-3 bg-white rounded-lg">3</button>
                <button onClick={() => inputDigit('0')} className="p-3 bg-white rounded-lg col-span-2">0</button>
                <button onClick={inputDot} className="p-3 bg-white rounded-lg">.</button>
              </div>
            </div>
          )}
        </div>

        {/* زر الإشعارات */}
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
              className={`absolute top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto ${
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