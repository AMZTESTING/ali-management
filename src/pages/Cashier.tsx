import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { 
  Clock, CheckCircle2, Coffee, Bell, Package, XCircle, Banknote, CreditCard, Wallet,
} from 'lucide-react'

const paymentIcons: Record<string, any> = {
  banknote: Banknote,
  'credit-card': CreditCard,
  wallet: Wallet,
}

export default function Cashier() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { orders, updateOrderStatus, cancelOrder, paymentMethods } = useStore()
  
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const prevOrdersLength = useRef(orders.length)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const activePaymentMethods = paymentMethods.filter(m => m.isActive)

  useEffect(() => {
    if (orders.length > prevOrdersLength.current) {
      const diff = orders.length - prevOrdersLength.current
      setNewOrdersCount(prev => prev + diff)
    }
    prevOrdersLength.current = orders.length
  }, [orders.length])

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
  const completedOrders = orders.filter(o => o.status === 'completed')

  const statusConfig: Record<string, { label: string; labelEn: string; color: string; icon: any }> = {
    pending: { label: 'جديد', labelEn: 'New', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
    preparing: { label: 'قيد التحضير', labelEn: 'Preparing', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Coffee },
    ready: { label: 'جاهز', labelEn: 'Ready', color: 'bg-green-50 text-green-600 border-green-200', icon: Package },
    completed: { label: 'تم التسليم', labelEn: 'Delivered', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: CheckCircle2 },
    cancelled: { label: 'ملغي', labelEn: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
  }

  const handleNewOrdersClick = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setNewOrdersCount(0)
  }

  const handleCashSelected = () => {
  setShowPaymentModal(false)
  setShowCashModal(true)
  setCashReceived('')
}

  const handleCashConfirm = () => {
  updateOrderStatus(selectedOrderForPayment.id, 'completed', 'cash')
  setShowCashModal(false)
  setSelectedOrderForPayment(null)
  setCashReceived('')
}

  const OrderRow = ({ order }: { order: any }) => {
    const StatusIcon = statusConfig[order.status]?.icon || Clock
    const PaymentMethodIcon = order.paymentMethod ? paymentIcons[order.paymentMethod] || Banknote : null
    
    return (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
        order.status === 'pending' ? 'border-yellow-300' : 
        order.status === 'preparing' ? 'border-blue-300' : 
        'border-green-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-bold text-gray-800">{order.number}</p>
            {order.vehicleNumber && <p className="text-sm font-semibold text-blue-600">🚗 {order.vehicleNumber}</p>}
            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusConfig[order.status]?.color}`}>
            <StatusIcon className="w-3.5 h-3.5 inline" /> {isRTL ? statusConfig[order.status]?.label : statusConfig[order.status]?.labelEn}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.quantity}x {isRTL ? item.nameAr : item.name}</span>
              <span>{(item.price * item.quantity).toFixed(3)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.paymentStatus === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مدفوع' : 'Unpaid')}
            </span>
            {PaymentMethodIcon && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <PaymentMethodIcon className="w-4 h-4" />
                {order.paymentMethod === 'cash' ? (isRTL ? 'كاش' : 'Cash') : order.paymentMethod === 'card' ? (isRTL ? 'شبكة' : 'Card') : (isRTL ? 'محفظة' : 'Wallet')}
              </span>
            )}
          </div>
          <span className="text-base font-bold text-accent">{order.total.toFixed(3)}</span>
        </div>

        {order.status === 'ready' && order.paymentStatus === 'unpaid' && (
          <button 
            onClick={() => { setSelectedOrderForPayment(order); setShowPaymentModal(true) }}
            className="w-full mt-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold"
          >
            {isRTL ? 'استلام الدفع وتسليم' : 'Receive Payment & Deliver'}
          </button>
        )}
        {order.status === 'ready' && order.paymentStatus === 'paid' && (
          <button 
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="w-full mt-3 py-2 bg-accent text-primary rounded-lg text-sm font-semibold"
          >
            {isRTL ? 'تسليم الطلب' : 'Deliver Order'}
          </button>
        )}
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <button 
            onClick={() => { if (window.confirm(isRTL ? 'إلغاء الطلب؟' : 'Cancel order?')) cancelOrder(order.id) }} 
            className="w-full mt-2 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">{isRTL ? 'شاشة الكاشير' : 'Cashier Screen'}</h1>
          <p className="text-sm text-gray-500">{isRTL ? 'متابعة حالة الطلبات لحظة بلحظة' : 'Track order status in real-time'}</p>
        </div>
        {activeOrders.length > 0 && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl">
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="text-sm font-semibold">{activeOrders.length} {isRTL ? 'نشط' : 'Active'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs">{isRTL ? 'جديد' : 'New'}</p>
        </div>
        <div className="bg-blue-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{orders.filter(o => o.status === 'preparing').length}</p>
          <p className="text-xs">{isRTL ? 'قيد التحضير' : 'Preparing'}</p>
        </div>
        <div className="bg-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{orders.filter(o => o.status === 'ready').length}</p>
          <p className="text-xs">{isRTL ? 'جاهز' : 'Ready'}</p>
        </div>
      </div>

      <div className="relative">
        {newOrdersCount > 0 && (
          <button
            onClick={handleNewOrdersClick}
            className="sticky top-0 z-10 mx-auto mb-3 flex items-center gap-2 bg-accent text-primary px-4 py-2 rounded-xl shadow text-sm font-bold animate-bounce"
          >
            <Bell className="w-4 h-4" />
            {newOrdersCount} {isRTL ? 'طلب جديد' : 'New Orders'} ↑
          </button>
        )}

        <div ref={scrollContainerRef} className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          <h2 className="text-base font-bold mb-3">{isRTL ? 'الطلبات النشطة' : 'Active Orders'}</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {activeOrders.map(order => <OrderRow key={order.id} order={order} />)}
            {activeOrders.length === 0 && <p className="text-center text-gray-400 text-sm py-8">{isRTL ? 'لا توجد طلبات نشطة' : 'No active orders'}</p>}
          </div>
        </div>
      </div>

      {completedOrders.length > 0 && (
        <div className="mt-4">
          <h2 className="text-base font-bold mb-3">{isRTL ? 'الطلبات المكتملة' : 'Completed Orders'}</h2>
          <div className="space-y-2">
            {completedOrders.slice(0, 5).map(order => (
              <div key={order.id} className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
                <span className="font-medium">{order.number}</span>
                <span className="text-xs text-gray-500">{new Date(order.completedAt || order.createdAt).toLocaleTimeString()}</span>
                <span className="font-bold text-accent">{order.total.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نافذة اختيار طريقة الدفع */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'استلام الدفع' : 'Receive Payment'}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{selectedOrderForPayment.number}</p>
              <p className="text-2xl font-bold text-accent">{selectedOrderForPayment.total.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
            </div>
            {activePaymentMethods.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">{isRTL ? 'لا توجد طرق دفع نشطة' : 'No active payment methods'}</p>
            ) : (
              <div className={`grid gap-2 ${activePaymentMethods.length === 1 ? 'grid-cols-1' : activePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {activePaymentMethods.map(method => {
                  const MethodIcon = paymentIcons[method.icon] || Banknote
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
  if (method.id === 'cash') {
    handleCashSelected()
  } else {
    setShowPaymentModal(false)
    // ✅ استدعاء updateOrderStatus مع تمرير طريقة الدفع
    updateOrderStatus(selectedOrderForPayment.id, 'completed', method.id as any)
  }
}}
                      className="p-3 rounded-xl border-2 border-gray-200 hover:border-accent"
                    >
                      <MethodIcon className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-sm">{isRTL ? method.nameAr : method.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <button onClick={() => setShowPaymentModal(false)} className="w-full py-2 bg-gray-100 rounded-xl text-sm">{isRTL ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {/* نافذة الدفع النقدي */}
      {showCashModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'الدفع النقدي' : 'Cash Payment'}</h3>
              <button onClick={() => setShowCashModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
              <p className="text-3xl font-extrabold text-accent">{selectedOrderForPayment.total.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'المبلغ المستلم' : 'Amount Received'}</label>
              <input
  type="text"
  inputMode="decimal"
  value={cashReceived}
  onChange={(e) => setCashReceived(e.target.value)}
  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none text-lg"
  placeholder="0.000"
/>
            </div>
            {parseFloat(cashReceived) > 0 && (
  <div className={`p-3 rounded-xl ${parseFloat(cashReceived) >= selectedOrderForPayment.total ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
    <p className="text-sm font-semibold">
      {isRTL ? 'الباقي' : 'Change'}: {(parseFloat(cashReceived) - selectedOrderForPayment.total).toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}
    </p>
  </div>
)}
<button
  onClick={handleCashConfirm}
  disabled={parseFloat(cashReceived) < selectedOrderForPayment.total}
  className="w-full py-3 bg-green-500 text-white rounded-xl font-bold disabled:opacity-50"
>
              {isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}