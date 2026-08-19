import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { 
  CheckCircle2, 
  Bell, 
  Play,
  Package,
} from 'lucide-react'

export default function Barista() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { orders, updateOrderStatus } = useStore()
  
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const prevPendingCount = useRef(orders.filter(o => o.status === 'pending').length)
  const pendingColumnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentPending = orders.filter(o => o.status === 'pending').length
    if (currentPending > prevPendingCount.current) {
      const diff = currentPending - prevPendingCount.current
      setNewOrdersCount(prev => prev + diff)
    }
    prevPendingCount.current = currentPending
  }, [orders])

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  const handleNewOrdersClick = () => {
    pendingColumnRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setNewOrdersCount(0)
  }

  const OrderCard = ({ order }: { order: any }) => {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
        order.status === 'pending' ? 'border-yellow-300' : 
        order.status === 'preparing' ? 'border-blue-300' : 
        'border-green-300'
      }`}>
        {/* رقم الطلب والوقت */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-extrabold text-gray-800">{order.number}</p>
            {order.vehicleNumber && (
              <p className="text-xl font-bold text-blue-600 mt-1">🚗 {order.vehicleNumber}</p>
            )}
            <p className="text-lg text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
            </p>
          </div>
          <span className={`text-xl px-4 py-2 rounded-full border-2 ${
            order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 
            order.status === 'preparing' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
            'bg-green-50 text-green-600 border-green-200'
          }`}>
            {order.status === 'pending' ? (isRTL ? 'جديد' : 'New') : 
             order.status === 'preparing' ? (isRTL ? 'قيد التحضير' : 'Preparing') : 
             (isRTL ? 'جاهز' : 'Ready')}
          </span>
        </div>

        {/* العناصر - بدون أيقونات، بولد وواضح */}
        <div className="space-y-3 mb-4">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center bg-gray-50 rounded-xl px-5 py-4">
              <span className="text-2xl font-extrabold text-gray-900">
                {isRTL ? item.nameAr : item.name}
              </span>
              <span className="text-3xl font-black text-accent">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* ملاحظات */}
        {order.items.some((item: any) => item.notes) && (
          <div className="mb-4 space-y-2">
            {order.items.filter((item: any) => item.notes).map((item: any, index: number) => (
              <p key={index} className="text-lg text-orange-600 bg-orange-50 rounded-xl px-4 py-3">
                📝 {item.notes}
              </p>
            ))}
          </div>
        )}

        {/* أزرار التحضير */}
        {order.status === 'pending' && (
          <button 
            onClick={() => updateOrderStatus(order.id, 'preparing')}
            className="w-full py-4 bg-blue-500 text-white rounded-xl text-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-7 h-7" />
            {isRTL ? 'بدء التحضير' : 'Start Preparing'}
          </button>
        )}

        {order.status === 'preparing' && (
          <button 
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="w-full py-4 bg-green-500 text-white rounded-xl text-xl font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-7 h-7" />
            {isRTL ? 'جاهز!' : 'Ready!'}
          </button>
        )}

        {order.status === 'ready' && (
          <div className="w-full py-4 bg-green-50 text-green-600 rounded-xl text-xl font-bold flex items-center justify-center gap-3">
            <Package className="w-7 h-7" />
            {isRTL ? 'في انتظار الكاشير للتسليم' : 'Waiting for cashier'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-primary">{isRTL ? 'شاشة الباريستا' : 'Barista Screen'}</h1>
          <p className="text-xl text-gray-500 mt-1">
            {isRTL 
              ? `${pendingOrders.length} جديد | ${preparingOrders.length} قيد التحضير | ${readyOrders.length} جاهز`
              : `${pendingOrders.length} new | ${preparingOrders.length} preparing | ${readyOrders.length} ready`}
          </p>
        </div>
        {pendingOrders.length > 0 && (
          <div className="flex items-center gap-3 bg-yellow-100 text-yellow-700 px-6 py-3 rounded-2xl">
            <Bell className="w-8 h-8 animate-bounce" />
            <span className="text-2xl font-bold">{pendingOrders.length} {isRTL ? 'جديد' : 'New'}</span>
          </div>
        )}
      </div>

      {/* الأعمدة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* عمود جديد */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-yellow-100 text-yellow-700 px-6 py-4 rounded-2xl font-bold text-2xl">
            <Bell className="w-7 h-7" />
            {isRTL ? 'طلبات جديدة' : 'New Orders'}
            <span className="bg-yellow-200 px-3 py-1 rounded-full text-xl">{pendingOrders.length}</span>
          </div>

          {newOrdersCount > 0 && (
            <button
              onClick={handleNewOrdersClick}
              className="sticky top-0 z-10 w-full flex items-center justify-center gap-3 bg-accent text-primary px-6 py-3 rounded-2xl shadow-lg text-xl font-bold hover:bg-accent/90 transition-all animate-bounce"
            >
              <Bell className="w-7 h-7" />
              {newOrdersCount} {isRTL ? 'طلب جديد' : 'New Orders'}
              <span className="text-lg">↑</span>
            </button>
          )}

          <div 
            ref={pendingColumnRef} 
            className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2"
          >
            {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {pendingOrders.length === 0 && (
              <p className="text-center text-gray-400 text-2xl py-8">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
            )}
          </div>
        </div>

        {/* عمود قيد التحضير */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-blue-100 text-blue-700 px-6 py-4 rounded-2xl font-bold text-2xl">
            <Play className="w-7 h-7" />
            {isRTL ? 'قيد التحضير' : 'Preparing'}
            <span className="bg-blue-200 px-3 py-1 rounded-full text-xl">{preparingOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            {preparingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {preparingOrders.length === 0 && (
              <p className="text-center text-gray-400 text-2xl py-8">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
            )}
          </div>
        </div>

        {/* عمود جاهز */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-100 text-green-700 px-6 py-4 rounded-2xl font-bold text-2xl">
            <Package className="w-7 h-7" />
            {isRTL ? 'جاهز للتسليم' : 'Ready'}
            <span className="bg-green-200 px-3 py-1 rounded-full text-xl">{readyOrders.length}</span>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            {readyOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {readyOrders.length === 0 && (
              <p className="text-center text-gray-400 text-2xl py-8">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}