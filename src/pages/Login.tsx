import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { Coffee, LogIn, AlertCircle } from 'lucide-react'

export default function Login() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { login, settings, settingsLoading } = useStore() // ✅ أضفنا settingsLoading
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // ✅ إذا كانت الإعدادات لا تزال تُحمّل، اعرض شاشة تحميل قصيرة
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-black flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) {
      navigate('/')
    } else {
      setError(isRTL ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt={isRTL ? settings.shopNameAr : settings.shopName || 'Logo'}
              className="w-24 h-24 rounded-2xl object-cover mb-4 mx-auto"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <Coffee className="w-8 h-8 text-accent" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-primary">
            {isRTL ? settings.shopNameAr || 'Ali Management' : settings.shopName || 'Ali Management'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{isRTL ? 'تسجيل الدخول' : 'Sign in'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'كلمة المرور' : 'Password'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {isRTL ? 'دخول' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}