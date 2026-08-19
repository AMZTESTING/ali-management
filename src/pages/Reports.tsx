import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Coffee,
  CreditCard,
  Banknote,
  Wallet,
  Filter,
  X,
  Star,
  Zap,
} from 'lucide-react'

export default function Reports() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { orders, products, categories, paymentMethods, ingredients } = useStore()
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const filterByDate = (items: any[]) => {
    if (!dateFrom && !dateTo) return items
    return items.filter((item: any) => {
      const itemDate = new Date(item.createdAt)
      const matchesFrom = !dateFrom || itemDate >= new Date(dateFrom)
      const matchesTo = !dateTo || itemDate <= new Date(dateTo + 'T23:59:59')
      return matchesFrom && matchesTo
    })
  }

  const filteredOrders = filterByDate(orders)
  const paidOrders = filteredOrders.filter((o: any) => o.paymentStatus === 'paid')

  const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + o.total, 0)
  const totalOrders = filteredOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / paidOrders.length : 0
  const totalItemsSold = paidOrders.reduce((sum: number, o: any) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0)

  const getHourlySales = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      revenue: 0,
    }))
    
    paidOrders.forEach((order: any) => {
      const hour = new Date(order.createdAt).getHours()
      hours[hour].count += 1
      hours[hour].revenue += order.total
    })
    
    return hours
  }

  const hourlySales = getHourlySales()
  const maxHourlyCount = Math.max(...hourlySales.map(h => h.count), 1)
  const peakHours = hourlySales
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const getProductSales = () => {
    const productMap = new Map<number, { count: number; revenue: number }>()
    
    paidOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const existing = productMap.get(item.productId) || { count: 0, revenue: 0 }
        productMap.set(item.productId, {
          count: existing.count + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
        })
      })
    })
    
    return products
      .map(product => ({
        ...product,
        soldCount: productMap.get(product.id)?.count || 0,
        revenue: productMap.get(product.id)?.revenue || 0,
      }))
      .filter(p => p.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 10)
  }

  const bestSellers = getProductSales()
  const maxSoldCount = Math.max(...bestSellers.map(p => p.soldCount), 1)

  const getCategorySales = () => {
    const categoryMap = new Map<string, { count: number; revenue: number }>()
    
    paidOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          const existing = categoryMap.get(product.category) || { count: 0, revenue: 0 }
          categoryMap.set(product.category, {
            count: existing.count + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity),
          })
        }
      })
    })
    
    return categories
      .map(category => ({
        ...category,
        soldCount: categoryMap.get(category.id)?.count || 0,
        revenue: categoryMap.get(category.id)?.revenue || 0,
      }))
      .filter(c => c.soldCount > 0)
      .sort((a, b) => b.revenue - a.revenue)
  }

  const categorySales = getCategorySales()

  const getPaymentAnalysis = () => {
    return paymentMethods
      .filter(m => m.isActive)
      .map(method => {
        const methodOrders = paidOrders.filter((o: any) => o.paymentMethod === method.id)
        return {
          ...method,
          count: methodOrders.length,
          revenue: methodOrders.reduce((sum: number, o: any) => sum + o.total, 0),
          percentage: paidOrders.length > 0 ? Math.round((methodOrders.length / paidOrders.length) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }

  const paymentAnalysis = getPaymentAnalysis()

  const lowStockIngredients = ingredients.filter(i => i.quantity <= i.minimumStock)
  const alerts: { type: string; message: string; icon: any; color: string }[] = [
    ...lowStockIngredients.map(ing => ({
      type: 'low-stock',
      message: isRTL ? `${ing.nameAr} منخفض المخزون (${ing.quantity} متبقي)` : `${ing.name} low stock (${ing.quantity} left)`,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600 border-red-200',
    })),
  ]

  if (totalOrders === 0) {
    alerts.unshift({
      type: 'no-orders',
      message: isRTL ? 'لا توجد طلبات في هذه الفترة' : 'No orders in this period',
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    })
  }

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return isRTL ? `${h12} ${hour >= 12 ? 'م' : 'ص'}` : `${h12} ${ampm}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'التقارير' : 'Reports'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'تحليلات شاملة للأداء' : 'Comprehensive performance analytics'}</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            showFilters ? 'bg-accent text-primary' : 'bg-white border border-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          {isRTL ? 'الفلاتر' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{isRTL ? 'من تاريخ' : 'From'}</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{isRTL ? 'إلى تاريخ' : 'To'}</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm hover:bg-red-100 flex items-center gap-1">
              <X className="w-4 h-4" />
              {isRTL ? 'مسح' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {/* ✅ عرض الإيرادات بثلاث خانات عشرية مع العملة */}
              <p className="text-3xl font-bold">{totalRevenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
              <p className="text-sm opacity-80 mt-1">{isRTL ? 'الإيرادات' : 'Revenue'}</p>
            </div>
            <DollarSign className="w-8 h-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{totalOrders}</p>
              <p className="text-sm opacity-80 mt-1">{isRTL ? 'الطلبات' : 'Orders'}</p>
            </div>
            <ShoppingBag className="w-8 h-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              {/* ✅ متوسط الطلب بثلاث خانات عشرية مع العملة */}
              <p className="text-3xl font-bold">{averageOrderValue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
              <p className="text-sm opacity-80 mt-1">{isRTL ? 'متوسط الطلب' : 'Avg Order'}</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{totalItemsSold}</p>
              <p className="text-sm opacity-80 mt-1">{isRTL ? 'عناصر مباعة' : 'Items Sold'}</p>
            </div>
            <Zap className="w-8 h-8 opacity-50" />
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`flex items-center gap-3 p-4 rounded-2xl border ${alert.color}`}>
              <alert.icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          {isRTL ? 'المبيعات حسب الساعة' : 'Sales by Hour'}
        </h2>
        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
          {hourlySales.map((hourData) => (
            <div key={hourData.hour} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
              <div 
                className={`w-full rounded-t-lg transition-all ${
                  peakHours.some(p => p.hour === hourData.hour) ? 'bg-accent' : 'bg-gray-200'
                }`}
                style={{ height: `${(hourData.count / maxHourlyCount) * 100}%`, minHeight: hourData.count > 0 ? '8px' : '2px' }}
              ></div>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {formatHour(hourData.hour)}
              </span>
            </div>
          ))}
        </div>
        {peakHours.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-500">{isRTL ? 'أوقات الذروة:' : 'Peak Hours:'}</span>
            {peakHours.map((peak) => (
              <span key={peak.hour} className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                {formatHour(peak.hour)} - {peak.count} {isRTL ? 'طلب' : 'orders'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          {isRTL ? 'الأكثر مبيعًا' : 'Best Sellers'}
        </h2>
        <div className="space-y-3">
          {bestSellers.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-6">{index + 1}</span>
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{isRTL ? product.nameAr : product.name}</span>
                  <span className="text-xs text-gray-500">{product.soldCount} {isRTL ? 'مباع' : 'sold'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${(product.soldCount / maxSoldCount) * 100}%` }}
                  ></div>
                </div>
                {/* ✅ إيرادات المنتج بثلاث خانات عشرية مع العملة */}
                <p className="text-xs text-accent mt-1">{product.revenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
              </div>
            </div>
          ))}
          {bestSellers.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">{isRTL ? 'لا توجد مبيعات' : 'No sales yet'}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">{isRTL ? 'أداء الفئات' : 'Category Performance'}</h2>
          <div className="space-y-3">
            {categorySales.map(category => (
              <div key={category.id} className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-xl">
                  <Coffee className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{isRTL ? category.nameAr : category.name}</span>
                    {/* ✅ إيراد الفئة بثلاث خانات عشرية مع العملة */}
                    <span className="text-xs font-semibold text-accent">{category.revenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${categorySales.length > 0 ? (category.revenue / Math.max(...categorySales.map(c => c.revenue), 1)) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{category.soldCount} {isRTL ? 'عنصر' : 'items'}</p>
                </div>
              </div>
            ))}
            {categorySales.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">{isRTL ? 'تحليل طرق الدفع' : 'Payment Analysis'}</h2>
          <div className="space-y-3">
            {paymentAnalysis.map(method => {
              const iconMap: Record<string, any> = { banknote: Banknote, 'credit-card': CreditCard, wallet: Wallet }
              const Icon = iconMap[method.icon] || Banknote
              return (
                <div key={method.id} className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{isRTL ? method.nameAr : method.name}</span>
                      <span className="text-xs text-gray-500">{method.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {method.count} {isRTL ? 'معاملة' : 'transactions'} - {/* ✅ إيراد طريقة الدفع بثلاث خانات عشرية مع العملة */}
                      {method.revenue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}
                    </p>
                  </div>
                </div>
              )
            })}
            {paymentAnalysis.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}