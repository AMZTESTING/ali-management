import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Plus, Edit, Trash2, X, Coffee, IceCream, Cake, Package, UtensilsCrossed, Soup, Sandwich, Ban } from 'lucide-react'

// خريطة الأيقونات المتاحة
const iconMap: Record<string, any> = {
  coffee: Coffee,
  'ice-cream': IceCream,
  cake: Cake,
  utensils: UtensilsCrossed,
  soup: Soup,
  sandwich: Sandwich,
}

export default function Categories() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { categories, addCategory, updateCategory, deleteCategory, getProductCountByCategory } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', nameAr: '', icon: 'none' })

  const handleSubmit = () => {
    if (!formData.name || !formData.nameAr) return
    
    // تحويل 'none' إلى '' للحفظ
    const iconToSave = formData.icon === 'none' ? '' : formData.icon
    
    if (editingCategory) {
      const existing = categories.find(c => c.id === editingCategory)
      if (existing) {
        updateCategory({ ...existing, ...formData, icon: iconToSave })
      }
      setEditingCategory(null)
    } else {
      addCategory({ ...formData, icon: iconToSave })
    }
    
    setFormData({ name: '', nameAr: '', icon: 'none' })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      setFormData({
        name: category.name,
        nameAr: category.nameAr,
        icon: category.icon || 'none',
      })
      setEditingCategory(id)
      setShowAdd(true)
    }
  }

  const columns = [
    { key: 'name', label: 'Category', labelAr: 'التصنيف' },
    { key: 'icon', label: 'Icon', labelAr: 'الأيقونة' },
    { key: 'count', label: 'Products', labelAr: 'عدد المنتجات' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (category: any, column: any) => {
    switch (column.key) {
      case 'name':
        return <span className="font-semibold text-sm">{isRTL ? category.nameAr : category.name}</span>
      case 'icon': {
        if (!category.icon) {
          return <span className="text-sm text-gray-400">—</span>
        }
        const Icon = iconMap[category.icon] || Package
        return (
          <span className="inline-flex p-2 bg-primary/5 rounded-xl">
            <Icon className="w-5 h-5 text-primary" />
          </span>
        )
      }
      case 'count':
        return (
          <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            <Package className="w-4 h-4" />
            {getProductCountByCategory(category.id)}
          </span>
        )
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleEdit(category.id)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => { if (window.confirm(isRTL ? 'حذف؟' : 'Delete?')) deleteCategory(category.id) }} className="p-2 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'التصنيفات' : 'Categories'}</h1>
        <button 
          onClick={() => { setShowAdd(true); setEditingCategory(null); setFormData({ name: '', nameAr: '', icon: 'none' }) }} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة تصنيف' : 'Add Category'}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        renderCell={renderCell}
        emptyMessage="No categories found"
        emptyMessageAr="لا توجد تصنيفات"
      />

      {/* نافذة إضافة/تعديل */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingCategory ? (isRTL ? 'تعديل تصنيف' : 'Edit Category') : (isRTL ? 'إضافة تصنيف' : 'Add Category')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>

            {/* اختيار الأيقونة (اختياري) */}
            <div>
              <label className="block text-sm mb-2">{isRTL ? 'الأيقونة (اختياري)' : 'Icon (optional)'}</label>
              <div className="grid grid-cols-4 gap-2">
                {/* خيار بدون أيقونة */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: 'none' })}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                    formData.icon === 'none' ? 'border-accent bg-accent/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Ban className="w-6 h-6 text-gray-400" />
                  <span className="text-xs">{isRTL ? 'بدون' : 'None'}</span>
                </button>

                {Object.entries(iconMap).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: key })}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                      formData.icon === key ? 'border-accent bg-accent/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">
              {isRTL ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}