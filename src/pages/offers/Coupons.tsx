import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import DataTable from '../../components/DataTable'
import { Plus, Edit, Trash2, X, Copy } from 'lucide-react'

export default function Coupons() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useStore()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null)
  // ✅ value أصبح string للحفاظ على الأصفار
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    type: 'percentage' as 'percentage' | 'amount',
    value: '',
    maxUses: 100,
    minOrderAmount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
  })

  const generateCode = () => setFormData(prev => ({ ...prev, code: Math.random().toString(36).substring(2, 8).toUpperCase() }))
  const copyCode = (code: string) => navigator.clipboard.writeText(code)

  const handleSubmit = () => {
    const valueNumber = parseFloat(formData.value) || 0
    if (!formData.code || !formData.name || valueNumber <= 0) return

    const dataToSave = { ...formData, value: valueNumber, minOrderAmount: parseFloat(formData.minOrderAmount as any) || 0 }

    if (editingCoupon) {
      const existing = coupons.find(c => c.id === editingCoupon)
      if (existing) updateCoupon({ ...existing, ...dataToSave })
      setEditingCoupon(null)
    } else {
      addCoupon(dataToSave)
    }
    setFormData({ code: '', name: '', nameAr: '', type: 'percentage', value: '', maxUses: 100, minOrderAmount: 0, startDate: '', endDate: '', isActive: true })
    setShowAdd(false)
  }

  const isActiveNow = (coupon: any) => coupon.isActive && coupon.usedCount < coupon.maxUses && new Date(coupon.startDate) <= new Date() && new Date(coupon.endDate) >= new Date()

  const columns = [
    { key: 'code', label: 'Code', labelAr: 'الكود' },
    { key: 'name', label: 'Name', labelAr: 'الاسم' },
    { key: 'value', label: 'Value', labelAr: 'القيمة' },
    { key: 'usage', label: 'Usage', labelAr: 'الاستخدام' },
    { key: 'status', label: 'Status', labelAr: 'الحالة' },
    { key: 'actions', label: 'Actions', labelAr: 'إجراءات' },
  ]

  const renderCell = (coupon: any, column: any) => {
    switch (column.key) {
      case 'code':
        return (
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm">{coupon.code}</code>
            <button onClick={() => copyCode(coupon.code)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Copy className="w-3 h-3 text-gray-400" /></button>
          </div>
        )
      case 'name':
        return <span className="font-medium text-sm">{isRTL ? coupon.nameAr : coupon.name}</span>
      case 'value':
        return (
          <span className="font-bold text-accent">
            {coupon.type === 'percentage' 
              ? `${coupon.value}%` 
              : `${coupon.value.toFixed(3)} ${isRTL ? 'ر.ع' : 'OMR'}`}
          </span>
        )
      case 'usage':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{coupon.usedCount} / {coupon.maxUses}</span>
            <div className="w-20 h-2 bg-gray-100 rounded-full">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}></div>
            </div>
          </div>
        )
      case 'status':
        return (
          <span className={`text-xs px-3 py-1.5 rounded-full ${isActiveNow(coupon) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {isActiveNow(coupon) ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
          </span>
        )
      case 'actions':
        return (
          <div className="flex gap-1.5">
            <button onClick={() => {
              setFormData({
                code: coupon.code,
                name: coupon.name,
                nameAr: coupon.nameAr,
                type: coupon.type,
                value: coupon.value.toString(), // ✅ تحويل الرقم إلى نص
                maxUses: coupon.maxUses,
                minOrderAmount: coupon.minOrderAmount,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                isActive: coupon.isActive,
              });
              setEditingCoupon(coupon.id);
              setShowAdd(true);
            }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-500" /></button>
            <button onClick={() => deleteCoupon(coupon.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'القسائم' : 'Coupons'}</h1>
        <button onClick={() => { setShowAdd(true); setEditingCoupon(null); setFormData({ code: '', name: '', nameAr: '', type: 'percentage', value: '', maxUses: 100, minOrderAmount: 0, startDate: '', endDate: '', isActive: true }) }} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة قسيمة' : 'Add Coupon'}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        renderCell={renderCell}
        emptyMessage="No coupons found"
        emptyMessageAr="لا توجد قسائم"
      />

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingCoupon ? (isRTL ? 'تعديل' : 'Edit') : (isRTL ? 'إضافة' : 'Add')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الكود' : 'Code'}</label>
              <div className="flex gap-2">
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="flex-1 px-4 py-3 border rounded-xl outline-none font-mono" />
                <button onClick={generateCode} className="px-4 py-3 bg-gray-100 rounded-xl text-sm">{isRTL ? 'توليد' : 'Generate'}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
              <input type="text" value={formData.nameAr} onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'النوع' : 'Type'}</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'amount' })} className="w-full px-3 py-2 border rounded-xl outline-none">
                  <option value="percentage">%</option>
                  <option value="amount">{isRTL ? 'مبلغ' : 'Amount'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">{isRTL ? 'القيمة' : 'Value'}</label>
                <input 
                  type="text" 
                  inputMode="decimal" 
                  value={formData.value} 
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl outline-none" 
                  placeholder="0.000"
                />
              </div>
            </div>
            <button onClick={handleSubmit} className="w-full py-3 bg-accent text-primary font-bold rounded-xl">{isRTL ? 'حفظ' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )
}