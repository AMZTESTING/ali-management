import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { supabase } from '../lib/supabaseClient'
import {
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  Coffee,
  Clock,
  Banknote,
  CreditCard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'

export default function Dashboard() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { orders, products, categories, ingredients, purchases } = useStore() // ✅ أضفنا purchases

  // ✅ إضافة useEffect لاختبار الاتصال بـ Supabase
  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .then(({ data, error }) => {
        console.log('Products from Supabase:', data)
        if (error) console.log('Supabase error:', error)
      })
  }, [])

  const [salesPeriod, setSalesPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [topFilter, setTopFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all')

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
  const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = orders.length
  const totalPaidOrders = paidOrders.length
  const averageOrderValue = totalPaidOrders > 0 ? totalSales / totalPaidOrders : 0
  const totalProducts = products.length
  const totalCategories = categories.length

  const statsCards = [
    { label: isRTL ? 'إجمالي المبيعات' : 'Total Sales', value: `${totalSales.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`, icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    { label: isRTL ? 'إجمالي الطلبات' : 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
    { label: isRTL ? 'الطلبات المدفوعة' : 'Total Paid Orders', value: totalPaidOrders.toString(), icon: CheckCircle2, color: 'from-purple-500 to-purple-600' },
    { label: isRTL ? 'متوسط قيمة الطلب' : 'Average Order Value', value: `${averageOrderValue.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`, icon: TrendingUp, color: 'from-orange-500 to-amber-600' },
    { label: isRTL ? 'إجمالي المنتجات' : 'Total Products', value: totalProducts.toString(), icon: Package, color: 'from-pink-500 to-rose-600' },
    { label: isRTL ? 'إجمالي التصنيفات' : 'Total Categories', value: totalCategories.toString(), icon: Layers, color: 'from-cyan-500 to-teal-600' },
  ]

  const cashSales = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0)
  const cardSales = paidOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0)
  const walletSales = paidOrders.filter(o => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.total, 0)

  // ✅ تم استبدال كتلة حساب Cash Flow بالكود الصحيح
  // Cash In = إجمالي المبيعات النقدية (قيمة الطلبات المدفوعة نقدًا)
  const cashInTotal = paidOrders
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0)

  // Cash Out = إجمالي المشتريات المستلمة من الموردين
  const cashOutTotal = purchases
    .filter(p => p.status === 'received')
    .reduce((sum, p) => sum + p.total, 0)

  const totalCashFlow = cashInTotal + cashOutTotal

  // النسب المئوية من إجمالي الحركة النقدية (Cash In + Cash Out)
  const cashInPercentage = totalCashFlow > 0 ? (cashInTotal / totalCashFlow) * 100 : 0
  const cashOutPercentage = totalCashFlow > 0 ? (cashOutTotal / totalCashFlow) * 100 : 0

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const cashInDash = (cashInPercentage / 100) * circumference
  const cashOutDash = (cashOutPercentage / 100) * circumference

  const paymentSummary = [
    { label: isRTL ? 'مبيعات كاش' : 'Cash Sales', value: `${cashSales.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`, icon: Banknote, bg: 'bg-green-50', text: 'text-green-600' },
    { label: isRTL ? 'مبيعات شبكة' : 'Card Sales', value: `${cardSales.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`, icon: CreditCard, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: isRTL ? 'مبيعات محفظة' : 'Wallet Sales', value: `${walletSales.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`, icon: Wallet, bg: 'bg-purple-50', text: 'text-purple-600' },
  ]

  const formatHour = (hour: number) => {
    if (isRTL) return `${hour % 12 || 12} ${hour >= 12 ? 'م' : 'ص'}`
    return `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`
  }

  const hourlyOrders = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = paidOrders.filter(o => new Date(o.createdAt).getHours() === hour)
    return { hour, count: hourOrders.length, total: hourOrders.reduce((sum, o) => sum + o.total, 0) }
  })
  const maxHourlySales = Math.max(...hourlyOrders.map(h => h.total), 1)

  const predictedPeakHours = hourlyOrders
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => formatHour(h.hour))

  const getTopProducts = () => {
    const now = new Date()
    let filtered = paidOrders
    if (topFilter === 'today') filtered = paidOrders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString())
    else if (topFilter === 'week') { const weekAgo = new Date(now.getTime() - 7 * 86400000); filtered = paidOrders.filter(o => new Date(o.createdAt) >= weekAgo) }
    else if (topFilter === 'month') filtered = paidOrders.filter(o => new Date(o.createdAt).getMonth() === now.getMonth())
    else if (topFilter === 'year') filtered = paidOrders.filter(o => new Date(o.createdAt).getFullYear() === now.getFullYear())

    const map = new Map<number, number>()
    filtered.forEach(o => o.items.forEach(item => map.set(item.productId, (map.get(item.productId) || 0) + item.quantity)))
    return products.map(p => ({ ...p, sold: map.get(p.id) || 0 })).filter(p => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5)
  }
  const topProducts = getTopProducts()
  const maxSold = Math.max(...topProducts.map(p => p.sold), 1)

  const lowStockProducts = products.filter(p => p.productType === 'direct' && p.stock <= 20)
  const lowStockIngredients = ingredients.filter(i => i.quantity <= i.minimumStock)

  const getDayName = (d: Date) => isRTL ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.getDay()] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  const weeklySales = Array.from({ length: 7 }, (_, i) => {
    const dow = (new Date().getDay() - i + 7) % 7
    const total = paidOrders.filter(o => new Date(o.createdAt).getDay() === dow).reduce((s, o) => s + o.total, 0)
    return { label: getDayName(new Date(2024, 0, dow + 1)), total }
  }).reverse()
  const monthlySales = Array.from({ length: 12 }, (_, m) => ({
    label: isRTL ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][m] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m],
    total: paidOrders.filter(o => new Date(o.createdAt).getMonth() === m).reduce((s, o) => s + o.total, 0)
  }))
  const salesData = salesPeriod === 'weekly' ? weeklySales : monthlySales
  const maxSales = Math.max(...salesData.map(d => d.total), 1)

  const chartWidth = 600
  const chartHeight = 200
  const padL = 30
  const padR = 20
  const padT = 20
  const padB = 30
  const chartPoints = salesData.map((d, i) => ({
    x: padL + (i / (salesData.length - 1)) * (chartWidth - padL - padR),
    y: padT + (1 - d.total / maxSales) * (chartHeight - padT - padB)
  }))
  const linePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = `${padL},${chartHeight - padB} ${linePoints} ${chartWidth - padR},${chartHeight - padB}`

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'نظرة عامة على الأداء' : 'Performance overview'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          {isRTL ? 'مباشر' : 'Live'}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-sm hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between">
              <card.icon className="w-7 h-7 opacity-80" />
            </div>
            <p className="text-lg font-bold mt-3">{card.value}</p>
            <p className="text-xs opacity-90 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* بطاقات ملخص الدفع */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {paymentSummary.map(payment => (
          <div key={payment.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 w-full">
            <div className={`p-3 rounded-xl ${payment.bg} shrink-0`}>
              <payment.icon className={`w-6 h-6 ${payment.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">{payment.value}</p>
              <p className="text-xs text-gray-500">{payment.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Sales Trend */}
<div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
  <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
    <Clock className="w-5 h-5 text-accent" />
    {isRTL ? 'مبيعات الساعة' : 'Hourly Sales Trend'}
  </h2>

  {/* مخطط SVG احترافي */}
  <div className="w-full overflow-x-auto">
    <svg viewBox="0 0 600 200" className="w-full h-auto min-w-[500px]">
      <defs>
        <linearGradient id="hourlyBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* خطوط الشبكة والتسميات الرقمية */}
      {[0, 25, 50, 75, 100].map((percent, i) => {
        const y = 20 + (percent / 100) * 150
        return (
          <g key={i}>
            <line x1="40" y1={y} x2="580" y2={y} stroke="#e5e7eb" strokeDasharray="3,3" />
            <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {Math.round(maxHourlySales * (1 - percent / 100))}
            </text>
          </g>
        )
      })}

      {/* أشرطة المبيعات */}
      {hourlyOrders.map((h, i) => {
        const barWidth = 18
        const totalBars = 24
        const totalWidth = 520 // من 40 إلى 560
        const step = totalWidth / totalBars
        const x = 40 + i * step + (step - barWidth) / 2
        const barHeight = h.total > 0 ? (h.total / maxHourlySales) * 150 : 2
        const y = 20 + 150 - barHeight

        return (
          <g key={h.hour}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="3"
              fill="url(#hourlyBarGradient)"
              className="hover:opacity-80 transition-opacity"
            >
              <title>{`${formatHour(h.hour)}: ${h.total} ${isRTL ? 'ر.ع' : 'OMR'} (${h.count} ${isRTL ? 'طلب' : 'orders'})`}</title>
            </rect>
            {i % 2 === 0 && (
              <text x={x + barWidth / 2} y={195} textAnchor="middle" fontSize="9" fill="#6b7280">
                {formatHour(h.hour)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  </div>

  {predictedPeakHours.length > 0 && (
    <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-xl flex items-start sm:items-center gap-2">
      <Clock className="w-5 h-5 text-accent shrink-0" />
      <p className="text-sm text-gray-700">
        {isRTL ? 'توقع أوقات الذروة:' : 'Predicted peak hours:'}{' '}
        <span className="font-semibold">{predictedPeakHours.join('، ')}</span>
      </p>
    </div>
  )}
</div>

      {/* Sales Analytics + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              {isRTL ? 'تحليلات المبيعات' : 'Sales Analytics'}
            </h2>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setSalesPeriod('weekly')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${salesPeriod === 'weekly' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>{isRTL ? 'أسبوعي' : 'Weekly'}</button>
              <button onClick={() => setSalesPeriod('monthly')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${salesPeriod === 'monthly' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>{isRTL ? 'شهري' : 'Monthly'}</button>
            </div>
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((level, i) => {
              const y = padT + level * (chartHeight - padT - padB)
              return (
                <g key={i}>
                  <line x1={padL} y1={y} x2={chartWidth - padR} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
                  <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{Math.round(maxSales * (1 - level))}</text>
                </g>
              )
            })}
            <polygon points={areaPoints} fill="url(#salesGradient)" />
            <polyline points={linePoints} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {chartPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />)}
            {chartPoints.map((p, i) => <text key={i} x={p.x} y={chartHeight - 8} textAnchor="middle" fontSize="10" fill="#6b7280">{salesData[i].label}</text>)}
          </svg>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Coffee className="w-5 h-5 text-accent" /> {isRTL ? 'الأكثر مبيعاً' : 'Top Selling Products'}</h2>
            <select value={topFilter} onChange={(e) => setTopFilter(e.target.value as any)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white">
              <option value="all">{isRTL ? 'كل الوقت' : 'All The Time'}</option>
              <option value="today">{isRTL ? 'اليوم' : 'Today'}</option>
              <option value="week">{isRTL ? 'هذا الأسبوع' : 'This Week'}</option>
              <option value="month">{isRTL ? 'هذا الشهر' : 'This Month'}</option>
              <option value="year">{isRTL ? 'هذه السنة' : 'This Year'}</option>
            </select>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{isRTL ? 'لا توجد مبيعات' : 'No sales'}</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.nameAr} className="w-full h-full object-cover" /> : <Coffee className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isRTL ? product.nameAr : product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{product.sold} {isRTL ? 'مباع' : 'sold'}</span>
                      <span className="text-sm font-bold text-accent">{product.price.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-accent rounded-full" style={{ width: `${(product.sold / maxSold) * 100}%` }}></div></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts + Cash Flow Circle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-red-500" /> {isRTL ? 'تنبيهات المخزون المنخفض' : 'Low Stock Alerts'}</h2>
          <div className="space-y-4">
            {lowStockProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{isRTL ? 'منتجات' : 'Products'}</p>
                <div className="space-y-2">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-red-50 rounded-xl p-3 w-full">
                      <span className="text-sm font-medium">{isRTL ? p.nameAr : p.name}</span>
                      <span className="text-xs text-red-600 font-semibold whitespace-nowrap">{p.stock} {isRTL ? 'متبقي' : 'left'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lowStockIngredients.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{isRTL ? 'مكونات' : 'Ingredients'}</p>
                <div className="space-y-2">
                  {lowStockIngredients.map(i => (
                    <div key={i.id} className="flex items-center justify-between bg-red-50 rounded-xl p-3 w-full">
                      <span className="text-sm font-medium">{isRTL ? i.nameAr : i.name}</span>
                      <span className="text-xs text-red-600 font-semibold whitespace-nowrap">{i.quantity} / {i.minimumStock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lowStockProducts.length === 0 && lowStockIngredients.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isRTL ? 'لا توجد تنبيهات مخزون' : 'No low stock alerts'}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4"><Banknote className="w-5 h-5 text-accent" /> {isRTL ? 'التدفق النقدي' : 'Cash Flow'}</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-44 h-44 shrink-0 p-2">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90 overflow-visible">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${cashInDash} ${circumference}`} strokeLinecap="round" />
                {cashOutPercentage > 0 && <circle cx="60" cy="60" r={radius} fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray={`${cashOutDash} ${circumference}`} strokeDashoffset={`-${cashInDash}`} strokeLinecap="round" />}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-gray-800">{cashOutPercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'صادر' : 'Out'}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">{isRTL ? 'وارد (Cash In)' : 'Cash In'}</span>
                <span className="text-sm font-bold text-green-600">{cashInTotal.toFixed(3)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-600">{isRTL ? 'صادر (Cash Out)' : 'Cash Out'}</span>
                <span className="text-sm font-bold text-red-600">{cashOutTotal.toFixed(3)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">{isRTL ? 'نسبة الصادر' : 'Out Percentage'}</span>
                  <span className="text-sm font-bold">{cashOutPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}