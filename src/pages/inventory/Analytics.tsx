import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Truck,
  Trash2,
  Filter,
  X,
} from 'lucide-react'

export default function InventoryAnalytics() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { 
    ingredients, 
    suppliers, 
    stockMovements, 
    purchases,
  } = useStore()
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const filterByDate = (items: any[]) => {
    if (!dateFrom && !dateTo) return items
    return items.filter(item => {
      const itemDate = new Date(item.createdAt)
      const matchesFrom = !dateFrom || itemDate >= new Date(dateFrom)
      const matchesTo = !dateTo || itemDate <= new Date(dateTo + 'T23:59:59')
      return matchesFrom && matchesTo
    })
  }

  const filteredMovements = filterByDate(stockMovements)
  const filteredPurchases = filterByDate(purchases)

  const totalIngredients = ingredients.length
  const lowStockCount = ingredients.filter(i => i.quantity <= i.minimumStock).length
  const totalInventoryValue = ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.cost), 0)
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.total, 0)

  const getIngredientMovementCount = (ingredientId: string) => {
    return filteredMovements.filter(m => m.ingredientId === ingredientId).length
  }

  const fastMovingIngredients = [...ingredients]
    .sort((a, b) => getIngredientMovementCount(b.id) - getIngredientMovementCount(a.id))
    .slice(0, 5)

  const getSupplierPurchases = (supplierId: string) => {
    const supplierPurchases = filteredPurchases.filter(p => p.supplierId === supplierId)
    return {
      count: supplierPurchases.length,
      amount: supplierPurchases.reduce((sum, p) => sum + p.total, 0),
    }
  }

  const topSuppliers = [...suppliers]
    .map(supplier => ({
      ...supplier,
      ...getSupplierPurchases(supplier.id),
    }))
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5)

  const ingredientPurchaseSummary = ingredients.map(ing => {
    const relatedPurchases = filteredPurchases.filter(p => 
      p.items.some((item: any) => item.ingredientId === ing.id)
    )
    const totalPurchased = relatedPurchases.reduce((sum, p) => {
      const item = p.items.find((i: any) => i.ingredientId === ing.id)
      return sum + (item ? item.quantity : 0)
    }, 0)
    
    const totalCost = relatedPurchases.reduce((sum, p) => {
      const item = p.items.find((i: any) => i.ingredientId === ing.id)
      return sum + (item ? item.quantity * item.cost : 0)
    }, 0)
    
    return {
      ...ing,
      totalPurchased,
      totalCost,
      purchaseCount: relatedPurchases.length,
    }
  })

  const mostWastedIngredients = ingredients
    .map(ing => {
      const outMovements = filteredMovements.filter(m => 
        m.ingredientId === ing.id && m.type === 'out' && 
        (m.reason.includes('هدر') || m.reason.includes('تالف') || m.reason.includes('waste') || m.reason.includes('expired'))
      )
      const wastedQuantity = outMovements.reduce((sum, m) => sum + m.quantity, 0)
      const wastedCost = wastedQuantity * ing.cost
      return {
        ...ing,
        wastedQuantity,
        wastedCost,
      }
    })
    .filter(ing => ing.wastedQuantity > 0)
    .sort((a, b) => b.wastedCost - a.wastedCost)
    .slice(0, 5)

  const totalMovements = filteredMovements.length
  const inPercentage = totalMovements > 0 ? Math.round((filteredMovements.filter(m => m.type === 'in').length / totalMovements) * 100) : 0
  const outPercentage = totalMovements > 0 ? Math.round((filteredMovements.filter(m => m.type === 'out').length / totalMovements) * 100) : 0
  const adjustmentPercentage = totalMovements > 0 ? Math.round((filteredMovements.filter(m => m.type === 'adjustment').length / totalMovements) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">{isRTL ? 'تحليلات المخزون' : 'Inventory Analytics'}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{isRTL ? 'نظرة شاملة على أداء المخزون' : 'Comprehensive inventory overview'}</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors ${
            showFilters ? 'bg-accent text-primary' : 'bg-white border border-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          {isRTL ? 'الفلاتر' : 'Filters'}
        </button>
      </div>

      {/* الفلاتر */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 items-end">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">{isRTL ? 'من تاريخ' : 'From Date'}</label>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)} 
                className="w-full px-2 py-2 border border-gray-200 rounded-xl outline-none text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">{isRTL ? 'إلى تاريخ' : 'To Date'}</label>
              <input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)} 
                className="w-full px-2 py-2 border border-gray-200 rounded-xl outline-none text-xs sm:text-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <button 
                onClick={() => { setDateFrom(''); setDateTo('') }} 
                className="w-full sm:w-auto px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs sm:text-sm hover:bg-red-100 flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                {isRTL ? 'مسح' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 sm:p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold">{totalIngredients}</p>
              <p className="text-[10px] sm:text-sm opacity-80 mt-1">{isRTL ? 'المكونات' : 'Ingredients'}</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
          </div>
        </div>
        
        <div className={`bg-gradient-to-br ${lowStockCount > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} rounded-2xl p-3 sm:p-5 text-white shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold">{lowStockCount}</p>
              <p className="text-[10px] sm:text-sm opacity-80 mt-1">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-accent to-amber-600 rounded-2xl p-3 sm:p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold">{totalInventoryValue.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
              <p className="text-[10px] sm:text-sm opacity-80 mt-1">{isRTL ? 'قيمة المخزون' : 'Inventory Value'}</p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-3 sm:p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl sm:text-3xl font-bold">{totalPurchasesAmount.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</p>
              <p className="text-[10px] sm:text-sm opacity-80 mt-1">{isRTL ? 'المشتريات' : 'Purchases'}</p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* الملخصات الثلاث */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* ملخص الحركة */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3">{isRTL ? 'ملخص الحركة' : 'Movement Summary'}</h3>
          
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" 
                  strokeDasharray={`${inPercentage * 2.51} 251.2`} 
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" 
                  strokeDasharray={`${outPercentage * 2.51} 251.2`} 
                  strokeDashoffset={`-${inPercentage * 2.51}`}
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#9ca3af" strokeWidth="12" 
                  strokeDasharray={`${adjustmentPercentage * 2.51} 251.2`} 
                  strokeDashoffset={`-${(inPercentage + outPercentage) * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalMovements}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{isRTL ? 'حركة' : 'Movements'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-gray-600">{isRTL ? 'داخل' : 'In'}</span>
              </div>
              <span className="font-semibold">{inPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-600">{isRTL ? 'خارج' : 'Out'}</span>
              </div>
              <span className="font-semibold">{outPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                <span className="text-gray-600">{isRTL ? 'تعديل' : 'Adjust'}</span>
              </div>
              <span className="font-semibold">{adjustmentPercentage}%</span>
            </div>
          </div>
        </div>

        {/* الأكثر حركة */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            {isRTL ? 'الأكثر حركة' : 'Fast Moving'}
          </h3>
          <div className="space-y-2">
            {fastMovingIngredients.map((ing, index) => {
              const movementCount = getIngredientMovementCount(ing.id)
              const maxCount = Math.max(...fastMovingIngredients.map(i => getIngredientMovementCount(i.id)), 1)
              const percentage = Math.round((movementCount / maxCount) * 100)
              
              return (
                <div key={ing.id} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium">{isRTL ? ing.nameAr : ing.name}</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">{movementCount}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
            {fastMovingIngredients.length === 0 && (
              <p className="text-center text-gray-400 text-xs sm:text-sm py-4">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
            )}
          </div>
        </div>

        {/* أفضل الموردين */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            {isRTL ? 'أفضل الموردين' : 'Top Suppliers'}
          </h3>
          <div className="space-y-2">
            {topSuppliers.map((supplier: any, index: number) => {
              const maxAmount = Math.max(...topSuppliers.map((s: any) => s.amount), 1)
              const percentage = Math.round((supplier.amount / maxAmount) * 100)
              
              return (
                <div key={supplier.id} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium">{supplier.name}</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-accent">{supplier.amount.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{supplier.count} {isRTL ? 'طلبات' : 'orders'}</p>
                  </div>
                </div>
              )
            })}
            {topSuppliers.length === 0 && (
              <p className="text-center text-gray-400 text-xs sm:text-sm py-4">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
            )}
          </div>
        </div>
      </div>

      {/* جدول ملخص المشتريات */}
      <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3">{isRTL ? 'ملخص مشتريات المكونات' : 'Ingredients Purchases Summary'}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className={`py-2.5 px-2.5 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'المكون' : 'Ingredient'}
                </th>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-gray-500 text-center">
                  {isRTL ? 'الكمية المشتراة' : 'Purchased Qty'}
                </th>
                <th className="py-2.5 px-2.5 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-gray-500 text-center">
                  {isRTL ? 'عدد الطلبات' : 'Orders'}
                </th>
                <th className={`py-2.5 px-2.5 sm:py-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isRTL ? 'التكلفة الإجمالية' : 'Total Cost'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredientPurchaseSummary
                .filter(ing => ing.purchaseCount > 0)
                .map(ing => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className={`py-2 px-2.5 sm:py-3 sm:px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs sm:text-sm font-medium">{isRTL ? ing.nameAr : ing.name}</span>
                    </td>
                    <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center">
                      <span className="text-xs sm:text-sm">{ing.totalPurchased}</span>
                    </td>
                    <td className="py-2 px-2.5 sm:py-3 sm:px-4 text-center">
                      <span className="text-xs sm:text-sm text-gray-500">{ing.purchaseCount}</span>
                    </td>
                    <td className={`py-2 px-2.5 sm:py-3 sm:px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs sm:text-sm font-semibold text-accent">{ing.totalCost.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                    </td>
                  </tr>
                ))}
              {ingredientPurchaseSummary.filter(ing => ing.purchaseCount > 0).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-xs sm:text-sm">
                    {isRTL ? 'لا توجد مشتريات' : 'No purchases'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مخزون منخفض والأكثر هدر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            {isRTL ? 'مخزون منخفض' : 'Low Stock'}
          </h3>
          <div className="space-y-2">
            {ingredients.filter(i => i.quantity <= i.minimumStock).map(ing => (
              <div key={ing.id} className="flex items-center justify-between bg-red-50 rounded-xl p-2.5 sm:p-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium">{isRTL ? ing.nameAr : ing.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{ing.quantity} / {ing.minimumStock}</p>
                </div>
                <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  {Math.round((ing.quantity / ing.minimumStock) * 100)}%
                </span>
              </div>
            ))}
            {ingredients.filter(i => i.quantity <= i.minimumStock).length === 0 && (
              <p className="text-center text-gray-400 text-xs sm:text-sm py-4">{isRTL ? 'كل المكونات متوفرة' : 'All stocked'}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-base sm:text-lg text-gray-800 mb-3 flex items-center gap-2">
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            {isRTL ? 'الأكثر هدر' : 'Most Wasted'}
          </h3>
          <div className="space-y-2">
            {mostWastedIngredients.map(ing => (
              <div key={ing.id} className="flex items-center justify-between bg-orange-50 rounded-xl p-2.5 sm:p-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium">{isRTL ? ing.nameAr : ing.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{ing.wastedQuantity} {isRTL ? 'وحدة مهدرة' : 'units wasted'}</p>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-orange-600">
                  {ing.wastedCost.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}
                </span>
              </div>
            ))}
            {mostWastedIngredients.length === 0 && (
              <p className="text-center text-gray-400 text-xs sm:text-sm py-4">{isRTL ? 'لا يوجد هدر' : 'No waste'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}