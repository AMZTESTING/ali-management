import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Banknote, 
  CreditCard, 
  Wallet,
  TrendingUp,
  DollarSign,
  Receipt,
} from 'lucide-react'

const iconMap: Record<string, any> = {
  banknote: Banknote,
  'credit-card': CreditCard,
  wallet: Wallet,
}

export default function PaymentMethods() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { 
    paymentMethods, 
    orders, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod 
  } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingMethod, setEditingMethod] = useState<string | null>(null)
  const [formData, setFormData] = useState<{ name: string; nameAr: string; icon: string; isActive?: boolean }>({ name: '', nameAr: '', icon: 'banknote' })

  const getPaymentStats = (methodId: string) => {
    const methodOrders = orders.filter(o => o.paymentMethod === methodId && o.paymentStatus === 'paid')
    return {
      totalTransactions: methodOrders.length,
      totalAmount: methodOrders.reduce((sum, o) => sum + o.total, 0),
    }
  }

  const totalPaidOrders = orders.filter(o => o.paymentStatus === 'paid').length
  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)

  const getMostUsedMethod = () => {
    let mostUsed = ''
    let maxCount = 0
    paymentMethods.forEach(method => {
      const stats = getPaymentStats(method.id)
      if (stats.totalTransactions > maxCount) {
        maxCount = stats.totalTransactions
        mostUsed = method.id
      }
    })
    return mostUsed
  }

  const mostUsedMethodId = getMostUsedMethod()

  const handleSubmit = () => {
    if (!formData.name || !formData.nameAr) return
    if (editingMethod) {
      const existing = paymentMethods.find(m => m.id === editingMethod)
      if (existing) {
        updatePaymentMethod({ ...existing, ...formData })
      }
      setEditingMethod(null)
    } else {
      addPaymentMethod({ ...formData, isActive: true })
    }
    setFormData({ name: '', nameAr: '', icon: 'banknote' })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const method = paymentMethods.find(m => m.id === id)
    if (method) {
      setFormData({ name: method.name, nameAr: method.nameAr, icon: method.icon })
      setEditingMethod(id)
      setShowAdd(true)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm(isRTL ? 'حذف طريقة الدفع هذه؟' : 'Delete this payment method?')) {
      deletePaymentMethod(id)
    }
  }

  const toggleActive = (id: string) => {
    const method = paymentMethods.find(m => m.id === id)
    if (method) {
      updatePaymentMethod({ ...method, isActive: !method.isActive })
    }
  }

  // ============ أعمدة جدول السجل ============
  const transactionColumns = [
    { key: 'number', label: 'Order #', labelAr: 'رقم الطلب', align: 'right' as const },
    { key: 'payment', label: 'Payment Method', labelAr: 'طريقة الدفع', align: 'right' as const },
    { key: 'amount', label: 'Amount', labelAr: 'المبلغ', align: 'right' as const },
    { key: 'date', label: 'Date', labelAr: 'التاريخ', align: 'right' as const },
  ]

  const renderTransactionCell = (order: any, column: any) => {
    switch (column.key) {
      case 'number':
        return <span className="font-semibold text-sm">{order.number}</span>
      case 'payment': {
        const method = paymentMethods.find(m => m.id === order.paymentMethod)
        const Icon = method ? iconMap[method.icon] || Banknote : Banknote
        return (
          <span className="inline-flex items-center gap-2 text-sm">
            <Icon className="w-4 h-4 text-gray-400" />
            {method ? (isRTL ? method.nameAr : method.name) : order.paymentMethod}
          </span>
        )
      }
      case 'amount':
        return <span className="font-semibold text-accent">{order.total.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
      case 'date':
        return <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'طرق الدفع' : 'Payment Methods'}</h1>
        <button 
          onClick={() => { setShowAdd(true); setEditingMethod(null); setFormData({ name: '', nameAr: '', icon: 'banknote' }) }} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة طريقة' : 'Add Method'}
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <DollarSign className="w-6 h-6 text-accent mb-2" />
          <p className="text-2xl font-bold">{totalRevenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <Receipt className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{totalPaidOrders}</p>
          <p className="text-sm text-gray-500">{isRTL ? 'إجمالي المعاملات' : 'Total Transactions'}</p>
        </div>
        {mostUsedMethodId && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-xl font-bold">
              {isRTL ? paymentMethods.find(m => m.id === mostUsedMethodId)?.nameAr : paymentMethods.find(m => m.id === mostUsedMethodId)?.name}
            </p>
            <p className="text-sm text-gray-500">{isRTL ? 'الأكثر استخدامًا' : 'Most Used'}</p>
          </div>
        )}
      </div>

      {/* بطاقات طرق الدفع */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map(method => {
          const Icon = iconMap[method.icon] || Banknote
          const stats = getPaymentStats(method.id)
          const percentage = totalPaidOrders > 0 ? Math.round((stats.totalTransactions / totalPaidOrders) * 100) : 0
          return (
            <div key={method.id} className={`bg-white rounded-2xl p-6 shadow-sm ${!method.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/5 rounded-xl">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <button onClick={() => toggleActive(method.id)} className={`text-xs px-3 py-1 rounded-full ${method.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {method.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                </button>
              </div>
              <p className="font-semibold text-lg">{isRTL ? method.nameAr : method.name}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isRTL ? 'المعاملات' : 'Transactions'}</span>
                  <span className="font-semibold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isRTL ? 'المبلغ' : 'Amount'}</span>
                  <span className="font-semibold text-accent">{stats.totalAmount.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{percentage}%</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => handleEdit(method.id)} className="flex-1 py-2 bg-gray-50 rounded-lg flex items-center justify-center gap-1 text-sm hover:bg-gray-100">
                  <Edit className="w-4 h-4 text-gray-500" />
                  {isRTL ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => handleDelete(method.id)} className="flex-1 py-2 bg-red-50 rounded-lg flex items-center justify-center gap-1 text-sm text-red-500 hover:bg-red-100">
                  <Trash2 className="w-4 h-4" />
                  {isRTL ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* جدول سجل المعاملات */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">{isRTL ? 'سجل المعاملات' : 'Transaction History'}</h2>
        </div>
        <DataTable
          columns={transactionColumns}
          data={orders.filter(o => o.paymentStatus === 'paid')}
          renderCell={renderTransactionCell}
          emptyMessage="No transactions yet"
          emptyMessageAr="لا توجد معاملات بعد"
        />
      </div>

      {/* نافذة إضافة/تعديل */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingMethod ? (isRTL ? 'تعديل' : 'Edit') : (isRTL ? 'إضافة' : 'Add')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الأيقونة' : 'Icon'}</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setFormData({ ...formData, icon: 'banknote' })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.icon === 'banknote' ? 'border-accent bg-accent/10' : 'border-gray-200'}`}>
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs">{isRTL ? 'كاش' : 'Cash'}</span>
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, icon: 'credit-card' })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.icon === 'credit-card' ? 'border-accent bg-accent/10' : 'border-gray-200'}`}>
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs">{isRTL ? 'بطاقة' : 'Card'}</span>
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, icon: 'wallet' })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.icon === 'wallet' ? 'border-accent bg-accent/10' : 'border-gray-200'}`}>
                  <Wallet className="w-6 h-6" />
                  <span className="text-xs">{isRTL ? 'محفظة' : 'Wallet'}</span>
                </button>
              </div>
            </div>
            <button onClick={handleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">{isRTL ? 'حفظ' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )
}