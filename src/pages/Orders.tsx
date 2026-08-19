import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import DataTable from '../components/DataTable'
import { 
  Search, 
  Eye, 
  XCircle, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle2,
  PauseCircle,
  User,
  Users,
  CreditCard,
  Banknote,
  Wallet,
  ShoppingBag,
  DollarSign,
} from 'lucide-react'

const statusConfig: Record<string, { color: string; label: string; labelEn: string; icon: any }> = {
  pending: { color: 'bg-yellow-50 text-yellow-600', label: 'جديد', labelEn: 'Pending', icon: Clock },
  preparing: { color: 'bg-blue-50 text-blue-600', label: 'قيد التحضير', labelEn: 'Preparing', icon: RefreshCw },
  ready: { color: 'bg-green-50 text-green-600', label: 'جاهز', labelEn: 'Ready', icon: CheckCircle2 },
  completed: { color: 'bg-gray-50 text-gray-600', label: 'مكتمل', labelEn: 'Completed', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-50 text-red-600', label: 'ملغي', labelEn: 'Cancelled', icon: XCircle },
  held: { color: 'bg-orange-50 text-orange-600', label: 'معلق', labelEn: 'Held', icon: PauseCircle },
}

const paymentMethodConfig: Record<string, { icon: any; label: string; labelEn: string }> = {
  cash: { icon: Banknote, label: 'كاش', labelEn: 'Cash' },
  card: { icon: CreditCard, label: 'شبكة', labelEn: 'Card' },
  wallet: { icon: Wallet, label: 'محفظة', labelEn: 'Wallet' },
}

export default function Orders() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { orders, updateOrderStatus, cancelOrder } = useStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedOrderData = orders.find(o => o.id === selectedOrder)

  const columns = [
    { key: 'number', label: 'Order #', labelAr: 'رقم الطلب' },
    { key: 'customer', label: 'Customer', labelAr: 'العميل' },
    { key: 'items', label: 'Items', labelAr: 'العناصر' },
    { key: 'total', label: 'Total', labelAr: 'الإجمالي' },
    { key: 'status', label: 'Status', labelAr: 'الحالة' },
    { key: 'payment', label: 'Payment', labelAr: 'الدفع' },
    { key: 'date', label: 'Date', labelAr: 'التاريخ' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (order: any, column: any) => {
    switch (column.key) {
      case 'number':
        return <span className="font-semibold text-sm">{order.number}</span>
      
      case 'customer':
        return (
          <div className="flex items-center gap-2">
            {order.customerType === 'walk-in' ? (
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-blue-500 shrink-0" />
            )}
            <span className="text-sm">{order.customerName}</span>
          </div>
        )
      
      case 'items':
        return <span className="text-sm text-gray-600">{order.items.length}</span>
      
      case 'total':
        return <span className="font-bold text-accent">{order.total.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
      
      case 'status': {
        const StatusIcon = statusConfig[order.status]?.icon || Clock
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${statusConfig[order.status]?.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {isRTL ? statusConfig[order.status]?.label : statusConfig[order.status]?.labelEn}
          </span>
        )
      }
      
      case 'payment': {
        if (!order.paymentMethod) {
          return (
            <div className="space-y-1">
              <span className="text-xs text-gray-400">—</span>
              <span className={`text-xs px-2 py-0.5 rounded-full block w-fit ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {order.paymentStatus === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مدفوع' : 'Unpaid')}
              </span>
            </div>
          )
        }
        const PaymentIcon = paymentMethodConfig[order.paymentMethod]?.icon || Banknote
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <PaymentIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs">
                {isRTL ? paymentMethodConfig[order.paymentMethod]?.label : paymentMethodConfig[order.paymentMethod]?.labelEn}
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full block w-fit ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
              {order.paymentStatus === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مدفوع' : 'Unpaid')}
            </span>
          </div>
        )
      }
      
      case 'date':
        return (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {new Date(order.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
          </span>
        )
      
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => setSelectedOrder(order.id)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title={isRTL ? 'عرض' : 'View'}>
              <Eye className="w-4 h-4 text-blue-500" />
            </button>
            {order.status === 'pending' && (
              <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="p-2 hover:bg-yellow-50 rounded-lg transition-colors" title={isRTL ? 'بدء تحضير' : 'Prepare'}>
                <RefreshCw className="w-4 h-4 text-yellow-600" />
              </button>
            )}
            {order.status === 'preparing' && (
              <button onClick={() => updateOrderStatus(order.id, 'ready')} className="p-2 hover:bg-green-50 rounded-lg transition-colors" title={isRTL ? 'جاهز' : 'Ready'}>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <button onClick={() => { if (window.confirm(isRTL ? 'إلغاء الطلب؟' : 'Cancel order?')) cancelOrder(order.id) }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title={isRTL ? 'إلغاء' : 'Cancel'}>
                <XCircle className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const preparingCount = orders.filter(o => o.status === 'preparing').length
  const readyCount = orders.filter(o => o.status === 'ready').length

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الطلبات' : 'Orders'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'إدارة جميع الطلبات' : 'Manage all orders'}</p>
        </div>
        <button 
          onClick={() => {
            const headers = ['Order #', 'Customer', 'Total', 'Status', 'Payment Status', 'Date']
            const rows = filteredOrders.map(o => [o.number, o.customerName, o.total.toString(), o.status, o.paymentStatus, o.createdAt])
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'orders.csv'
            link.click()
          }}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          {isRTL ? 'تصدير' : 'Export'}
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <DollarSign className="w-6 h-6 text-accent mb-2" />
          <p className="text-2xl font-bold">{totalRevenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'الإيرادات' : 'Revenue'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ShoppingBag className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'الطلبات' : 'Orders'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <Clock className="w-6 h-6 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{pendingCount + preparingCount}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'قيد المعالجة' : 'Processing'}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{readyCount}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'جاهز' : 'Ready'}</p>
        </div>
      </div>

      {/* البحث والفلترة */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'بحث...' : 'Search...'}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl bg-white outline-none text-sm`}
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm"
        >
          <option value="all">{isRTL ? 'كل الحالات' : 'All Status'}</option>
          <option value="pending">{isRTL ? 'جديد' : 'Pending'}</option>
          <option value="preparing">{isRTL ? 'قيد التحضير' : 'Preparing'}</option>
          <option value="ready">{isRTL ? 'جاهز' : 'Ready'}</option>
          <option value="completed">{isRTL ? 'مكتمل' : 'Completed'}</option>
          <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
        </select>
      </div>

      {/* الجدول */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        renderCell={renderCell}
        emptyMessage="No orders found"
        emptyMessageAr="لا توجد طلبات"
      />

      {/* نافذة تفاصيل الطلب */}
      {selectedOrderData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedOrderData.number}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedOrderData.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium">{selectedOrderData.customerName}</p>
              <p className="text-sm text-gray-500">{isRTL ? 'الكاشير' : 'Cashier'}: {selectedOrderData.cashier}</p>
            </div>

            <div className="space-y-2">
              {selectedOrderData.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}x {isRTL ? item.nameAr : item.name}</span>
                  <span>{(item.price * item.quantity).toFixed(3)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{selectedOrderData.subtotal.toFixed(3)}</span>
              </div>
              {selectedOrderData.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                  <span>-{selectedOrderData.discount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>{isRTL ? 'الضريبة' : 'Tax'}</span>
                <span>{selectedOrderData.tax.toFixed(3)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span className="text-accent">{selectedOrderData.total.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
              </div>
              <div className={`text-sm ${selectedOrderData.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {selectedOrderData.paymentStatus === 'paid' ? (isRTL ? '✓ مدفوع' : '✓ Paid') : (isRTL ? '⏳ غير مدفوع' : '⏳ Unpaid')}
                {selectedOrderData.paymentMethod && (
                  <span> - {isRTL ? paymentMethodConfig[selectedOrderData.paymentMethod]?.label : paymentMethodConfig[selectedOrderData.paymentMethod]?.labelEn}</span>
                )}
              </div>
            </div>

            <button onClick={() => setSelectedOrder(null)} className="w-full py-3 bg-gray-100 rounded-xl">
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}