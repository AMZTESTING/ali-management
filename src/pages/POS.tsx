import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Coffee, Cake, IceCream,
  X, Check, Clock, Pause, Play, Tag, Percent, Ticket, Banknote, CreditCard, Wallet,
} from 'lucide-react'

interface CartItem {
  productId: number
  name: string
  nameAr: string
  price: number
  quantity: number
  notes: string
}

const paymentIconMap: Record<string, any> = {
  banknote: Banknote,
  'credit-card': CreditCard,
  wallet: Wallet,
}

export default function POS() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { 
    products, categories, discounts, settings, paymentMethods,
    addOrder, getNextOrderNumber, getActiveDiscounts, applyCoupon 
  } = useStore()
  
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiscount, setSelectedDiscount] = useState<string>('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [showSendOptions, setShowSendOptions] = useState(false)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [heldOrders, setHeldOrders] = useState<CartItem[][]>([])
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ items: CartItem[], total: number, discountName: string, payNow: boolean, paymentMethodName?: string, cashReceived?: number, cashChange?: number } | null>(null)

  const activeDiscounts = getActiveDiscounts()
  const activePaymentMethods = paymentMethods.filter(m => m.isActive)

  // ✅ فئات ديناميكية من قاعدة البيانات
  const categoryOptions = [
    { id: 'all', name: 'الكل', nameEn: 'All', icon: ShoppingCart },
    ...categories.map(cat => {
      let Icon = ShoppingCart
      if (cat.icon === 'coffee' || cat.icon === 'hot') Icon = Coffee
      else if (cat.icon === 'icecream' || cat.icon === 'cold') Icon = IceCream
      else if (cat.icon === 'cake' || cat.icon === 'dessert') Icon = Cake
      return { id: cat.id, name: cat.nameAr, nameEn: cat.name, icon: Icon }
    })
  ]

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameAr.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const calculateDiscount = () => {
    if (!selectedDiscount) return 0
    const discount = discounts.find(d => d.id === selectedDiscount)
    if (!discount) return 0
    let discountAmount = 0
    
    if (discount.appliesTo === 'all') {
      const subtotalForAll = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      discountAmount = discount.type === 'percentage' ? (subtotalForAll * discount.value) / 100 : discount.value
    } else if (discount.appliesTo === 'category') {
      const subtotalForCategory = cart
        .filter(item => {
          const product = products.find(p => p.id === item.productId)
          return product?.category === discount.categoryId
        })
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
      discountAmount = discount.type === 'percentage' ? (subtotalForCategory * discount.value) / 100 : discount.value
    } else if (discount.appliesTo === 'product') {
      const subtotalForProduct = cart
        .filter(item => item.productId === discount.productId)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
      discountAmount = discount.type === 'percentage' ? (subtotalForProduct * discount.value) / 100 : discount.value
    }
    
    return discountAmount
  }

  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value) / 100 : appliedCoupon.value
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxableSubtotal = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    if (product && product.isTaxable) return sum + item.price * item.quantity
    return sum
  }, 0)
  const discountAmount = calculateDiscount()
  const couponDiscountAmount = calculateCouponDiscount()
  const totalDiscount = discountAmount + couponDiscountAmount
  const discountRatio = subtotal > 0 ? totalDiscount / subtotal : 0
  const taxableAfterDiscount = taxableSubtotal * (1 - discountRatio)
  const taxAmount = taxableAfterDiscount * (settings.taxRate / 100)
  const total = subtotal - totalDiscount + taxAmount

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...prev, { 
        productId: product.id, name: product.name, nameAr: product.nameAr, 
        price: product.price, quantity: 1, notes: '' 
      }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return null
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(Boolean) as CartItem[])
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const holdOrder = () => {
    if (cart.length === 0) return
    setHeldOrders(prev => [...prev, cart])
    setCart([])
    setSelectedDiscount('')
    setAppliedCoupon(null)
    setCouponCode('')
    setVehicleNumber('')
    setShowHeldOrders(false)
  }

  const resumeHeldOrder = (index: number) => {
    setCart(heldOrders[index])
    setHeldOrders(prev => prev.filter((_, i) => i !== index))
    setShowHeldOrders(false)
  }

  const handleApplyCoupon = async () => {
    const coupon = await applyCoupon(couponCode)
    if (coupon) {
      setAppliedCoupon({ code: coupon.code, type: coupon.type, value: coupon.value })
      setCouponError('')
      setCouponCode('')
    } else {
      setCouponError(isRTL ? 'قسيمة غير صالحة' : 'Invalid coupon')
    }
  }

  const getSelectedDiscountName = () => {
    if (!selectedDiscount) return ''
    const discount = discounts.find(d => d.id === selectedDiscount)
    return discount ? (isRTL ? discount.nameAr : discount.name) : ''
  }

  const sendToBarista = (payNow: boolean, paymentMethodId?: string, cashReceivedAmount?: number, cashChangeAmount?: number) => {
    if (cart.length === 0) return

    const method = paymentMethods.find(m => m.id === paymentMethodId)

    const newOrder = {
      id: Date.now().toString(),
      number: getNextOrderNumber(),
      customerName: vehicleNumber || 'Walk-in Customer',
      vehicleNumber: vehicleNumber || undefined,
      customerType: 'walk-in' as const,
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        nameAr: item.nameAr,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
      subtotal,
      discount: totalDiscount,
      discountType: appliedCoupon ? 'coupon' as const : selectedDiscount ? 'percentage' as const : undefined,
      discountName: getSelectedDiscountName() || appliedCoupon?.code || '',
      couponCode: appliedCoupon?.code,
      tax: taxAmount,
      total,
      status: 'pending' as const,
      paymentStatus: payNow ? 'paid' as const : 'unpaid' as const,
      paymentMethod: payNow ? (paymentMethodId || 'cash') as 'cash' | 'card' | 'wallet' : undefined as any,
      cashChange: cashChangeAmount || 0,
      createdAt: new Date().toISOString(),
      cashier: 'Ali',
    }

    addOrder(newOrder)
    setLastOrder({ 
      items: cart, total, discountName: getSelectedDiscountName() || appliedCoupon?.code || '', 
      payNow, paymentMethodName: method ? (isRTL ? method.nameAr : method.name) : undefined,
      cashReceived: cashReceivedAmount, cashChange: cashChangeAmount
    })
    setShowSendOptions(false)
    setShowPaymentMethods(false)
    setShowCashModal(false)
    setShowReceipt(true)
    setCart([])
    setSelectedDiscount('')
    setAppliedCoupon(null)
    setCouponCode('')
    setVehicleNumber('')
    setCashReceived('')
  }

  const handleCashSelected = () => {
    setShowPaymentMethods(false)
    setShowCashModal(true)
  }

  const handleCashConfirm = () => {
    const cashAmount = parseFloat(cashReceived) || 0
    const change = cashAmount - total
    sendToBarista(true, 'cash', cashAmount, change)
  }

  // ✅ تمرير تلقائي لآخر عنصر عند إضافة جديد
  const cartListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTo({
        top: cartListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [cart.length])

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full lg:h-screen">
      {/* المنتجات */}
      <div className="flex-1 space-y-3 min-w-0 pb-56 lg:pb-0 lg:overflow-y-auto">
        <div className="space-y-2">
          {/* البحث */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث عن منتج...' : 'Search product...'}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none bg-white`}
            />
          </div>

          {/* الفئات الديناميكية */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryOptions.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-2 shrink-0 transition-all ${
                  activeCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {isRTL ? cat.name : cat.nameEn}
              </button>
            ))}
          </div>

          {/* الخصومات */}
          {activeDiscounts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeDiscounts.map(discount => (
                <button
                  key={discount.id}
                  onClick={() => setSelectedDiscount(selectedDiscount === discount.id ? '' : discount.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all border-2 ${
                    selectedDiscount === discount.id 
                      ? 'border-accent bg-accent/10 text-accent' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-accent/50'
                  }`}
                >
                  {discount.type === 'percentage' ? <Percent className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                  {isRTL ? discount.nameAr : discount.name}
                  <span className="font-bold">
                    {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* شبكة المنتجات */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-center border border-gray-100 active:scale-95"
            >
              <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden bg-primary/5 flex items-center justify-center mb-3">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={isRTL ? product.nameAr : product.name} className="w-full h-full object-cover" />
                ) : (
                  <Coffee className="w-10 h-10 text-primary" />
                )}
              </div>
              <p className="font-bold text-base truncate">{isRTL ? product.nameAr : product.name}</p>
              <p className="text-accent font-extrabold text-lg mt-1">{product.price.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
              {product.productType === 'direct' ? (
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'المخزون' : 'Stock'}: {product.stock}</p>
              ) : (
                <p className="text-xs text-purple-400 mt-1">{isRTL ? 'يعتمد على مكونات' : 'Recipe Based'}</p>
              )}
              {!product.isTaxable && (
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'معفي من الضريبة' : 'Tax Exempt'}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* السلة - ثابتة أسفل الجوال، وعلى اللابتوب جانبية */}
      <div
        className={`${
          isRTL ? 'right-0' : 'left-0'
        } fixed bottom-0 z-40 w-full lg:static lg:z-auto lg:w-1/4 lg:max-w-xs lg:bg-transparent`}
      >
        <div className="bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl lg:shadow-sm border border-gray-100 flex flex-col max-h-[45vh] lg:max-h-[calc(100vh-100px)] lg:h-full">
          {/* رأس السلة */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-bold flex items-center gap-2 text-base lg:text-lg">
              <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
              {isRTL ? 'الطلب الحالي' : 'Current Order'}
            </h2>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <button onClick={() => setShowHeldOrders(true)} className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg relative">
                <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500" />
                {heldOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                )}
              </button>
              <span className="text-sm text-gray-500">{cart.length}</span>
            </div>
          </div>

          {/* محتوى السلة - يتمدد ويتمرر */}
          <div ref={cartListRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 lg:p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8 lg:py-12">
                <ShoppingCart className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm lg:text-base">{isRTL ? 'السلة فارغة' : 'Cart is empty'}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-2.5 space-y-1.5 lg:p-3">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm lg:text-base truncate">{isRTL ? item.nameAr : item.name}</p>
                      <p className="text-accent text-sm lg:text-base font-bold">{item.price.toFixed(3)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1.5 lg:p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100">
                        <Minus className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <span className="font-bold w-6 lg:w-8 text-center text-base lg:text-lg">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1.5 lg:p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100">
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button onClick={() => removeFromCart(item.productId)} className="p-1.5 lg:p-2 bg-white rounded-lg text-red-500 shadow-sm hover:bg-red-50">
                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => {
                      const value = e.target.value
                      setCart(prev => prev.map(i => 
                        i.productId === item.productId ? { ...i, notes: value } : i
                      ))
                    }}
                    placeholder={isRTL ? 'ملاحظة...' : 'Note...'}
                    className="w-full text-xs lg:text-sm px-2 py-1.5 border border-gray-200 rounded outline-none"
                  />
                </div>
              ))
            )}

            {/* رقم السيارة */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-500 mb-1">
                {isRTL ? 'رقم السيارة (اختياري)' : 'Vehicle (optional)'}
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder={isRTL ? 'مثال: 1234' : 'e.g. 1234'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm lg:text-base outline-none"
              />
            </div>
          </div>

          {/* ملخص وأزرار - دائماً ظاهرين */}
          <div className="p-3 border-t border-gray-100 space-y-2 shrink-0 lg:p-4">
            {/* القسيمة */}
            <div className="space-y-1">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-4 h-4 lg:w-5 lg:h-5" />
                    {appliedCoupon.code}
                  </span>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }} className="text-xs font-bold">✕</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={isRTL ? 'كود القسيمة' : 'Coupon code'}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none font-mono"
                  />
                  <button onClick={handleApplyCoupon} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 font-bold">
                    {isRTL ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
            </div>

            {/* الملخص */}
            <div className="space-y-1 text-sm lg:text-base">
              <div className="flex justify-between text-gray-600">
                <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span>{subtotal.toFixed(3)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                  <span>-{discountAmount.toFixed(3)}</span>
                </div>
              )}
              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{isRTL ? 'القسيمة' : 'Coupon'}</span>
                  <span>-{couponDiscountAmount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>{isRTL ? `الضريبة (${settings.taxRate}%)` : `Tax (${settings.taxRate}%)`}</span>
                <span>{taxAmount.toFixed(3)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-lg lg:text-xl pt-2 border-t">
                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span className="text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
              </div>
            </div>

            {/* الأزرار - أصغر ومنع الالتفاف */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdOrder}
                disabled={cart.length === 0}
                className="py-2 bg-gray-100 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Pause className="w-3.5 h-3.5" />
                {isRTL ? 'تعليق' : 'Hold'}
              </button>
              <button
                onClick={() => setShowSendOptions(true)}
                disabled={cart.length === 0}
                className="py-2 bg-accent text-primary font-bold rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                {isRTL ? 'إرسال للباريستا' : 'Send to Barista'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      {showSendOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{isRTL ? 'خيارات الإرسال' : 'Send Options'}</h3>
              <button onClick={() => setShowSendOptions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-3xl font-extrabold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            <button
              onClick={() => sendToBarista(false)}
              className="w-full py-4 bg-orange-500 text-white rounded-xl text-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-3"
            >
              <Clock className="w-6 h-6" />
              {isRTL ? 'إرسال والدفع بعدين' : 'Send & Pay Later'}
            </button>

            <button
              onClick={() => setShowPaymentMethods(true)}
              className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-3"
            >
              <Check className="w-6 h-6" />
              {isRTL ? 'إرسال والدفع الآن' : 'Send & Pay Now'}
            </button>
          </div>
        </div>
      )}

      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{isRTL ? 'اختر طريقة الدفع' : 'Select Payment Method'}</h3>
              <button onClick={() => setShowPaymentMethods(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-3xl font-extrabold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            {activePaymentMethods.length === 0 ? (
              <p className="text-center text-gray-400 text-base py-4">{isRTL ? 'لا توجد طرق دفع نشطة' : 'No active payment methods'}</p>
            ) : (
              <div className={`grid gap-3 ${activePaymentMethods.length === 1 ? 'grid-cols-1' : activePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {activePaymentMethods.map(method => {
                  const MethodIcon = paymentIconMap[method.icon] || Banknote
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        if (method.id === 'cash') {
                          handleCashSelected()
                        } else {
                          sendToBarista(true, method.id)
                        }
                      }}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-accent transition-all"
                    >
                      <MethodIcon className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-sm font-medium">{isRTL ? method.nameAr : method.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <button onClick={() => setShowPaymentMethods(false)} className="w-full py-3 bg-gray-100 rounded-xl text-base font-medium">
              {isRTL ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>
      )}

      {showCashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{isRTL ? 'الدفع النقدي' : 'Cash Payment'}</h3>
              <button onClick={() => setShowCashModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
              <p className="text-3xl font-extrabold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{isRTL ? 'المبلغ المستلم' : 'Amount Received'}</label>
              <input
                type="text"
                inputMode="decimal"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-accent text-xl"
                placeholder="0.000"
              />
            </div>

            {parseFloat(cashReceived) > 0 && (
              <div className={`p-3 rounded-xl ${parseFloat(cashReceived) >= total ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <p className="text-base font-semibold">
                  {isRTL ? 'الباقي' : 'Change'}: {(parseFloat(cashReceived) - total).toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}
                </p>
              </div>
            )}

            <button
              onClick={handleCashConfirm}
              disabled={parseFloat(cashReceived) < total}
              className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Banknote className="w-6 h-6" />
              {isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}

      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="text-center">
              <Coffee className="w-14 h-14 mx-auto text-accent mb-3" />
              <h3 className="text-2xl font-bold">{isRTL ? 'تم إرسال الطلب!' : 'Order Sent!'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {lastOrder.payNow 
                  ? (isRTL ? `تم الدفع ${lastOrder.paymentMethodName ? `بواسطة ${lastOrder.paymentMethodName}` : ''}` : `Paid ${lastOrder.paymentMethodName ? `via ${lastOrder.paymentMethodName}` : ''}`)
                  : (isRTL ? 'أرسل - الدفع عند الاستلام' : 'Sent - Pay on delivery')}
              </p>
            </div>

            <div className={`rounded-xl p-4 text-center ${lastOrder.payNow ? 'bg-green-50' : 'bg-orange-50'}`}>
              <p className="text-sm text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-2xl font-bold text-accent">{lastOrder.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
              {lastOrder.cashReceived !== undefined && (
                <div className="text-sm mt-2 space-y-1">
                  <p>{isRTL ? 'المبلغ المستلم' : 'Received'}: {lastOrder.cashReceived.toFixed(3)}</p>
                  <p className={lastOrder.cashChange! >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {isRTL ? 'الباقي' : 'Change'}: {lastOrder.cashChange!.toFixed(3)}
                  </p>
                </div>
              )}
              <p className={`text-xs mt-1 ${lastOrder.payNow ? 'text-green-600' : 'text-orange-600'}`}>
                {lastOrder.payNow ? '✓ ' + (isRTL ? 'مدفوع' : 'Paid') : '⏳ ' + (isRTL ? 'غير مدفوع' : 'Unpaid')}
              </p>
            </div>

            <button onClick={() => setShowReceipt(false)} className="w-full py-3 bg-primary text-white rounded-xl text-lg font-medium">
              {isRTL ? 'متابعة' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {showHeldOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{isRTL ? 'الطلبات المعلقة' : 'Held Orders'}</h3>
              <button onClick={() => setShowHeldOrders(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <p className="text-center text-gray-400 text-base py-8">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
            ) : (
              <div className="space-y-3">
                {heldOrders.map((order, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{order.length} {isRTL ? 'منتجات' : 'items'}</p>
                      <p className="text-sm text-gray-500">
                        {order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}
                      </p>
                    </div>
                    <button onClick={() => resumeHeldOrder(index)} className="p-3 bg-accent text-primary rounded-xl">
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}