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
    products, discounts, settings, paymentMethods,
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

  const categories = [
    { id: 'all', name: 'الكل', nameEn: 'All', icon: ShoppingCart },
    { id: 'hot', name: 'مشروبات ساخنة', nameEn: 'Hot Drinks', icon: Coffee },
    { id: 'cold', name: 'مشروبات باردة', nameEn: 'Cold Drinks', icon: IceCream },
    { id: 'dessert', name: 'حلويات', nameEn: 'Desserts', icon: Cake },
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
      <div className="flex-1 space-y-3 min-w-0 pb-52 lg:pb-0 lg:overflow-y-auto">
        <div className="space-y-2">
          {/* البحث */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث عن منتج...' : 'Search product...'}
              className={`w-full ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none bg-white`}
            />
          </div>

          {/* الفئات */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all ${
                  activeCategory === cat.id ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {isRTL ? cat.name : cat.nameEn}
              </button>
            ))}
          </div>

          {/* الخصومات */}
          {activeDiscounts.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {activeDiscounts.map(discount => (
                <button
                  key={discount.id}
                  onClick={() => setSelectedDiscount(selectedDiscount === discount.id ? '' : discount.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap flex items-center gap-1 shrink-0 transition-all border-2 ${
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

        {/* شبكة المنتجات - بطاقات كبيرة وواضحة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg overflow-hidden bg-primary/5 flex items-center justify-center mb-2">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={isRTL ? product.nameAr : product.name} className="w-full h-full object-cover" />
                ) : (
                  <Coffee className="w-8 h-8 text-primary" />
                )}
              </div>
              <p className="font-medium text-sm truncate">{isRTL ? product.nameAr : product.name}</p>
              <p className="text-accent font-bold text-base mt-1">{product.price.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
              {product.productType === 'direct' ? (
                <p className="text-xs text-gray-400 mt-0.5">{isRTL ? 'المخزون' : 'Stock'}: {product.stock}</p>
              ) : (
                <p className="text-xs text-purple-400 mt-0.5">{isRTL ? 'يعتمد على مكونات' : 'Recipe Based'}</p>
              )}
              {!product.isTaxable && (
                <p className="text-xs text-gray-400 mt-0.5">{isRTL ? 'معفي من الضريبة' : 'Tax Exempt'}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* السلة - ثابتة أسفل الجوال وبارتفاع 35% من الشاشة */}
      <div
        className={`${
          isRTL ? 'right-0' : 'left-0'
        } fixed bottom-0 z-40 w-full lg:static lg:z-auto lg:w-1/4 lg:max-w-xs lg:bg-transparent`}
      >
        <div className="bg-white rounded-t-2xl lg:rounded-2xl shadow-xl lg:shadow-sm border border-gray-100 flex flex-col max-h-[50vh] lg:max-h-full lg:h-full">
          {/* رأس السلة */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-semibold flex items-center gap-2 text-base">
              <ShoppingCart className="w-5 h-5" />
              {isRTL ? 'الطلب الحالي' : 'Current Order'}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHeldOrders(true)} className="p-1.5 hover:bg-gray-100 rounded-lg relative">
                <Clock className="w-5 h-5 text-gray-500" />
                {heldOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {heldOrders.length}
                  </span>
                )}
              </button>
              <span className="text-sm text-gray-500">{cart.length}</span>
            </div>
          </div>

          {/* محتوى السلة مع تمرير تلقائي */}
          <div ref={cartListRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{isRTL ? 'السلة فارغة' : 'Cart is empty'}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{isRTL ? item.nameAr : item.name}</p>
                      <p className="text-accent text-sm font-semibold">{item.price.toFixed(3)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="p-1.5 hover:bg-gray-200 rounded">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="p-1.5 hover:bg-gray-200 rounded">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeFromCart(item.productId)} className="p-1.5 hover:bg-red-100 rounded text-red-500">
                        <Trash2 className="w-4 h-4" />
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
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none"
                  />
                </div>
              ))
            )}

            {/* رقم السيارة */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {isRTL ? 'رقم السيارة (اختياري)' : 'Vehicle (optional)'}
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder={isRTL ? 'مثال: 1234' : 'e.g. 1234'}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none"
              />
            </div>
          </div>

          {/* ملخص وأزرار */}
          <div className="p-3 border-t border-gray-100 space-y-2 shrink-0">
            {/* القسيمة */}
            <div className="space-y-1">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-4 h-4" />
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
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none font-mono"
                  />
                  <button onClick={handleApplyCoupon} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                    {isRTL ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
            </div>

            {/* الملخص */}
            <div className="space-y-1 text-sm">
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
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span className="text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</span>
              </div>
            </div>

            {/* الأزرار */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdOrder}
                disabled={cart.length === 0}
                className="py-2.5 bg-gray-100 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                {isRTL ? 'تعليق' : 'Hold'}
              </button>
              <button
                onClick={() => setShowSendOptions(true)}
                disabled={cart.length === 0}
                className="py-2.5 bg-accent text-primary font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {isRTL ? 'إرسال للباريستا' : 'Send to Barista'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      {showSendOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'خيارات الإرسال' : 'Send Options'}</h3>
              <button onClick={() => setShowSendOptions(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-xl font-bold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            <button
              onClick={() => sendToBarista(false)}
              className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {isRTL ? 'إرسال والدفع بعدين' : 'Send & Pay Later'}
            </button>

            <button
              onClick={() => setShowPaymentMethods(true)}
              className="w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isRTL ? 'إرسال والدفع الآن' : 'Send & Pay Now'}
            </button>
          </div>
        </div>
      )}

      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'اختر طريقة الدفع' : 'Select Payment Method'}</h3>
              <button onClick={() => setShowPaymentMethods(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-xl font-bold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            {activePaymentMethods.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-3">{isRTL ? 'لا توجد طرق دفع نشطة' : 'No active payment methods'}</p>
            ) : (
              <div className={`grid gap-2 ${activePaymentMethods.length === 1 ? 'grid-cols-1' : activePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
                      className="p-3 rounded-xl border-2 border-gray-200 hover:border-accent transition-all"
                    >
                      <MethodIcon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{isRTL ? method.nameAr : method.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <button onClick={() => setShowPaymentMethods(false)} className="w-full py-2 bg-gray-100 rounded-xl text-sm">
              {isRTL ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>
      )}

      {showCashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'الدفع النقدي' : 'Cash Payment'}</h3>
              <button onClick={() => setShowCashModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{isRTL ? 'الإجمالي المطلوب' : 'Total Amount'}</p>
              <p className="text-2xl font-extrabold text-accent">{total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">{isRTL ? 'المبلغ المستلم' : 'Amount Received'}</label>
              <input
                type="text"
                inputMode="decimal"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-accent text-base"
                placeholder="0.000"
              />
            </div>

            {parseFloat(cashReceived) > 0 && (
              <div className={`p-2 rounded-xl ${parseFloat(cashReceived) >= total ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <p className="text-sm font-semibold">
                  {isRTL ? 'الباقي' : 'Change'}: {(parseFloat(cashReceived) - total).toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}
                </p>
              </div>
            )}

            <button
              onClick={handleCashConfirm}
              disabled={parseFloat(cashReceived) < total}
              className="w-full py-2.5 bg-green-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Banknote className="w-4 h-4" />
              {isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      )}

      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="text-center">
              <Coffee className="w-10 h-10 mx-auto text-accent mb-2" />
              <h3 className="text-lg font-bold">{isRTL ? 'تم إرسال الطلب!' : 'Order Sent!'}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {lastOrder.payNow 
                  ? (isRTL ? `تم الدفع ${lastOrder.paymentMethodName ? `بواسطة ${lastOrder.paymentMethodName}` : ''}` : `Paid ${lastOrder.paymentMethodName ? `via ${lastOrder.paymentMethodName}` : ''}`)
                  : (isRTL ? 'أرسل - الدفع عند الاستلام' : 'Sent - Pay on delivery')}
              </p>
            </div>

            <div className={`rounded-xl p-3 text-center ${lastOrder.payNow ? 'bg-green-50' : 'bg-orange-50'}`}>
              <p className="text-xs text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
              <p className="text-xl font-bold text-accent">{lastOrder.total.toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}</p>
              {lastOrder.cashReceived !== undefined && (
                <div className="text-xs mt-2 space-y-1">
                  <p>{isRTL ? 'المبلغ المستلم' : 'Received'}: {lastOrder.cashReceived.toFixed(3)}</p>
                  <p className={lastOrder.cashChange! >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {isRTL ? 'الباقي' : 'Change'}: {lastOrder.cashChange!.toFixed(3)}
                  </p>
                </div>
              )}
              <p className={`text-[10px] mt-1 ${lastOrder.payNow ? 'text-green-600' : 'text-orange-600'}`}>
                {lastOrder.payNow ? '✓ ' + (isRTL ? 'مدفوع' : 'Paid') : '⏳ ' + (isRTL ? 'غير مدفوع' : 'Unpaid')}
              </p>
            </div>

            <button onClick={() => setShowReceipt(false)} className="w-full py-2.5 bg-primary text-white rounded-xl text-sm">
              {isRTL ? 'متابعة' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {showHeldOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold">{isRTL ? 'الطلبات المعلقة' : 'Held Orders'}</h3>
              <button onClick={() => setShowHeldOrders(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {heldOrders.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">{isRTL ? 'لا توجد طلبات' : 'No orders'}</p>
            ) : (
              <div className="space-y-2">
                {heldOrders.map((order, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{order.length} {isRTL ? 'منتجات' : 'items'}</p>
                      <p className="text-xs text-gray-500">
                        {order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(3)} {isRTL ? settings.currencyAr : settings.currency}
                      </p>
                    </div>
                    <button onClick={() => resumeHeldOrder(index)} className="p-2 bg-accent text-primary rounded-lg">
                      <Play className="w-4 h-4" />
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