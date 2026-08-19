import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import { Plus, Edit, Trash2, X, Percent, Tag, Package, Layers } from 'lucide-react'

export default function Discounts() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { discounts, categories, products, addDiscount, updateDiscount, deleteDiscount } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null)
  // ✅ value أصبح string للحفاظ على الأصفار
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    type: 'percentage' as 'percentage' | 'amount',
    value: '',
    appliesTo: 'all' as 'all' | 'category' | 'product',
    categoryId: '',
    productId: undefined as number | undefined,
    startDate: '',
    endDate: '',
    isActive: true,
  })

  const handleSubmit = () => {
    const valueNumber = parseFloat(formData.value) || 0
    if (!formData.name || !formData.nameAr || valueNumber <= 0) return

    const dataToSave = { ...formData, value: valueNumber }

    if (editingDiscount) {
      const existing = discounts.find(d => d.id === editingDiscount)
      if (existing) {
        updateDiscount({ ...existing, ...dataToSave })
      }
      setEditingDiscount(null)
    } else {
      addDiscount(dataToSave)
    }
    
    setFormData({
      name: '', nameAr: '', type: 'percentage', value: '', appliesTo: 'all',
      categoryId: '', productId: undefined, startDate: '', endDate: '', isActive: true,
    })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const discount = discounts.find(d => d.id === id)
    if (discount) {
      setFormData({
        name: discount.name,
        nameAr: discount.nameAr,
        type: discount.type,
        value: discount.value.toString(), // ✅ تحويل الرقم إلى نص
        appliesTo: discount.appliesTo,
        categoryId: discount.categoryId || '',
        productId: discount.productId,
        startDate: discount.startDate,
        endDate: discount.endDate,
        isActive: discount.isActive,
      })
      setEditingDiscount(id)
      setShowAdd(true)
    }
  }

  const isActiveNow = (discount: typeof discounts[0]) => {
    const now = new Date()
    return discount.isActive && new Date(discount.startDate) <= now && new Date(discount.endDate) >= now
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الخصومات' : 'Discounts'}</h1>
        <button onClick={() => { setShowAdd(true); setEditingDiscount(null); setFormData({ name: '', nameAr: '', type: 'percentage', value: '', appliesTo: 'all', categoryId: '', productId: undefined, startDate: '', endDate: '', isActive: true }) }} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl">
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة خصم' : 'Add Discount'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {discounts.map(discount => (
          <div key={discount.id} className={`bg-white rounded-2xl p-6 shadow-sm ${!isActiveNow(discount) ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent/10 rounded-xl">
                {discount.type === 'percentage' ? <Percent className="w-6 h-6 text-accent" /> : <Tag className="w-6 h-6 text-accent" />}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(discount.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => deleteDiscount(discount.id)} className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            
            <p className="font-semibold text-lg">{isRTL ? discount.nameAr : discount.name}</p>
            <p className="text-2xl font-bold text-accent mt-1">
              {discount.type === 'percentage' 
                ? `${discount.value}%` 
                : `${discount.value.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`}
            </p>
            
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              {discount.appliesTo === 'all' ? (
                <><Layers className="w-4 h-4" /> {isRTL ? 'كل المنتجات' : 'All Products'}</>
              ) : discount.appliesTo === 'category' ? (
                <><Package className="w-4 h-4" /> {isRTL ? 'تصنيف محدد' : 'Specific Category'}</>
              ) : (
                <><Tag className="w-4 h-4" /> {isRTL ? 'منتج محدد' : 'Specific Product'}</>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className={`text-xs px-2 py-1 rounded-full ${isActiveNow(discount) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {isActiveNow(discount) ? (isRTL ? 'نشط الآن' : 'Active Now') : (isRTL ? 'غير نشط' : 'Inactive')}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={discount.isActive}
                  onChange={(e) => updateDiscount({ ...discount, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingDiscount ? (isRTL ? 'تعديل' : 'Edit') : (isRTL ? 'إضافة خصم' : 'Add Discount')}</h3>
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

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'النوع' : 'Type'}</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'amount' })} className="w-full px-4 py-3 border rounded-xl outline-none">
                <option value="percentage">{isRTL ? 'نسبة مئوية' : 'Percentage'}</option>
                <option value="amount">{isRTL ? 'مبلغ ثابت' : 'Fixed Amount'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'القيمة' : 'Value'}</label>
              <input 
                type="text" 
                inputMode="decimal" 
                value={formData.value} 
                onChange={(e) => setFormData({ ...formData, value: e.target.value })} 
                className="w-full px-4 py-3 border rounded-xl outline-none" 
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">{isRTL ? 'يطبق على' : 'Applies To'}</label>
              <select value={formData.appliesTo} onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'all' | 'category' | 'product' })} className="w-full px-4 py-3 border rounded-xl outline-none">
                <option value="all">{isRTL ? 'كل المنتجات' : 'All Products'}</option>
                <option value="category">{isRTL ? 'تصنيف' : 'Category'}</option>
                <option value="product">{isRTL ? 'منتج' : 'Product'}</option>
              </select>
            </div>

            {formData.appliesTo === 'category' && (
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'التصنيف' : 'Category'}</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none">
                  <option value="">{isRTL ? 'اختر' : 'Select'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{isRTL ? cat.nameAr : cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.appliesTo === 'product' && (
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'المنتج' : 'Product'}</label>
                <select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })} className="w-full px-4 py-3 border rounded-xl outline-none">
                  <option value="">{isRTL ? 'اختر' : 'Select'}</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{isRTL ? prod.nameAr : prod.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'من' : 'From'}</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'إلى' : 'To'}</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
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