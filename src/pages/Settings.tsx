import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { 
  Save, 
  Store, 
  Upload, 
  X,
  Check,
  Printer,
  Globe,
  Phone,
  Mail,
  MapPin,
  Coffee,
  FileText,
} from 'lucide-react'

export default function Settings() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { settings, updateSettings } = useStore()
  
  const [formData, setFormData] = useState(settings)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    updateSettings(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        handleChange('logo', event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{isRTL ? 'الإعدادات' : 'Settings'}</h1>
          <p className="text-sm text-gray-500 mt-1">{isRTL ? 'إعدادات المتجر والنظام' : 'Store and system settings'}</p>
        </div>
        <button 
          onClick={handleSave} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-accent text-primary hover:bg-accent/90'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? (isRTL ? 'تم الحفظ!' : 'Saved!') : (isRTL ? 'حفظ الإعدادات' : 'Save Settings')}
        </button>
      </div>

      {/* ============ معلومات المتجر ============ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
          <Store className="w-5 h-5 text-accent" />
          {isRTL ? 'معلومات المتجر' : 'Store Information'}
        </h2>

        {/* اللوقو */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/5 flex items-center justify-center border-2 border-dashed border-gray-300">
                <Coffee className="w-10 h-10 text-gray-400" />
              </div>
            )}
            {formData.logo && (
              <button 
                onClick={() => handleChange('logo', '')} 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isRTL ? 'رفع اللوقو' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-400 mt-2">{isRTL ? 'PNG, JPG حتى 2MB' : 'PNG, JPG up to 2MB'}</p>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              className="hidden" 
            />
          </div>
        </div>

        {/* اسم المتجر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'اسم المتجر (عربي)' : 'Store Name (Arabic)'}</label>
            <input 
              type="text" 
              value={formData.shopNameAr} 
              onChange={(e) => handleChange('shopNameAr', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'اسم المتجر (إنجليزي)' : 'Store Name (English)'}</label>
            <input 
              type="text" 
              value={formData.shopName} 
              onChange={(e) => handleChange('shopName', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Phone className="w-4 h-4 text-gray-400" />
              {isRTL ? 'الهاتف' : 'Phone'}
            </label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => handleChange('phone', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-gray-400" />
              {isRTL ? 'البريد' : 'Email'}
            </label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => handleChange('email', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            {isRTL ? 'العنوان' : 'Address'}
          </label>
          <input 
            type="text" 
            value={formData.address} 
            onChange={(e) => handleChange('address', e.target.value)} 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>

        {/* السجل التجاري */}
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4 text-gray-400" />
            {isRTL ? 'السجل التجاري' : 'Commercial Register'}
          </label>
          <input 
            type="text" 
            value={formData.commercialRegister} 
            onChange={(e) => handleChange('commercialRegister', e.target.value)} 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            dir="ltr"
          />
        </div>
      </div>

      {/* ============ الإعدادات المالية ============ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="font-semibold text-lg text-gray-800">{isRTL ? 'الإعدادات المالية' : 'Financial Settings'}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'نسبة الضريبة %' : 'Tax Rate %'}</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={formData.taxRate} 
              onChange={(e) => handleChange('taxRate', Number(e.target.value))} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'العملة (عربي)' : 'Currency (Arabic)'}</label>
            <input 
              type="text" 
              value={formData.currencyAr} 
              onChange={(e) => handleChange('currencyAr', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'العملة (إنجليزي)' : 'Currency (English)'}</label>
            <input 
              type="text" 
              value={formData.currency} 
              onChange={(e) => handleChange('currency', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ============ الإيصال ============ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
          <Printer className="w-5 h-5 text-accent" />
          {isRTL ? 'إعدادات الإيصال' : 'Receipt Settings'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'نص أسفل الفاتورة (عربي)' : 'Receipt Footer (Arabic)'}</label>
            <textarea 
              rows={3} 
              value={formData.receiptFooterAr} 
              onChange={(e) => handleChange('receiptFooterAr', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'نص أسفل الفاتورة (إنجليزي)' : 'Receipt Footer (English)'}</label>
            <textarea 
              rows={3} 
              value={formData.receiptFooter} 
              onChange={(e) => handleChange('receiptFooter', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* ============ اللغة والتنسيق ============ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
          <Globe className="w-5 h-5 text-accent" />
          {isRTL ? 'اللغة والتنسيق' : 'Language & Format'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'اللغة الافتراضية' : 'Default Language'}</label>
            <select 
              value={formData.language} 
              onChange={(e) => handleChange('language', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              <option value="ar">{isRTL ? 'العربية' : 'Arabic'}</option>
              <option value="en">{isRTL ? 'الإنجليزية' : 'English'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isRTL ? 'صيغة التاريخ' : 'Date Format'}</label>
            <select 
              value={formData.dateFormat} 
              onChange={(e) => handleChange('dateFormat', e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}