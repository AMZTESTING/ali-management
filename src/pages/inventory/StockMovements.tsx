import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { 
  Plus, 
  X, 
  ArrowDown, 
  ArrowUp, 
  Settings2,
  Trash2,
  RotateCcw,
} from 'lucide-react'

export default function StockMovements() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { stockMovements, ingredients, addStockMovement } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    type: 'adjustment' as 'in' | 'out' | 'adjustment' | 'waste' | 'return',
    ingredientId: '',
    quantity: 0,
    reason: '',
  })

  const movementTypeConfig: Record<string, { label: string; labelEn: string; color: string; icon: any }> = {
    in: { label: 'داخل', labelEn: 'In', color: 'bg-green-50 text-green-600', icon: ArrowDown },
    out: { label: 'خارج', labelEn: 'Out', color: 'bg-red-50 text-red-600', icon: ArrowUp },
    adjustment: { label: 'تعديل', labelEn: 'Adjustment', color: 'bg-gray-50 text-gray-600', icon: Settings2 },
    waste: { label: 'هدر', labelEn: 'Waste', color: 'bg-orange-50 text-orange-600', icon: Trash2 },
    return: { label: 'مرتجع', labelEn: 'Return', color: 'bg-blue-50 text-blue-600', icon: RotateCcw },
  }

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = searchQuery === '' || 
      movement.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleSubmit = () => {
    if (!formData.ingredientId || formData.quantity <= 0) return
    
    const ingredient = ingredients.find(i => i.id === formData.ingredientId)
    if (!ingredient) return
    
    addStockMovement({
      type: formData.type,
      ingredientId: formData.ingredientId,
      ingredientName: isRTL ? ingredient.nameAr : ingredient.name,
      quantity: formData.quantity,
      reason: formData.reason || (isRTL ? 'حركة يدوية' : 'Manual movement'),
      createdAt: new Date().toISOString(),
    })
    
    setFormData({ type: 'adjustment', ingredientId: '', quantity: 0, reason: '' })
    setShowAdd(false)
  }

  const columns = [
    { key: 'type', label: 'Type', labelAr: 'النوع' },
    { key: 'ingredient', label: 'Ingredient', labelAr: 'المكون' },
    { key: 'quantity', label: 'Quantity', labelAr: 'الكمية' },
    { key: 'reason', label: 'Reason', labelAr: 'السبب' },
    { key: 'reference', label: 'Ref', labelAr: 'المرجع' },
    { key: 'date', label: 'Date', labelAr: 'التاريخ' },
  ]

  const renderCell = (movement: any, column: any) => {
    switch (column.key) {
      case 'type': {
        const config = movementTypeConfig[movement.type] || movementTypeConfig.adjustment
        const Icon = config.icon
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {isRTL ? config.label : config.labelEn}
          </span>
        )
      }
      case 'ingredient':
        return <span className="font-medium text-sm">{movement.ingredientName}</span>
      case 'quantity':
        return (
          <span className={`font-bold ${
            movement.type === 'in' || movement.type === 'return' ? 'text-green-600' : 
            movement.type === 'out' || movement.type === 'waste' ? 'text-red-500' : 
            'text-gray-600'
          }`}>
            {movement.type === 'in' || movement.type === 'return' ? '+' : '-'}{movement.quantity}
          </span>
        )
      case 'reason':
        return <span className="text-sm text-gray-600">{movement.reason}</span>
      case 'reference':
        return <span className="text-sm text-gray-500">{movement.reference || '—'}</span>
      case 'date':
        return <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(movement.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
      default:
        return null
    }
  }

  const totalIn = stockMovements.filter(m => m.type === 'in' || m.type === 'return').length
  const totalOut = stockMovements.filter(m => m.type === 'out' || m.type === 'waste').length
  const totalAdjustment = stockMovements.filter(m => m.type === 'adjustment').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'حركة المخزون' : 'Stock Movements'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'تتبع جميع حركات المخزون' : 'Track all stock movements'}</p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setFormData({ type: 'adjustment', ingredientId: '', quantity: 0, reason: '' }) }} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة حركة يدوية' : 'Add Manual Movement'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <ArrowDown className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{totalIn}</p>
          <p className="text-xs text-green-700 mt-1">{isRTL ? 'داخل' : 'In'}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <ArrowUp className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{totalOut}</p>
          <p className="text-xs text-red-700 mt-1">{isRTL ? 'خارج' : 'Out'}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <Settings2 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-600">{totalAdjustment}</p>
          <p className="text-xs text-gray-700 mt-1">{isRTL ? 'تعديل' : 'Adjustment'}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl bg-white outline-none text-sm`}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredMovements}
        renderCell={renderCell}
        emptyMessage="No stock movements"
        emptyMessageAr="لا توجد حركات مخزون"
      />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{isRTL ? 'إضافة حركة يدوية' : 'Add Manual Movement'}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'نوع الحركة' : 'Movement Type'}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(movementTypeConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: key as any })}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                        formData.type === key ? 'border-accent bg-accent/10' : 'border-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{isRTL ? config.label : config.labelEn}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'المكون' : 'Ingredient'}</label>
              <select 
                value={formData.ingredientId} 
                onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })} 
                className="w-full px-4 py-3 border rounded-xl outline-none"
              >
                <option value="">{isRTL ? 'اختر المكون' : 'Select ingredient'}</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>
                    {isRTL ? ing.nameAr : ing.name} ({ing.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الكمية' : 'Quantity'}</label>
              <input 
                type="number" 
                min="0" 
                value={formData.quantity} 
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} 
                className="w-full px-4 py-3 border rounded-xl outline-none" 
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'السبب' : 'Reason'}</label>
              <input 
                type="text" 
                value={formData.reason} 
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
                className="w-full px-4 py-3 border rounded-xl outline-none" 
                placeholder={isRTL ? 'مثال: هدر، تالف، تعديل...' : 'e.g. Waste, Damaged, Adjustment...'}
              />
            </div>

            <button 
              onClick={handleSubmit} 
              className="w-full py-3 bg-accent text-primary font-bold rounded-xl"
            >
              {isRTL ? 'حفظ الحركة' : 'Save Movement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}