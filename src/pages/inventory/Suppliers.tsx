import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../context/StoreContext'
import { Plus, Edit, Trash2, X, Truck, Phone, Mail } from 'lucide-react'

export default function Suppliers() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })

  const handleSubmit = () => {
    if (!formData.name) return
    if (editingSupplier) {
      const existing = suppliers.find(s => s.id === editingSupplier)
      if (existing) {
        updateSupplier({ ...existing, ...formData })
      }
      setEditingSupplier(null)
    } else {
      addSupplier(formData)
    }
    setFormData({ name: '', phone: '', email: '' })
    setShowAdd(false)
  }

  const handleEdit = (id: string) => {
    const supplier = suppliers.find(s => s.id === id)
    if (supplier) {
      setFormData({ name: supplier.name, phone: supplier.phone, email: supplier.email })
      setEditingSupplier(id)
      setShowAdd(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الموردين' : 'Suppliers'}</h1>
        <button onClick={() => { setShowAdd(true); setEditingSupplier(null); setFormData({ name: '', phone: '', email: '' }) }} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl">
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة مورد' : 'Add Supplier'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/5 rounded-xl">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(supplier.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => deleteSupplier(supplier.id)} className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <p className="font-semibold text-lg">{supplier.name}</p>
            <div className="space-y-2 mt-3 text-sm text-gray-500">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {supplier.phone}</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {supplier.email}</p>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingSupplier ? (isRTL ? 'تعديل' : 'Edit') : (isRTL ? 'إضافة' : 'Add')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'اسم المورد' : 'Supplier Name'}</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'الهاتف' : 'Phone'}</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1">{isRTL ? 'البريد' : 'Email'}</label>
              <input type="text" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none" />
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