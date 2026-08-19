import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Edit, Trash2, X, Upload, Coffee } from 'lucide-react'

export default function Products() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ price أصبح string وليس number
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    price: '',
    category: '',
    stock: 0,
    productType: 'recipe' as 'recipe' | 'direct',
    imageUrl: '',
    isTaxable: true,
  })

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameAr.includes(searchQuery)
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    // ✅ تحويل النص إلى رقم عند الحفظ فقط
    const priceNumber = parseFloat(formData.price) || 0
    if (!formData.name || !formData.nameAr || !formData.category || priceNumber <= 0) return
    
    if (editingProduct !== null) {
      const existing = products.find(p => p.id === editingProduct)
      if (existing) {
        updateProduct({ ...existing, ...formData, price: priceNumber })
      }
      setEditingProduct(null)
    } else {
      addProduct({ ...formData, price: priceNumber })
    }
    
    setFormData({ name: '', nameAr: '', price: '', category: '', stock: 0, productType: 'recipe', imageUrl: '', isTaxable: true })
    setShowAdd(false)
  }

  const handleEdit = (id: number) => {
    const product = products.find(p => p.id === id)
    if (product) {
      setFormData({
        name: product.name,
        nameAr: product.nameAr,
        price: product.price.toString(), // ✅ تحويل الرقم إلى نص للحفاظ على الأصفار عند التعديل
        category: product.category,
        stock: product.stock,
        productType: product.productType,
        imageUrl: product.imageUrl || '',
        isTaxable: product.isTaxable,
      })
      setEditingProduct(id)
      setShowAdd(true)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? (isRTL ? category.nameAr : category.name) : '-'
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'المنتجات' : 'Products'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'إدارة المنتجات والصور' : 'Manage products and images'}</p>
        </div>
        <button 
          onClick={() => { 
            setShowAdd(true); 
            setEditingProduct(null); 
            setFormData({ name: '', nameAr: '', price: '', category: categories[0]?.id || '', stock: 0, productType: 'recipe', imageUrl: '', isTaxable: true }) 
          }} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة منتج' : 'Add Product'}
        </button>
      </div>

      {/* البحث والفلاتر */}
      <div className="flex gap-3">
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
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)} 
          className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm"
        >
          <option value="all">{isRTL ? 'الكل' : 'All'}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{isRTL ? cat.nameAr : cat.name}</option>
          ))}
        </select>
      </div>

      {/* شبكة المنتجات */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isRTL ? 'لا توجد منتجات' : 'No products'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              {/* صورة المنتج */}
              <div className="relative aspect-square bg-gray-50">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={isRTL ? product.nameAr : product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Coffee className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <span className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-[10px] px-2 py-1 rounded-full ${
                  product.productType === 'recipe' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                }`}>
                  {product.productType === 'recipe' ? (isRTL ? 'مكونات' : 'Recipe') : (isRTL ? 'مخزون مباشر' : 'Stock')}
                </span>
                <span className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} text-[10px] px-2 py-1 rounded-full ${
                  product.isTaxable ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  {product.isTaxable ? (isRTL ? 'ضريبة' : 'Tax') : (isRTL ? 'معفي' : 'Exempt')}
                </span>
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(product.id)} 
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button 
                    onClick={() => { if (window.confirm(isRTL ? 'حذف؟' : 'Delete?')) deleteProduct(product.id) }} 
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="font-medium text-sm truncate">{isRTL ? product.nameAr : product.name}</p>
                <p className="text-xs text-gray-400 truncate">{getCategoryName(product.category)}</p>
                <div className="flex items-center justify-between mt-2">
                  {/* ✅ عرض السعر بثلاث خانات عشرية */}
                  <span className="font-bold text-accent">{product.price.toFixed(3)} {isRTL ? 'ر.ع' : 'OMR'}</span>
                  {product.productType === 'direct' && (
                    <span className={`text-xs ${product.stock > 20 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock} {isRTL ? 'مخزون' : 'stock'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة إضافة/تعديل */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingProduct !== null ? (isRTL ? 'تعديل منتج' : 'Edit Product') : (isRTL ? 'إضافة منتج' : 'Add Product')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'صورة المنتج' : 'Product Image'}</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Coffee className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                  >
                    <Upload className="w-4 h-4" />
                    {isRTL ? 'رفع صورة' : 'Upload Image'}
                  </button>
                  {formData.imageUrl && (
                    <button 
                      onClick={() => setFormData({ ...formData, imageUrl: '' })} 
                      className="text-xs text-red-500 mt-2"
                    >
                      {isRTL ? 'إزالة الصورة' : 'Remove Image'}
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'نوع المنتج' : 'Product Type'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, productType: 'recipe', stock: 0 })}
                  className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                    formData.productType === 'recipe' ? 'border-accent bg-accent/10' : 'border-gray-200'
                  }`}
                >
                  {isRTL ? 'يعتمد على مكونات' : 'Recipe Based'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, productType: 'direct' })}
                  className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                    formData.productType === 'direct' ? 'border-accent bg-accent/10' : 'border-gray-200'
                  }`}
                >
                  {isRTL ? 'مخزون مباشر' : 'Direct Stock'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
                <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'التصنيف' : 'Category'}</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none">
                  <option value="">{isRTL ? 'اختر' : 'Select'}</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{isRTL ? cat.nameAr : cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'السعر' : 'Price'}</label>
                {/* ✅ حقل نصي يحافظ على الأصفار */}
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={formData.price} 
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                  placeholder="0.000"
                  className="w-full px-4 py-3 border rounded-xl outline-none" 
                />
              </div>
            </div>

            {formData.productType === 'direct' && (
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'المخزون' : 'Stock'}</label>
                <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} className="w-full px-4 py-3 border rounded-xl outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'خاضع للضريبة' : 'Taxable'}</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isTaxable}
                  onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
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