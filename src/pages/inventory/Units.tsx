import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Plus, Trash2, X, Scale, Package, Layers, Edit } from 'lucide-react'

export default function Units() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { units, ingredients, products, addUnit, updateUnit, deleteUnit } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingUnit, setEditingUnit] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', nameAr: '' })
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = () => {
    if (!formData.name || !formData.nameAr) return
    
    if (editingUnit) {
      const existing = units.find(u => u.id === editingUnit)
      if (existing) {
        updateUnit({ ...existing, ...formData })
      }
      setEditingUnit(null)
    } else {
      addUnit(formData)
    }
    
    setFormData({ name: '', nameAr: '' })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const unit = units.find(u => u.id === id)
    if (unit) {
      setFormData({ name: unit.name, nameAr: unit.nameAr })
      setEditingUnit(id)
      setShowAdd(true)
    }
  }

  const getIngredientCountByUnit = (unitId: string) => {
    return ingredients.filter(ing => ing.unit === unitId).length
  }

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.nameAr.includes(searchQuery)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const columns = [
    { key: 'name', label: 'Unit', labelAr: 'الوحدة' },
    { key: 'ingredients', label: 'Ingredients', labelAr: 'المكونات' },
    { key: 'createdAt', label: 'Created', labelAr: 'تاريخ الإنشاء' },
    { key: 'updatedAt', label: 'Updated', labelAr: 'آخر تحديث' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (unit: any, column: any) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-xl">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{isRTL ? unit.nameAr : unit.name}</p>
              <p className="text-xs text-gray-400">{isRTL ? unit.name : unit.nameAr}</p>
            </div>
          </div>
        )
      case 'ingredients':
        return (
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium">
            <Package className="w-4 h-4" />
            {getIngredientCountByUnit(unit.id)}
          </span>
        )
      case 'createdAt':
        return (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {formatDate(unit.createdAt)}
          </span>
        )
      case 'updatedAt':
        return (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {formatDate(unit.updatedAt)}
          </span>
        )
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button 
              onClick={() => handleEdit(unit.id)} 
              className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
              title={isRTL ? 'تعديل' : 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { if (window.confirm(isRTL ? 'حذف هذه الوحدة؟' : 'Delete this unit?')) deleteUnit(unit.id) }} 
              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
              title={isRTL ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الوحدات' : 'Units'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'إدارة وحدات القياس' : 'Manage measurement units'}</p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setEditingUnit(null); setFormData({ name: '', nameAr: '' }) }} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة وحدة' : 'Add Unit'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Scale className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{units.length}</p>
              <p className="text-xs text-gray-500">{isRTL ? 'الوحدات' : 'Units'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{ingredients.length}</p>
              <p className="text-xs text-gray-500">{isRTL ? 'المكونات' : 'Ingredients'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{products.length}</p>
              <p className="text-xs text-gray-500">{isRTL ? 'المنتجات' : 'Products'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Scale className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRTL ? 'بحث عن وحدة...' : 'Search units...'}
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl bg-white outline-none text-sm focus:ring-2 focus:ring-accent/50 transition-all`}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredUnits}
        renderCell={renderCell}
        emptyMessage="No units found"
        emptyMessageAr="لا توجد وحدات"
      />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {editingUnit ? (isRTL ? 'تعديل وحدة' : 'Edit Unit') : (isRTL ? 'إضافة وحدة' : 'Add Unit')}
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input 
                type="text" 
                value={formData.nameAr} 
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder={isRTL ? 'مثال: كيلو' : 'e.g. Kilogram'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="e.g. kg"
                dir="ltr"
              />
            </div>

            <button 
              onClick={handleSubmit} 
              className="w-full py-3 bg-accent text-primary font-bold rounded-xl hover:bg-accent/90 transition-colors"
            >
              {editingUnit ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}