import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Plus, X, Check, Upload, Truck, FileText, Eye, Trash2 } from 'lucide-react'

interface PurchaseItem {
  ingredientId: string
  packagingType: string
  quantityPerPackaging: number
  numberOfPackages: number
  totalPrice: string  // ✅ أصبح string للحفاظ على الأصفار
}

const packagingTypes = [
  { id: 'bag', label: (isRTL: boolean) => isRTL ? 'كيس' : 'Bag' },
  { id: 'box', label: (isRTL: boolean) => isRTL ? 'صندوق' : 'Box' },
  { id: 'carton', label: (isRTL: boolean) => isRTL ? 'كرتون' : 'Carton' },
  { id: 'bottle', label: (isRTL: boolean) => isRTL ? 'زجاجة' : 'Bottle' },
  { id: 'can', label: (isRTL: boolean) => isRTL ? 'علبة' : 'Can' },
  { id: 'piece', label: (isRTL: boolean) => isRTL ? 'قطعة' : 'Piece' },
]

export default function Purchases() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { purchases, suppliers, ingredients, addPurchase, updatePurchaseStatus, settings } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    supplierId: '',
    newSupplierName: '',
    items: [] as PurchaseItem[],
    tax: '',      // ✅ string
    discount: '', // ✅ string
    status: 'received' as 'received' | 'pending',
    notes: '',
    invoiceImage: '',
    createdAt: new Date().toISOString().split('T')[0],
  })

  const addItem = () => {
    setFormData(prev => ({ 
      ...prev, 
      items: [...prev.items, { ingredientId: '', packagingType: 'bag', quantityPerPackaging: 0, numberOfPackages: 0, totalPrice: '' }] 
    }))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const getTotalBaseQuantity = (item: PurchaseItem) => {
    return item.numberOfPackages * item.quantityPerPackaging
  }

  const getUnitCost = (item: PurchaseItem) => {
    const totalBase = getTotalBaseQuantity(item)
    if (totalBase === 0) return 0
    return parseFloat(item.totalPrice) / totalBase  // ✅ تحويل النص إلى رقم
  }

  // ✅ تحويل النصوص إلى أرقام للحسابات
  const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0)
  const discountAmount = parseFloat(formData.discount) || 0
  const taxAmount = (subtotal - discountAmount) * ((parseFloat(formData.tax) || 0) / 100)
  const total = subtotal - discountAmount + taxAmount

  const getUnitName = (unitId: string) => {
    const map: Record<string, string> = {
      'kg': isRTL ? 'كيلو' : 'kg',
      'g': isRTL ? 'جرام' : 'g',
      'l': isRTL ? 'لتر' : 'L',
      'ml': isRTL ? 'مل' : 'ml',
      'piece': isRTL ? 'قطعة' : 'piece',
    }
    return map[unitId] || unitId
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, invoiceImage: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (formData.items.length === 0) return
    if (!formData.supplierId && !formData.newSupplierName) return
    
    const supplierName = formData.supplierId === '__new__' 
      ? formData.newSupplierName 
      : suppliers.find(s => s.id === formData.supplierId)?.name || ''
    
    addPurchase({
      supplierId: formData.supplierId === '__new__' ? `new-${Date.now()}` : formData.supplierId,
      supplierName,
      items: formData.items.map(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId)
        return {
          ingredientId: item.ingredientId,
          ingredientName: ing ? (isRTL ? ing.nameAr : ing.name) : '',
          quantity: getTotalBaseQuantity(item),
          cost: getUnitCost(item),
        }
      }),
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      status: formData.status,
      notes: formData.notes,
      invoiceImage: formData.invoiceImage,
      createdAt: new Date(formData.createdAt).toISOString(),
    })
    
    setFormData({
      supplierId: '', newSupplierName: '', items: [], tax: '', discount: '', 
      status: 'received', notes: '', invoiceImage: '',
      createdAt: new Date().toISOString().split('T')[0],
    })
    setShowAdd(false)
  }

  const selectedPurchaseData = purchases.find(p => p.id === selectedPurchase)

  const columns = [
    { key: 'number', label: 'Purchase #', labelAr: 'رقم الشراء' },
    { key: 'supplier', label: 'Supplier', labelAr: 'المورد' },
    { key: 'items', label: 'Items', labelAr: 'العناصر' },
    { key: 'total', label: 'Total', labelAr: 'الإجمالي' },
    { key: 'status', label: 'Status', labelAr: 'الحالة' },
    { key: 'date', label: 'Date', labelAr: 'التاريخ' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (purchase: any, column: any) => {
    switch (column.key) {
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-sm">{purchase.number}</span>
          </div>
        )
      case 'supplier':
        return (
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{purchase.supplierName}</span>
          </div>
        )
      case 'items':
        return <span className="text-sm text-gray-600">{purchase.items.length}</span>
      case 'total':
        return <span className="font-bold text-accent">{purchase.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
      case 'status':
        return (
          <span className={`text-xs px-3 py-1.5 rounded-full ${
            purchase.status === 'received' ? 'bg-green-50 text-green-600' : 
            purchase.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 
            'bg-red-50 text-red-600'
          }`}>
            {purchase.status === 'received' ? (isRTL ? 'مستلم' : 'Received') : 
             purchase.status === 'pending' ? (isRTL ? 'معلق' : 'Pending') : 
             (isRTL ? 'ملغي' : 'Cancelled')}
          </span>
        )
      case 'date':
        return <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(purchase.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => setSelectedPurchase(purchase.id)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100">
              <Eye className="w-4 h-4" />
            </button>
            {purchase.status === 'pending' && (
              <button onClick={() => updatePurchaseStatus(purchase.id, 'received')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                <Check className="w-4 h-4" />
              </button>
            )}
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
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'المشتريات' : 'Purchases'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'إدارة المشتريات والموردين' : 'Manage purchases and suppliers'}</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'شراء جديد' : 'New Purchase'}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={purchases}
        renderCell={renderCell}
        emptyMessage="No purchases found"
        emptyMessageAr="لا توجد مشتريات"
      />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{isRTL ? 'شراء جديد' : 'New Purchase'}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{isRTL ? 'المورد' : 'Supplier'} *</label>
                <select 
                  value={formData.supplierId} 
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} 
                  className="w-full px-4 py-3 border rounded-xl outline-none"
                >
                  <option value="">{isRTL ? 'اختر المورد' : 'Select supplier'}</option>
                  <option value="__new__">{isRTL ? '+ إضافة مورد جديد...' : '+ Add New Supplier...'}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                
                {formData.supplierId === '__new__' && (
                  <input 
                    type="text" 
                    value={formData.newSupplierName} 
                    onChange={(e) => setFormData({ ...formData, newSupplierName: e.target.value })} 
                    className="w-full mt-2 px-4 py-3 border rounded-xl outline-none bg-yellow-50"
                    placeholder={isRTL ? 'اكتب اسم المورد الجديد...' : 'Type new supplier name...'}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{isRTL ? 'تاريخ الشراء' : 'Purchase Date'}</label>
                <input 
                  type="date" 
                  value={formData.createdAt} 
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })} 
                  className="w-full px-4 py-3 border rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{isRTL ? 'العناصر المشتراة' : 'Purchase Items'} *</label>
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const ing = ingredients.find(i => i.id === item.ingredientId)
                  const totalBaseQuantity = getTotalBaseQuantity(item)
                  const unitCost = getUnitCost(item)
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                      <div className="flex gap-2 items-center">
                        <select 
                          value={item.ingredientId} 
                          onChange={(e) => updateItem(index, 'ingredientId', e.target.value)} 
                          className="flex-1 px-3 py-2.5 border rounded-lg outline-none text-sm bg-white"
                        >
                          <option value="">{isRTL ? 'اختر المكون' : 'Select ingredient'}</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>
                              {isRTL ? ing.nameAr : ing.name}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => removeItem(index)} className="p-2.5 bg-red-50 text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {ing && (
                        <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2">
                          {isRTL ? 'الوحدة الأساسية:' : 'Base unit:'} <span className="font-semibold">{getUnitName(ing.unit)}</span>
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {isRTL ? 'نوع التعبئة' : 'Packaging Type'}
                          </label>
                          <select 
                            value={item.packagingType} 
                            onChange={(e) => updateItem(index, 'packagingType', e.target.value)} 
                            className="w-full px-3 py-2.5 border rounded-lg outline-none text-sm bg-white"
                          >
                            {packagingTypes.map(pt => (
                              <option key={pt.id} value={pt.id}>{pt.label(isRTL)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {isRTL ? `الكمية في كل ${packagingTypes.find(pt => pt.id === item.packagingType)?.label(isRTL) || ''}` : `Quantity per ${packagingTypes.find(pt => pt.id === item.packagingType)?.label(isRTL) || ''}`}
                          </label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" min="0" value={item.quantityPerPackaging} 
                              onChange={(e) => updateItem(index, 'quantityPerPackaging', Number(e.target.value))} 
                              className="flex-1 px-3 py-2.5 border rounded-lg outline-none text-sm bg-white" 
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {ing ? getUnitName(ing.unit) : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {isRTL ? 'عدد الوحدات' : 'Number of Packages'}
                          </label>
                          <input 
                            type="number" min="0" value={item.numberOfPackages} 
                            onChange={(e) => updateItem(index, 'numberOfPackages', Number(e.target.value))} 
                            className="w-full px-3 py-2.5 border rounded-lg outline-none text-sm bg-white" 
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {isRTL ? 'السعر الإجمالي' : 'Total Price'}
                          </label>
                          <input 
                            type="text" inputMode="decimal" value={item.totalPrice} 
                            onChange={(e) => updateItem(index, 'totalPrice', e.target.value)} 
                            className="w-full px-3 py-2.5 border rounded-lg outline-none text-sm bg-white" 
                            placeholder="0.000"
                          />
                        </div>
                      </div>

                      {(item.numberOfPackages > 0 || item.totalPrice !== '') && (
                        <div className="bg-white rounded-lg p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">{isRTL ? 'الكمية الكلية المضافة:' : 'Total quantity added:'}</span>
                            <span className="font-semibold text-blue-600">
                              {totalBaseQuantity} {ing ? getUnitName(ing.unit) : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{isRTL ? 'تكلفة الوحدة الأساسية:' : 'Unit cost:'}</span>
                            <span className="font-semibold">{unitCost.toFixed(4)} {isRTL ? settings.currencyAr : settings.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{isRTL ? 'الإجمالي:' : 'Total:'}</span>
                            <span className="font-bold text-accent">{parseFloat(item.totalPrice || '0').toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button onClick={addItem} className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-accent hover:text-accent text-sm">
                + {isRTL ? 'إضافة عنصر' : 'Add Item'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{isRTL ? 'الخصم' : 'Discount'}</label>
                <input type="text" inputMode="decimal" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" placeholder="0.000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{isRTL ? 'الضريبة %' : 'Tax %'}</label>
                <input type="text" inputMode="decimal" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" placeholder="0.000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">{isRTL ? 'صورة الفاتورة (اختياري)' : 'Invoice Image (Optional)'}</label>
              {formData.invoiceImage ? (
                <div className="relative">
                  <img src={formData.invoiceImage} alt="Invoice" className="w-full max-h-48 object-cover rounded-xl" />
                  <button onClick={() => setFormData({ ...formData, invoiceImage: '' })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-accent hover:text-accent flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">{isRTL ? 'اضغط لرفع صورة الفاتورة' : 'Click to upload invoice image'}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">{isRTL ? 'ملاحظات' : 'Notes'}</label>
              <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none resize-none" />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{subtotal.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-sm text-red-500"><span>{isRTL ? 'الخصم' : 'Discount'}</span><span>-{discountAmount.toFixed(3)}</span></div>}
              {taxAmount > 0 && <div className="flex justify-between text-sm"><span>{isRTL ? 'الضريبة' : 'Tax'}</span><span>{taxAmount.toFixed(3)}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>{isRTL ? 'الإجمالي النهائي' : 'Final Total'}</span><span className="text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span></div>
            </div>

            <button onClick={handleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">
              {isRTL ? 'حفظ الشراء' : 'Save Purchase'}
            </button>
          </div>
        </div>
      )}

      {selectedPurchaseData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedPurchaseData.number}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedPurchaseData.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium flex items-center gap-2"><Truck className="w-4 h-4 text-gray-400" />{selectedPurchaseData.supplierName}</p>
            </div>
            <div className="space-y-2">
              {selectedPurchaseData.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.ingredientName}</span>
                  <span>{(item.quantity * item.cost).toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm"><span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{selectedPurchaseData.subtotal.toFixed(3)}</span></div>
              {selectedPurchaseData.discount > 0 && <div className="flex justify-between text-sm text-red-500"><span>{isRTL ? 'الخصم' : 'Discount'}</span><span>-{selectedPurchaseData.discount.toFixed(3)}</span></div>}
              {selectedPurchaseData.tax > 0 && <div className="flex justify-between text-sm"><span>{isRTL ? 'الضريبة' : 'Tax'}</span><span>{selectedPurchaseData.tax.toFixed(3)}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>{isRTL ? 'الإجمالي' : 'Total'}</span><span className="text-accent">{selectedPurchaseData.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span></div>
            </div>
            {selectedPurchaseData.notes && <div className="bg-yellow-50 rounded-xl p-3"><p className="text-sm">{selectedPurchaseData.notes}</p></div>}
            {selectedPurchaseData.invoiceImage && <img src={selectedPurchaseData.invoiceImage} alt="Invoice" className="w-full rounded-xl" />}
            <button onClick={() => setSelectedPurchase(null)} className="w-full py-3 bg-gray-100 rounded-xl">{isRTL ? 'إغلاق' : 'Close'}</button>
          </div>
        </div>
      )}
    </div>
  )
}