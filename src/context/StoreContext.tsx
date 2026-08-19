import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

// ============ الأنواع ============
export type ProductType = 'recipe' | 'direct'

export interface Product {
  id: number
  name: string
  nameAr: string
  price: number
  category: string
  stock: number
  productType: ProductType
  imageUrl: string
  isTaxable: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  nameAr: string
  icon: string
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  name: string
  nameAr: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  phone: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  id: string
  name: string
  nameAr: string
  unit: string
  quantity: number
  minimumStock: number
  cost: number
  supplierId: string
  createdAt: string
  updatedAt: string
}

export interface ProductRecipe {
  productId: number
  ingredients: { ingredientId: string; quantity: number }[]
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'waste' | 'return'

export interface StockMovement {
  id: string
  type: MovementType
  ingredientId: string
  ingredientName: string
  quantity: number
  reason: string
  createdAt: string
  reference?: string
}

export interface Purchase {
  id: string
  number: string
  supplierId: string
  supplierName: string
  items: { ingredientId: string; ingredientName: string; quantity: number; cost: number }[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: 'pending' | 'received' | 'cancelled'
  notes: string
  invoiceImage: string
  createdAt: string
}

export interface Discount {
  id: string
  name: string
  nameAr: string
  type: 'percentage' | 'amount'
  value: number
  appliesTo: 'all' | 'category' | 'product'
  categoryId?: string
  productId?: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Coupon {
  id: string
  code: string
  name: string
  nameAr: string
  type: 'percentage' | 'amount'
  value: number
  maxUses: number
  usedCount: number
  minOrderAmount: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: number
  name: string
  nameAr: string
  quantity: number
  price: number
  notes?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'held'
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'wallet'

export interface Order {
  id: string
  number: string
  customerName: string
  vehicleNumber?: string
  customerType: 'walk-in' | 'registered'
  items: OrderItem[]
  subtotal: number
  discount: number
  discountType?: string
  discountName?: string
  couponCode?: string
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  cashChange?: number
  createdAt: string
  completedAt?: string
  cashier: string
}

export interface Invoice {
  id: string
  number: string
  orderId: string
  orderNumber: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  createdAt: string
  cashier: string
}

export interface PaymentMethodConfig {
  id: string
  name: string
  nameAr: string
  icon: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreSettings {
  shopName: string
  shopNameAr: string
  logo: string
  taxRate: number
  currency: string
  currencyAr: string
  address: string
  phone: string
  email: string
  commercialRegister: string
  receiptFooter: string
  receiptFooterAr: string
  language: 'ar' | 'en'
  timezone: string
  dateFormat: string
  lowStockAlert: boolean
  printReceipt: boolean
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  roleId: string
  isActive: boolean
  createdAt: string
}

export interface Role {
  id: string
  name: string
  nameAr: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export const PERMISSION_KEYS = [
  'dashboard','pos','barista','cashier','orders','invoices','payment-methods',
  'products','categories','ingredients','units','suppliers','purchases',
  'stock-movement','inventory-analytics','discounts','coupons','reports','users','settings',
] as const
export type PermissionKey = typeof PERMISSION_KEYS[number]

interface StoreContextType {
  products: Product[]
  categories: Category[]
  units: Unit[]
  suppliers: Supplier[]
  ingredients: Ingredient[]
  recipes: ProductRecipe[]
  stockMovements: StockMovement[]
  purchases: Purchase[]
  orders: Order[]
  invoices: Invoice[]
  paymentMethods: PaymentMethodConfig[]
  discounts: Discount[]
  coupons: Coupon[]
  settings: StoreSettings
  users: User[]
  roles: Role[]
  currentUser: User | null
  isLoading: boolean
  settingsLoading: boolean
  authLoading: boolean
  rolesLoading: boolean
  refreshData: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  updateUser: (user: User) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRole: (role: Role) => Promise<void>
  deleteRole: (roleId: string) => Promise<void>
  hasPermission: (permission: PermissionKey) => boolean
  addOrder: (order: Order) => Promise<void>
  updateOrderStatus: (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => Promise<void>
  updateOrderPayment: (orderId: string, paymentMethod: PaymentMethod) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProduct: (product: Product) => Promise<void>
  deleteProduct: (productId: number) => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCategory: (category: Category) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateUnit: (unit: Unit) => Promise<void>
  deleteUnit: (unitId: string) => Promise<void>
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSupplier: (supplier: Supplier) => Promise<void>
  deleteSupplier: (supplierId: string) => Promise<void>
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateIngredient: (ingredient: Ingredient) => Promise<void>
  deleteIngredient: (ingredientId: string) => Promise<void>
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>
  addRecipe: (recipe: ProductRecipe) => Promise<void>
  updateRecipe: (recipe: ProductRecipe) => Promise<void>
  deleteRecipe: (productId: number) => Promise<void>
  addPurchase: (purchase: Omit<Purchase, 'id' | 'number'>) => Promise<void>
  updatePurchaseStatus: (purchaseId: string, status: Purchase['status']) => Promise<void>
  addDiscount: (discount: Omit<Discount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateDiscount: (discount: Discount) => Promise<void>
  deleteDiscount: (discountId: string) => Promise<void>
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCoupon: (coupon: Coupon) => Promise<void>
  deleteCoupon: (couponId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<Coupon | null>
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePaymentMethod: (method: PaymentMethodConfig) => Promise<void>
  deletePaymentMethod: (methodId: string) => Promise<void>
  updateSettings: (settings: StoreSettings) => Promise<void>
  getNextOrderNumber: () => string
  getNextInvoiceNumber: () => string
  getNextPurchaseNumber: () => string
  getProductCountByCategory: (categoryId: string) => number
  getActiveDiscounts: () => Discount[]
  resetAllData: () => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<ProductRecipe[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [settings, setSettings] = useState<StoreSettings>({} as StoreSettings)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(true)

  const prevOrdersLength = useRef(0)
  const isAddingUserRef = useRef(false)

  // ============ استرجاع الجلسة عند التحميل ============
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.name || session.user.email || '',
            email: session.user.email || '',
            password: '',
            roleId: profile.role_id,
            isActive: profile.is_active ?? true,
            createdAt: profile.created_at,
          })
        }
      }
      setAuthLoading(false)
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isAddingUserRef.current) return

      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile) {
            setCurrentUser({
              id: profile.id,
              name: profile.name || session.user.email || '',
              email: session.user.email || '',
              password: '',
              roleId: profile.role_id,
              isActive: profile.is_active ?? true,
              createdAt: profile.created_at,
            })
          }
        })
      } else {
        setCurrentUser(null)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // ============ تحميل الإعدادات سريعًا ============
  useEffect(() => {
    const loadSettings = async () => {
      const { data: seRes } = await supabase.from('settings').select('*').single()
      if (seRes) {
        setSettings({
          shopName: seRes.shop_name,
          shopNameAr: seRes.shop_name_ar,
          logo: seRes.logo,
          taxRate: Number(seRes.tax_rate),
          currency: seRes.currency,
          currencyAr: seRes.currency_ar,
          address: seRes.address,
          phone: seRes.phone,
          email: seRes.email,
          commercialRegister: seRes.commercial_register,
          receiptFooter: seRes.receipt_footer,
          receiptFooterAr: seRes.receipt_footer_ar,
          language: seRes.language,
          timezone: seRes.timezone,
          dateFormat: seRes.date_format,
          lowStockAlert: seRes.low_stock_alert,
          printReceipt: seRes.print_receipt,
        })
      }
      setSettingsLoading(false)
    }
    loadSettings()
  }, [])

  // ============ دالة تحويل بيانات الطلب ============
  const mapOrder = (x: any): Order => ({
    id: x.id,
    number: x.number,
    customerName: x.customer_name,
    vehicleNumber: x.vehicle_number,
    customerType: x.customer_type,
    items: x.items,
    subtotal: Number(x.subtotal),
    discount: Number(x.discount),
    tax: Number(x.tax),
    total: Number(x.total),
    status: x.status,
    paymentStatus: x.payment_status,
    paymentMethod: x.payment_method,
    cashChange: Number(x.cash_change || 0),
    createdAt: x.created_at,
    completedAt: x.completed_at,
    cashier: x.cashier,
  })

  // ============ دالة تحميل جميع البيانات ============
  const loadAll = async () => {
    setIsLoading(true)
    try {
      const [
        pRes, cRes, uRes, sRes, iRes, rRes, smRes, puRes,
        oRes, invRes, pmRes, dRes, coRes, usRes, roRes,
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('units').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('ingredients').select('*'),
        supabase.from('recipes').select('*'),
        supabase.from('stock_movements').select('*'),
        supabase.from('purchases').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('payment_methods').select('*'),
        supabase.from('discounts').select('*'),
        supabase.from('coupons').select('*'),
        supabase.from('users').select('*'),
        supabase.from('roles').select('*'),
      ])

      if (pRes.data) setProducts(pRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, price: Number(x.price), category: x.category, stock: x.stock, productType: x.product_type, imageUrl: x.image_url, isTaxable: x.is_taxable, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (cRes.data) setCategories(cRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, icon: x.icon, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (uRes.data) setUnits(uRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (sRes.data) setSuppliers(sRes.data.map((x: any) => ({ id: x.id, name: x.name, phone: x.phone, email: x.email, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (iRes.data) setIngredients(iRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, unit: x.unit, quantity: Number(x.quantity), minimumStock: Number(x.minimum_stock), cost: Number(x.cost), supplierId: x.supplier_id, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (rRes.data) setRecipes(rRes.data.map((x: any) => ({ productId: x.product_id, ingredients: x.ingredients })))
      if (smRes.data) setStockMovements(smRes.data.map((x: any) => ({ id: x.id, type: x.type, ingredientId: x.ingredient_id, ingredientName: x.ingredient_name, quantity: Number(x.quantity), reason: x.reason, createdAt: x.created_at, reference: x.reference })))
      if (puRes.data) setPurchases(puRes.data.map((x: any) => ({ id: x.id, number: x.number, supplierId: x.supplier_id, supplierName: x.supplier_name, items: x.items, subtotal: Number(x.subtotal), tax: Number(x.tax), discount: Number(x.discount), total: Number(x.total), status: x.status, notes: x.notes, invoiceImage: x.invoice_image, createdAt: x.created_at })))
      if (oRes.data) setOrders(oRes.data.map(mapOrder))
      if (invRes.data) setInvoices(invRes.data.map((x: any) => ({ id: x.id, number: x.number, orderId: x.order_id, orderNumber: x.order_number, customerName: x.customer_name, items: x.items, subtotal: Number(x.subtotal), discount: Number(x.discount), tax: Number(x.tax), total: Number(x.total), paymentMethod: x.payment_method, paymentStatus: x.payment_status, createdAt: x.created_at, cashier: x.cashier })))
      if (pmRes.data) setPaymentMethods(pmRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, icon: x.icon, isActive: x.is_active, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (dRes.data) setDiscounts(dRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, type: x.type, value: Number(x.value), appliesTo: x.applies_to, categoryId: x.category_id, productId: x.product_id, startDate: x.start_date, endDate: x.end_date, isActive: x.is_active, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (coRes.data) setCoupons(coRes.data.map((x: any) => ({ id: x.id, code: x.code, name: x.name, nameAr: x.name_ar, type: x.type, value: Number(x.value), maxUses: x.max_uses, usedCount: x.used_count, minOrderAmount: Number(x.min_order_amount), startDate: x.start_date, endDate: x.end_date, isActive: x.is_active, createdAt: x.created_at, updatedAt: x.updated_at })))
      if (usRes.data) setUsers(usRes.data.map((x: any) => ({ id: x.id, name: x.name, email: x.email, password: x.password, roleId: x.role_id, isActive: x.is_active, createdAt: x.created_at })))
      if (roRes.data) setRoles(roRes.data.map((x: any) => ({ id: x.id, name: x.name, nameAr: x.name_ar, permissions: x.permissions || [], createdAt: x.created_at, updatedAt: x.updated_at })))
        setRolesLoading(false)
    } catch (error) {
      console.error('فشل تحميل البيانات:', error)
    } finally {
      setIsLoading(false)
      setRolesLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // ============ 🔥 Polling: تحديث الطلبات والفواتير كل 3 ثوانٍ ============
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [ordersRes, invoicesRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        ])

        if (!ordersRes.error && ordersRes.data) {
          setOrders(ordersRes.data.map(mapOrder))
        }

        if (!invoicesRes.error && invoicesRes.data) {
          setInvoices(invoicesRes.data.map((x: any) => ({
            id: x.id,
            number: x.number,
            orderId: x.order_id,
            orderNumber: x.order_number,
            customerName: x.customer_name,
            items: x.items,
            subtotal: Number(x.subtotal),
            discount: Number(x.discount),
            tax: Number(x.tax),
            total: Number(x.total),
            paymentMethod: x.payment_method,
            paymentStatus: x.payment_status,
            createdAt: x.created_at,
            cashier: x.cashier,
          })))
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // كل 3 ثوانٍ

    return () => clearInterval(interval)
  }, [])

  const refreshData = async () => {
    await loadAll()
  }

  // ============ الأصوات ============
  useEffect(() => {
    if (prevOrdersLength.current === 0) {
      prevOrdersLength.current = orders.length
      return
    }

    if (orders.length > prevOrdersLength.current) {
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    }
    prevOrdersLength.current = orders.length
  }, [orders.length])

  // ============ المصادقة ============
  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return false

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (profile) {
      setCurrentUser({
        id: profile.id,
        name: profile.name || data.user.email || '',
        email: data.user.email || '',
        password: '',
        roleId: profile.role_id,
        isActive: profile.is_active ?? true,
        createdAt: profile.created_at,
      })
      return true
    }
    return false
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const hasPermission = (permission: PermissionKey) => {
    if (!currentUser) return false
    const role = roles.find(r => r.id === currentUser.roleId)
    return role?.permissions.includes(permission) || false
  }

  // ============ المستخدمون والأدوار ============
  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentSession = sessionData.session
    if (!currentSession) {
      console.error('لا توجد جلسة حالية')
      return
    }

    isAddingUserRef.current = true

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      })
      if (authError || !authData.user) {
        console.error('فشل إنشاء حساب Auth:', authError)
        return
      }

      const userId = authData.user.id

      const { error: restoreError } = await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      })
      if (restoreError) {
        console.error('فشل استعادة جلسة الأدمن:', restoreError)
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        name: user.name,
        role_id: user.roleId,
        is_active: user.isActive,
      })
      if (profileError) {
        console.error('فشل إدراج في profiles:', profileError)
        return
      }

      const { error: usersError } = await supabase.from('users').insert({
        id: userId,
        name: user.name,
        email: user.email,
        password: user.password,
        role_id: user.roleId,
        is_active: user.isActive,
        created_at: new Date().toISOString(),
      })
      if (usersError) {
        console.error('فشل إدراج في users:', usersError)
        return
      }

      const newUser: User = {
        ...user,
        id: userId,
        createdAt: new Date().toISOString(),
      }
      setUsers(prev => [...prev, newUser])
    } finally {
      isAddingUserRef.current = false
    }
  }

  const updateUser = async (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u))

    await supabase.from('profiles').update({
      name: user.name,
      role_id: user.roleId,
      is_active: user.isActive,
    }).eq('id', user.id).then(({ error }) => error && console.error(error))

    await supabase.from('users').update({
      name: user.name,
      role_id: user.roleId,
      is_active: user.isActive,
      email: user.email,
    }).eq('id', user.id).then(({ error }) => error && console.error(error))
  }

  const deleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))

    await supabase.from('users').delete().eq('id', userId).then(({ error }) => {
      if (error) console.error('فشل حذف من users:', error)
    })

    await supabase.from('profiles').delete().eq('id', userId).then(({ error }) => {
      if (error) console.error('فشل حذف من profiles:', error)
    })
  }

  const addRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `role-${Date.now()}`
    const now = new Date().toISOString()
    setRoles(prev => [...prev, { ...role, id, createdAt: now, updatedAt: now }])
    await supabase.from('roles').insert({ id, name: role.name, name_ar: role.nameAr, permissions: role.permissions, created_at: now, updated_at: now }).then(({ error }) => error && console.error(error))
  }

  const updateRole = async (role: Role) => {
    setRoles(prev => prev.map(r => r.id === role.id ? { ...role, updatedAt: new Date().toISOString() } : r))
    await supabase.from('roles').update({ name: role.name, name_ar: role.nameAr, permissions: role.permissions, updated_at: new Date().toISOString() }).eq('id', role.id).then(({ error }) => error && console.error(error))
  }

  const deleteRole = async (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId))
    await supabase.from('roles').delete().eq('id', roleId).then(({ error }) => error && console.error(error))
  }

  // ============ المنتجات ============
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase.from('products').insert({
      name: product.name, name_ar: product.nameAr, price: product.price,
      category: product.category, stock: product.stock,
      product_type: product.productType, image_url: product.imageUrl,
      is_taxable: product.isTaxable,
    }).select().single()

    if (error) { console.error(error); return }
    if (data) {
      setProducts(prev => [...prev, {
        id: data.id, name: data.name, nameAr: data.name_ar, price: Number(data.price),
        category: data.category, stock: data.stock || 0, productType: data.product_type,
        imageUrl: data.image_url || '', isTaxable: data.is_taxable ?? true,
        createdAt: data.created_at, updatedAt: data.updated_at,
      }])
    }
  }

  const updateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...product, updatedAt: new Date().toISOString() } : p))
    await supabase.from('products').update({
      name: product.name, name_ar: product.nameAr, price: product.price,
      category: product.category, stock: product.stock,
      product_type: product.productType, image_url: product.imageUrl,
      is_taxable: product.isTaxable, updated_at: new Date().toISOString(),
    }).eq('id', product.id).then(({ error }) => error && console.error(error))
  }

  const deleteProduct = async (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
    await supabase.from('products').delete().eq('id', productId).then(({ error }) => error && console.error(error))
  }

  // ============ الطلبات ============
  const addOrder = async (order: Order) => {
    const { data, error: orderError } = await supabase
      .from('orders')
      .insert({
        number: order.number,
        customer_name: order.customerName,
        vehicle_number: order.vehicleNumber || null,
        customer_type: order.customerType,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        status: order.status,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod || null,
        cash_change: order.cashChange || 0,
        created_at: order.createdAt,
        completed_at: order.completedAt || null,
        cashier: order.cashier,
      })
      .select()
      .single()

    if (orderError) {
      console.error('فشل حفظ الطلب:', orderError)
      return
    }

    const newOrder: Order = {
      id: data.id,
      number: data.number,
      customerName: data.customer_name,
      vehicleNumber: data.vehicle_number,
      customerType: data.customer_type,
      items: data.items,
      subtotal: Number(data.subtotal),
      discount: Number(data.discount),
      tax: Number(data.tax),
      total: Number(data.total),
      status: data.status,
      paymentStatus: data.payment_status,
      paymentMethod: data.payment_method,
      cashChange: Number(data.cash_change || 0),
      createdAt: data.created_at,
      completedAt: data.completed_at,
      cashier: data.cashier,
    }

    setOrders(prev => [newOrder, ...prev])

    for (const item of newOrder.items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      if (product.productType === 'direct') {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity), updated_at: new Date().toISOString() })
          .eq('id', product.id)
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p))
      } else if (product.productType === 'recipe') {
        const recipe = recipes.find(r => r.productId === product.id)
        if (!recipe) continue

        for (const ri of recipe.ingredients) {
          const neededQty = ri.quantity * item.quantity
          await addStockMovement({
            type: 'out',
            ingredientId: ri.ingredientId,
            ingredientName: ingredients.find(i => i.id === ri.ingredientId)?.nameAr || '',
            quantity: neededQty,
            reason: `بيع ${item.nameAr} x${item.quantity}`,
            reference: newOrder.number,
            createdAt: new Date().toISOString(),
          })
        }
      }
    }

    if (newOrder.paymentStatus === 'paid' && newOrder.paymentMethod) {
      const invoiceNumber = getNextInvoiceNumber()
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert({
          number: invoiceNumber,
          order_id: newOrder.id,
          order_number: newOrder.number,
          customer_name: newOrder.customerName,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          discount: newOrder.discount,
          tax: newOrder.tax,
          total: newOrder.total,
          payment_method: newOrder.paymentMethod,
          payment_status: newOrder.paymentStatus,
          created_at: new Date().toISOString(),
          cashier: newOrder.cashier,
        })
        .select()
        .single()

      if (invError) {
        console.error('فشل إنشاء الفاتورة:', invError)
      } else if (invData) {
        const invoice: Invoice = {
          id: invData.id,
          number: invData.number,
          orderId: invData.order_id,
          orderNumber: invData.order_number,
          customerName: invData.customer_name,
          items: invData.items,
          subtotal: Number(invData.subtotal),
          discount: Number(invData.discount),
          tax: Number(invData.tax),
          total: Number(invData.total),
          paymentMethod: invData.payment_method,
          paymentStatus: invData.payment_status,
          createdAt: invData.created_at,
          cashier: invData.cashier,
        }
        setInvoices(prev => [invoice, ...prev])
      }
    }
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const completedAt = status === 'completed' ? new Date().toISOString() : order.completedAt
    const paymentStatus = status === 'completed' ? 'paid' as PaymentStatus : order.paymentStatus

    const updatedPaymentMethod = paymentMethod || order.paymentMethod

    if (paymentMethod) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod } : o))
      await supabase.from('orders').update({ payment_method: paymentMethod }).eq('id', orderId).then(({ error }) => error && console.error(error))
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, completedAt, paymentStatus, paymentMethod: updatedPaymentMethod } : o))

    const { error } = await supabase
      .from('orders')
      .update({ status, completed_at: completedAt, payment_status: paymentStatus, payment_method: updatedPaymentMethod })
      .eq('id', orderId)

    if (error) {
      console.error('فشل تحديث حالة الطلب:', error)
      return
    }

    if (status === 'ready' && order.status !== 'ready') {
      const audio = new Audio('/ready-sound.mp3')
      audio.play().catch(() => {})
    }

    if (status === 'completed' && updatedPaymentMethod) {
      const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle()

      if (checkError) {
        console.error('فشل التحقق من وجود فاتورة:', checkError)
        return
      }

      if (existingInvoice) {
        return
      }

      const invoiceNumber = getNextInvoiceNumber()
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .insert({
          number: invoiceNumber,
          order_id: orderId,
          order_number: order.number,
          customer_name: order.customerName,
          items: order.items,
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          total: order.total,
          payment_method: updatedPaymentMethod,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          cashier: order.cashier,
        })
        .select()
        .single()

      if (invError) {
        console.error('فشل إنشاء الفاتورة:', invError)
      } else if (invData) {
        const invoice: Invoice = {
          id: invData.id,
          number: invData.number,
          orderId: invData.order_id,
          orderNumber: invData.order_number,
          customerName: invData.customer_name,
          items: invData.items,
          subtotal: Number(invData.subtotal),
          discount: Number(invData.discount),
          tax: Number(invData.tax),
          total: Number(invData.total),
          paymentMethod: invData.payment_method,
          paymentStatus: invData.payment_status,
          createdAt: invData.created_at,
          cashier: invData.cashier,
        }
        setInvoices(prev => [invoice, ...prev])
      }
    }
  }

  const updateOrderPayment = async (orderId: string, paymentMethod: PaymentMethod) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod } : o))
    await supabase.from('orders').update({ payment_method: paymentMethod }).eq('id', orderId).then(({ error }) => error && console.error(error))
  }

  const cancelOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled', paymentStatus: o.paymentStatus === 'paid' ? 'refunded' : o.paymentStatus } : o))
    await supabase.from('orders').update({ status: 'cancelled', payment_status: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus }).eq('id', orderId).then(({ error }) => error && console.error(error))
  }

  // ============ الفئات ============
  const addCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = category.name.toLowerCase().replace(/\s+/g, '-')
    const now = new Date().toISOString()
    setCategories(prev => [...prev, { ...category, id, createdAt: now, updatedAt: now }])
    await supabase.from('categories').insert({ id, name: category.name, name_ar: category.nameAr, icon: category.icon, created_at: now, updated_at: now }).then(({ error }) => error && console.error(error))
  }

  const updateCategory = async (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? { ...category, updatedAt: new Date().toISOString() } : c))
    await supabase.from('categories').update({ name: category.name, name_ar: category.nameAr, icon: category.icon, updated_at: new Date().toISOString() }).eq('id', category.id).then(({ error }) => error && console.error(error))
  }

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId))
    await supabase.from('categories').delete().eq('id', categoryId).then(({ error }) => error && console.error(error))
  }

  // ============ الوحدات ============
  const addUnit = async (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = unit.name.toLowerCase()
    const now = new Date().toISOString()
    setUnits(prev => [...prev, { ...unit, id, createdAt: now, updatedAt: now }])
    await supabase.from('units').insert({ id, name: unit.name, name_ar: unit.nameAr, created_at: now, updated_at: now }).then(({ error }) => error && console.error(error))
  }

  const updateUnit = async (unit: Unit) => {
    setUnits(prev => prev.map(u => u.id === unit.id ? { ...unit, updatedAt: new Date().toISOString() } : u))
    await supabase.from('units').update({ name: unit.name, name_ar: unit.nameAr, updated_at: new Date().toISOString() }).eq('id', unit.id).then(({ error }) => error && console.error(error))
  }

  const deleteUnit = async (unitId: string) => {
    setUnits(prev => prev.filter(u => u.id !== unitId))
    await supabase.from('units').delete().eq('id', unitId).then(({ error }) => error && console.error(error))
  }

  // ============ الموردين ============
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `sup-${Date.now()}`
    const now = new Date().toISOString()
    setSuppliers(prev => [...prev, { ...supplier, id, createdAt: now, updatedAt: now }])
    await supabase.from('suppliers').insert({ id, name: supplier.name, phone: supplier.phone, email: supplier.email, created_at: now, updated_at: now }).then(({ error }) => error && console.error(error))
  }

  const updateSupplier = async (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...supplier, updatedAt: new Date().toISOString() } : s))
    await supabase.from('suppliers').update({ name: supplier.name, phone: supplier.phone, email: supplier.email, updated_at: new Date().toISOString() }).eq('id', supplier.id).then(({ error }) => error && console.error(error))
  }

  const deleteSupplier = async (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId))
    await supabase.from('suppliers').delete().eq('id', supplierId).then(({ error }) => error && console.error(error))
  }

  // ============ المكونات ============
  const addIngredient = async (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `ing-${Date.now()}`
    const now = new Date().toISOString()
    setIngredients(prev => [...prev, { ...ingredient, id, createdAt: now, updatedAt: now }])
    await supabase.from('ingredients').insert({
      id, name: ingredient.name, name_ar: ingredient.nameAr, unit: ingredient.unit,
      quantity: ingredient.quantity, minimum_stock: ingredient.minimumStock,
      cost: ingredient.cost, supplier_id: ingredient.supplierId, created_at: now, updated_at: now,
    }).then(({ error }) => error && console.error(error))
  }

  const updateIngredient = async (ingredient: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === ingredient.id ? { ...ingredient, updatedAt: new Date().toISOString() } : i))
    await supabase.from('ingredients').update({
      name: ingredient.name, name_ar: ingredient.nameAr, unit: ingredient.unit,
      quantity: ingredient.quantity, minimum_stock: ingredient.minimumStock,
      cost: ingredient.cost, supplier_id: ingredient.supplierId, updated_at: new Date().toISOString(),
    }).eq('id', ingredient.id).then(({ error }) => error && console.error(error))
  }

  const deleteIngredient = async (ingredientId: string) => {
    setIngredients(prev => prev.filter(i => i.id !== ingredientId))
    await supabase.from('ingredients').delete().eq('id', ingredientId).then(({ error }) => error && console.error(error))
  }

  // ============ حركة المخزون ============
  const addStockMovement = async (movement: Omit<StockMovement, 'id'>) => {
    const id = `sm-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    setStockMovements(prev => [{ ...movement, id }, ...prev])

    await supabase.from('stock_movements').insert({
      id, type: movement.type, ingredient_id: movement.ingredientId,
      ingredient_name: movement.ingredientName, quantity: movement.quantity,
      reason: movement.reason, reference: movement.reference, created_at: new Date().toISOString(),
    }).then(({ error }) => error && console.error(error))

    const ingredient = ingredients.find(i => i.id === movement.ingredientId)
    if (ingredient) {
      let newQty = ingredient.quantity
      if (movement.type === 'in' || movement.type === 'return') {
        newQty += movement.quantity
      } else if (movement.type === 'out' || movement.type === 'waste' || movement.type === 'adjustment') {
        newQty = Math.max(0, newQty - movement.quantity)
      }
      await updateIngredient({ ...ingredient, quantity: newQty })
    }
  }

  // ============ الوصفات ============
  const addRecipe = async (recipe: ProductRecipe) => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.productId === recipe.productId)
      if (idx >= 0) { const updated = [...prev]; updated[idx] = recipe; return updated }
      return [...prev, recipe]
    })
    await supabase.from('recipes').upsert({ product_id: recipe.productId, ingredients: recipe.ingredients, updated_at: new Date().toISOString() }).then(({ error }) => error && console.error(error))
  }

  const updateRecipe = async (recipe: ProductRecipe) => addRecipe(recipe)

  const deleteRecipe = async (productId: number) => {
    setRecipes(prev => prev.filter(r => r.productId !== productId))
    await supabase.from('recipes').delete().eq('product_id', productId).then(({ error }) => error && console.error(error))
  }

  // ============ المشتريات ============
  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'number'>) => {
    const id = `pur-${Date.now()}`
    const number = `PUR-${new Date().getFullYear()}${String(purchases.length + 1).padStart(3, '0')}`
    setPurchases(prev => [{ ...purchase, id, number }, ...prev])

    await supabase.from('purchases').insert({
      id, number, supplier_id: purchase.supplierId, supplier_name: purchase.supplierName,
      items: purchase.items, subtotal: purchase.subtotal, tax: purchase.tax,
      discount: purchase.discount, total: purchase.total, status: purchase.status,
      notes: purchase.notes, invoice_image: purchase.invoiceImage, created_at: purchase.createdAt,
    }).then(({ error }) => error && console.error(error))

    if (purchase.status === 'received') {
      for (const item of purchase.items) {
        const ing = ingredients.find(i => i.id === item.ingredientId)
        if (ing) {
          await updateIngredient({ ...ing, quantity: ing.quantity + item.quantity })
          await addStockMovement({
            type: 'in', ingredientId: item.ingredientId, ingredientName: item.ingredientName,
            quantity: item.quantity, reason: 'شراء', reference: number, createdAt: new Date().toISOString(),
          })
        }
      }
    }
  }

  const updatePurchaseStatus = async (purchaseId: string, status: Purchase['status']) => {
    setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status } : p))
    await supabase.from('purchases').update({ status }).eq('id', purchaseId).then(({ error }) => error && console.error(error))
  }

  // ============ الخصومات ============
  const addDiscount = async (discount: Omit<Discount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `disc-${Date.now()}`
    const now = new Date().toISOString()
    setDiscounts(prev => [...prev, { ...discount, id, createdAt: now, updatedAt: now }])
    await supabase.from('discounts').insert({
      id, name: discount.name, name_ar: discount.nameAr, type: discount.type,
      value: discount.value, applies_to: discount.appliesTo, category_id: discount.categoryId,
      product_id: discount.productId, start_date: discount.startDate, end_date: discount.endDate,
      is_active: discount.isActive, created_at: now, updated_at: now,
    }).then(({ error }) => error && console.error(error))
  }

  const updateDiscount = async (discount: Discount) => {
    setDiscounts(prev => prev.map(d => d.id === discount.id ? { ...discount, updatedAt: new Date().toISOString() } : d))
    await supabase.from('discounts').update({
      name: discount.name, name_ar: discount.nameAr, type: discount.type,
      value: discount.value, applies_to: discount.appliesTo, category_id: discount.categoryId,
      product_id: discount.productId, start_date: discount.startDate, end_date: discount.endDate,
      is_active: discount.isActive, updated_at: new Date().toISOString(),
    }).eq('id', discount.id).then(({ error }) => error && console.error(error))
  }

  const deleteDiscount = async (discountId: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== discountId))
    await supabase.from('discounts').delete().eq('id', discountId).then(({ error }) => error && console.error(error))
  }

  const getActiveDiscounts = () => {
    const today = new Date()
    return discounts.filter(d => d.isActive && new Date(d.startDate) <= today && new Date(d.endDate) >= today)
  }

  // ============ القسائم ============
  const addCoupon = async (coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>) => {
    const id = `coupon-${Date.now()}`
    const now = new Date().toISOString()
    setCoupons(prev => [...prev, { ...coupon, id, usedCount: 0, createdAt: now, updatedAt: now }])
    await supabase.from('coupons').insert({
      id, code: coupon.code, name: coupon.name, name_ar: coupon.nameAr,
      type: coupon.type, value: coupon.value, max_uses: coupon.maxUses,
      used_count: 0, min_order_amount: coupon.minOrderAmount,
      start_date: coupon.startDate, end_date: coupon.endDate,
      is_active: coupon.isActive, created_at: now, updated_at: now,
    }).then(({ error }) => error && console.error(error))
  }

  const updateCoupon = async (coupon: Coupon) => {
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...coupon, updatedAt: new Date().toISOString() } : c))
    await supabase.from('coupons').update({
      code: coupon.code, name: coupon.name, name_ar: coupon.nameAr,
      type: coupon.type, value: coupon.value, max_uses: coupon.maxUses,
      min_order_amount: coupon.minOrderAmount, start_date: coupon.startDate,
      end_date: coupon.endDate, is_active: coupon.isActive, updated_at: new Date().toISOString(),
    }).eq('id', coupon.id).then(({ error }) => error && console.error(error))
  }

  const deleteCoupon = async (couponId: string) => {
    setCoupons(prev => prev.filter(c => c.id !== couponId))
    await supabase.from('coupons').delete().eq('id', couponId).then(({ error }) => error && console.error(error))
  }

  const applyCoupon = async (code: string): Promise<Coupon | null> => {
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive && c.usedCount < c.maxUses)
    if (coupon) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, usedCount: c.usedCount + 1 } : c))
      await supabase.from('coupons').update({ used_count: coupon.usedCount + 1 }).eq('id', coupon.id).then(({ error }) => error && console.error(error))
      return coupon
    }
    return null
  }

  // ============ طرق الدفع ============
  const addPaymentMethod = async (method: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `pm-${Date.now()}`
    const now = new Date().toISOString()
    setPaymentMethods(prev => [...prev, { ...method, id, createdAt: now, updatedAt: now }])
    await supabase.from('payment_methods').insert({
      id, name: method.name, name_ar: method.nameAr, icon: method.icon,
      is_active: method.isActive, created_at: now, updated_at: now,
    }).then(({ error }) => error && console.error(error))
  }

  const updatePaymentMethod = async (method: PaymentMethodConfig) => {
    setPaymentMethods(prev => prev.map(m => m.id === method.id ? { ...method, updatedAt: new Date().toISOString() } : m))
    await supabase.from('payment_methods').update({
      name: method.name, name_ar: method.nameAr, icon: method.icon,
      is_active: method.isActive, updated_at: new Date().toISOString(),
    }).eq('id', method.id).then(({ error }) => error && console.error(error))
  }

  const deletePaymentMethod = async (methodId: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== methodId))
    await supabase.from('payment_methods').delete().eq('id', methodId).then(({ error }) => error && console.error(error))
  }

  // ============ الإعدادات ============
  const updateSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings)
    await supabase.from('settings').update({
      shop_name: newSettings.shopName, shop_name_ar: newSettings.shopNameAr,
      logo: newSettings.logo, tax_rate: newSettings.taxRate,
      currency: newSettings.currency, currency_ar: newSettings.currencyAr,
      address: newSettings.address, phone: newSettings.phone, email: newSettings.email,
      commercial_register: newSettings.commercialRegister,
      receipt_footer: newSettings.receiptFooter, receipt_footer_ar: newSettings.receiptFooterAr,
      language: newSettings.language, timezone: newSettings.timezone,
      date_format: newSettings.dateFormat, low_stock_alert: newSettings.lowStockAlert,
      print_receipt: newSettings.printReceipt,
    }).eq('id', 1).then(({ error }) => error && console.error(error))
  }

  // ============ أرقام ============
  const getNextOrderNumber = () => `ORD-${new Date().getFullYear()}${String(orders.length + 1).padStart(3, '0')}`
  const getNextInvoiceNumber = () => `INV-${new Date().getFullYear()}${String(invoices.length + 1).padStart(3, '0')}`
  const getNextPurchaseNumber = () => `PUR-${new Date().getFullYear()}${String(purchases.length + 1).padStart(3, '0')}`
  const getProductCountByCategory = (categoryId: string) => products.filter(p => p.category === categoryId).length

  const resetAllData = () => {
    setProducts([]); setCategories([]); setUnits([]); setSuppliers([]); setIngredients([])
    setRecipes([]); setStockMovements([]); setPurchases([]); setOrders([]); setInvoices([])
    setPaymentMethods([]); setDiscounts([]); setCoupons([]); setSettings({} as StoreSettings)
    setUsers([]); setRoles([]); setCurrentUser(null)
  }

  return (
    <StoreContext.Provider value={{
      products, categories, units, suppliers, ingredients, recipes,
      stockMovements, purchases, orders, invoices, paymentMethods,
      discounts, coupons, settings, users, roles, currentUser, isLoading, authLoading, settingsLoading, rolesLoading,
      refreshData,
      login, logout, addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole, hasPermission,
      addOrder, updateOrderStatus, updateOrderPayment, cancelOrder,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addUnit, updateUnit, deleteUnit,
      addSupplier, updateSupplier, deleteSupplier,
      addIngredient, updateIngredient, deleteIngredient,
      addStockMovement, addRecipe, updateRecipe, deleteRecipe,
      addPurchase, updatePurchaseStatus,
      addDiscount, updateDiscount, deleteDiscount,
      addCoupon, updateCoupon, deleteCoupon, applyCoupon,
      addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
      updateSettings,
      getNextOrderNumber, getNextInvoiceNumber, getNextPurchaseNumber,
      getProductCountByCategory, getActiveDiscounts, resetAllData,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider')
  return context
}