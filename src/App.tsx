import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './context/StoreContext'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Barista from './pages/Barista'
import Cashier from './pages/Cashier'
import Orders from './pages/Orders'
import Invoices from './pages/sales/Invoices'
import PaymentMethods from './pages/sales/PaymentMethods'
import Products from './pages/Products'
import Categories from './pages/menus/Categories'
import Reports from './pages/Reports'
import UsersPage from './pages/Users'
import Settings from './pages/Settings'
import Ingredients from './pages/inventory/Ingredients'
import Units from './pages/inventory/Units'
import Suppliers from './pages/inventory/Suppliers'
import Purchases from './pages/inventory/Purchases'
import StockMovements from './pages/inventory/StockMovements'
import InventoryAnalytics from './pages/inventory/Analytics'
import Discounts from './pages/offers/Discounts'
import Coupons from './pages/offers/Coupons'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { currentUser, authLoading, settingsLoading, rolesLoading, hasPermission } = useStore()
  
  // ✅ انتظر حتى تكتمل الجلسة والإعدادات والأدوار
  if (authLoading || settingsLoading || rolesLoading) return <LoadingScreen />
  
  if (!currentUser) return <Navigate to="/login" replace />
  if (permission && !hasPermission(permission as any)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { currentUser, authLoading, settingsLoading } = useStore()

  if (authLoading || settingsLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute permission="pos"><POS /></ProtectedRoute>} />
        <Route path="/barista" element={<ProtectedRoute permission="barista"><Barista /></ProtectedRoute>} />
        <Route path="/cashier" element={<ProtectedRoute permission="cashier"><Cashier /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute permission="orders"><Orders /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute permission="invoices"><Invoices /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute permission="payment-methods"><PaymentMethods /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute permission="products"><Products /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute permission="categories"><Categories /></ProtectedRoute>} />
        <Route path="/ingredients" element={<ProtectedRoute permission="ingredients"><Ingredients /></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute permission="units"><Units /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute permission="suppliers"><Suppliers /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute permission="purchases"><Purchases /></ProtectedRoute>} />
        <Route path="/stock-movement" element={<ProtectedRoute permission="stock-movement"><StockMovements /></ProtectedRoute>} />
        <Route path="/inventory-analytics" element={<ProtectedRoute permission="inventory-analytics"><InventoryAnalytics /></ProtectedRoute>} />
        <Route path="/discounts" element={<ProtectedRoute permission="discounts"><Discounts /></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute permission="coupons"><Coupons /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute permission="reports"><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute permission="users"><UsersPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}