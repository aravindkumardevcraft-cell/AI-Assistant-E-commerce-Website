import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShoppingBag, PackagePlus, ClipboardList, Users, BarChart3, LogOut, ArrowLeft
} from 'lucide-react';

export default function AdminLayout() {
  const { token, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route protection
  React.useEffect(() => {
    if (!token || !isAdmin) {
      navigate('/admin/login');
    }
  }, [token, isAdmin, navigate]);

  if (!token || !isAdmin) {
    return null; // Don't render content during redirect
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-wrapper">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ color: 'white', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            SmartStore <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Admin</span>
          </h3>
        </div>

        <nav style={{ flexGrow: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link 
            to="/admin/dashboard" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/dashboard') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/dashboard') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link 
            to="/admin/products" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/products') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/products') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <ShoppingBag size={18} />
            Products
          </Link>

          <Link 
            to="/admin/stock" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/stock') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/stock') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <PackagePlus size={18} />
            Stock Inventory
          </Link>

          <Link 
            to="/admin/orders" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/orders') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/orders') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <ClipboardList size={18} />
            Order Operations
          </Link>

          <Link 
            to="/admin/customers" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/customers') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/customers') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <Users size={18} />
            Customer Directory
          </Link>

          <Link 
            to="/admin/analytics" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: isActive('/admin/analytics') ? 'white' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive('/admin/analytics') ? 'rgba(255,255,255,0.08)' : 'transparent',
              fontWeight: 500
            }}
          >
            <BarChart3 size={18} />
            Intelligence Insights
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              transition: 'var(--transition-fast)'
            }}
          >
            <ArrowLeft size={16} />
            Back to storefront
          </Link>
          <button 
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              color: 'var(--danger)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
