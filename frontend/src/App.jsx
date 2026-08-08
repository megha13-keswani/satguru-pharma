import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import MedicineListing from './pages/MedicineListing';
import Cart from './pages/Cart';
import OrderPlacement from './pages/OrderPlacement';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import MedicineDetail from './pages/MedicineDetail';
import ShopApprovals from './pages/admin/ShopApprovals';
import ShopDetail from './pages/admin/ShopDetail';
import OrderManagement from './pages/admin/OrderManagement';
import Inventory from './pages/admin/Inventory';
import Chat from './pages/Chat';
import AdminInbox from './pages/admin/AdminInbox';
import AdminChat from './pages/admin/AdminChat';
import BottomNav from './components/BottomNav';
import MedicineManagement from './pages/admin/MedicineManagement';
import ShopOrdersMatrix from './pages/admin/ShopOrdersMatrix';
import RevenueReport from './pages/admin/RevenueReport';

function ProtectedRoute({ children, adminOnly, superAdminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" />;
  if (superAdminOnly && !user.isSuperAdmin) return <Navigate to="/admin" />;
  return children;
}





function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pb-16 sm:pb-0">
     <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/" element={<ProtectedRoute><MedicineListing /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
  <Route path="/checkout" element={<ProtectedRoute><OrderPlacement /></ProtectedRoute>} />
  <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
  <Route path="/medicines/:id" element={<ProtectedRoute><MedicineDetail /></ProtectedRoute>} />
  <Route path="/admin/shops" element={<ProtectedRoute adminOnly superAdminOnly><ShopApprovals /></ProtectedRoute>} />
  <Route path="/admin/shops/:id" element={<ProtectedRoute adminOnly superAdminOnly><ShopDetail /></ProtectedRoute>} />
  <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrderManagement /></ProtectedRoute>} />
<Route path="/admin/inventory" element={<ProtectedRoute adminOnly><Inventory /></ProtectedRoute>} />
<Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
<Route path="/admin/inbox" element={<ProtectedRoute adminOnly><AdminInbox /></ProtectedRoute>} />
<Route path="/admin/chat/:shopId" element={<ProtectedRoute adminOnly><AdminChat /></ProtectedRoute>} />
<Route path="/admin/medicines" element={<ProtectedRoute adminOnly superAdminOnly><MedicineManagement /></ProtectedRoute>} />
<Route path="/admin/shop-orders" element={<ProtectedRoute adminOnly superAdminOnly><ShopOrdersMatrix /></ProtectedRoute>} />
<Route path="/admin/revenue" element={<ProtectedRoute adminOnly superAdminOnly><RevenueReport /></ProtectedRoute>} />
</Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;