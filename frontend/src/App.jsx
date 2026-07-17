import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { ChatbotWidget } from './components/ChatbotWidget';

// Customer Pages
import Home from './customer/Home';
import Shop from './customer/Shop';
import ProductDetail from './customer/ProductDetail';
import Cart from './customer/Cart';
import Checkout from './customer/Checkout';
import OrderConfirmation from './customer/OrderConfirmation';
import OrderHistory from './customer/OrderHistory';
import LoyaltyDashboard from './customer/LoyaltyDashboard';

// Admin Pages & Layout
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import AdminProducts from './admin/Products';
import AdminQuickStock from './admin/QuickStock';
import AdminOrders from './admin/Orders';
import AdminCustomers from './admin/Customers';
import AdminAnalytics from './admin/Analytics';

// Helper Wrapper for Customer Layout
const CustomerLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <AuthModal />
      <ChatbotWidget />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Customer Front-Facing Storefront */}
            <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
            <Route path="/shop" element={<CustomerLayout><Shop /></CustomerLayout>} />
            <Route path="/product/:id" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
            <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
            <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
            <Route path="/order-confirmation" element={<CustomerLayout><OrderConfirmation /></CustomerLayout>} />
            <Route path="/orders" element={<CustomerLayout><OrderHistory /></CustomerLayout>} />
            <Route path="/loyalty" element={<CustomerLayout><LoyaltyDashboard /></CustomerLayout>} />

            {/* Admin Portal Credentials Entry */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Management Dashboard Wrapper */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="stock" element={<AdminQuickStock />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
