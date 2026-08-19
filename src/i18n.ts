import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const translations = {
  en: {
    translation: {
      // Sidebar
      dashboard: 'Dashboard',
      sales: 'Sales',
      orders: 'Orders',
      invoices: 'Invoices',
      paymentMethods: 'Payment Methods',
      menus: 'Menus',
      categories: 'Categories',
      products: 'Products',
      inventory: 'Inventory',
      analytics: 'Analytics',
      units: 'Units',
      suppliers: 'Suppliers',
      ingredients: 'Ingredients',
      stockMovement: 'Stock Movement',
      purchases: 'Purchases',
      offers: 'Offers',
      discounts: 'Discounts',
      coupons: 'Coupons',
      reports: 'Reports',
      users: 'Users',
      settings: 'Settings',
      pos: 'Point of Sale',
      barista: 'Barista Screen',
      cashier: 'Cashier Screen',
      
      // Header
      search: 'Search...',
      notifications: 'Notifications',
      admin: 'Admin',
      
      // Dashboard
      todaysSales: "Today's Sales",
      totalOrders: 'Total Orders',
      newCustomers: 'New Customers',
      averageOrder: 'Average Order',
      weeklySales: 'Weekly Sales',
      
      // POS
      pointOfSale: 'Point of Sale',
      currentOrder: 'Current Order',
      all: 'All',
      hotDrinks: 'Hot Drinks',
      coldDrinks: 'Cold Drinks',
      desserts: 'Desserts',
      emptyCart: 'Cart is empty',
      addToCart: 'Click on a product to add it',
      total: 'Total',
      checkout: 'Checkout',
      
      // Products
      addNew: 'Add New',
      addProduct: 'Add Product',
      searchProduct: 'Search for a product...',
      product: 'Product',
      category: 'Category',
      price: 'Price',
      stock: 'Stock',
      actions: 'Actions',
      
      // Orders
      orderNumber: 'Order Number',
      items: 'Items',
      status: 'Status',
      time: 'Time',
      view: 'View',
      new: 'New',
      preparing: 'Preparing',
      completed: 'Completed',
      cancelled: 'Cancelled',
      
      // Reports
      monthlySales: 'Monthly Sales',
      bestSellers: 'Best Sellers',
      
      // Settings
      storeInfo: 'Store Information',
      storeName: 'Store Name',
      taxRate: 'Tax Rate %',
      currency: 'Currency',
      receiptFooter: 'Receipt Footer',
      saveSettings: 'Save Settings',
    }
  },
  ar: {
    translation: {
      // Sidebar
      dashboard: 'الرئيسية',
      sales: 'المبيعات',
      orders: 'الطلبات',
      invoices: 'الفواتير',
      paymentMethods: 'طرق الدفع',
      menus: 'القوائم',
      categories: 'التصنيفات',
      products: 'المنتجات',
      inventory: 'المخزون',
      analytics: 'التحليلات',
      units: 'الوحدات',
      suppliers: 'الموردين',
      ingredients: 'المكونات',
      stockMovement: 'حركة المخزون',
      purchases: 'المشتريات',
      offers: 'العروض',
      discounts: 'الخصومات',
      coupons: 'القسائم',
      reports: 'التقارير',
      users: 'المستخدمين',
      settings: 'الإعدادات',
      pos: 'نقطة البيع',
      barista: 'شاشة الباريستا',
      cashier: 'شاشة الكاشير',
      
      // Header
      search: 'بحث...',
      notifications: 'الإشعارات',
      admin: 'مدير',
      
      // Dashboard
      todaysSales: 'مبيعات اليوم',
      totalOrders: 'عدد الطلبات',
      newCustomers: 'العملاء الجدد',
      averageOrder: 'متوسط الطلب',
      weeklySales: 'المبيعات الأسبوعية',
      
      // POS
      pointOfSale: 'نقطة البيع',
      currentOrder: 'الطلب الحالي',
      all: 'الكل',
      hotDrinks: 'مشروبات ساخنة',
      coldDrinks: 'مشروبات باردة',
      desserts: 'حلويات',
      emptyCart: 'السلة فارغة',
      addToCart: 'اضغط على منتج لإضافته',
      total: 'المجموع',
      checkout: 'إتمام الطلب',
      
      // Products
      addNew: 'إضافة جديد',
      addProduct: 'إضافة منتج',
      searchProduct: 'بحث عن منتج...',
      product: 'المنتج',
      category: 'الفئة',
      price: 'السعر',
      stock: 'المخزون',
      actions: 'إجراءات',
      
      // Orders
      orderNumber: 'رقم الطلب',
      items: 'العناصر',
      status: 'الحالة',
      time: 'الوقت',
      view: 'عرض',
      new: 'جديد',
      preparing: 'قيد التحضير',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      
      // Reports
      monthlySales: 'إجمالي المبيعات الشهرية',
      bestSellers: 'الأصناف الأكثر مبيعًا',
      
      // Settings
      storeInfo: 'معلومات المتجر',
      storeName: 'اسم المتجر',
      taxRate: 'نسبة الضريبة %',
      currency: 'العملة',
      receiptFooter: 'نص أسفل الفاتورة',
      saveSettings: 'حفظ الإعدادات',
    }
  }
}

// ✅ قراءة اللغة المحفوظة من localStorage
const savedLanguage = localStorage.getItem('app-language') || 'ar'

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: savedLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  })

// ضبط الاتجاه الأولي حسب اللغة
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = i18n.language

// تحديث الاتجاه عند تغيير اللغة
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
  // ✅ حفظ اللغة عند التغيير
  localStorage.setItem('app-language', lng)
})

export default i18n