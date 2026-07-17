import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, Award, ClipboardList, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, token, logout, triggerLoginModal } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header glass">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo / Brand Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.5rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary), var(--success))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            SmartStore
          </span>
        </Link>

        {/* Customer Navigation Links */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{ 
              fontWeight: 500, 
              color: isActive('/') ? 'var(--primary)' : 'var(--text-muted)' 
            }}
          >
            Home
          </Link>
          <Link 
            to="/shop" 
            style={{ 
              fontWeight: 500, 
              color: isActive('/shop') ? 'var(--primary)' : 'var(--text-muted)' 
            }}
          >
            Products
          </Link>
          
          {token && (
            <>
              <Link 
                to="/orders" 
                style={{ 
                  fontWeight: 500, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isActive('/orders') ? 'var(--primary)' : 'var(--text-muted)' 
                }}
              >
                <ClipboardList size={16} />
                Orders
              </Link>
              <Link 
                to="/loyalty" 
                style={{ 
                  fontWeight: 500, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isActive('/loyalty') ? 'var(--primary)' : 'var(--text-muted)' 
                }}
              >
                <Award size={16} />
                Rewards
              </Link>
            </>
          )}
        </nav>

        {/* Action Controls (Search, Cart, Auth) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cart Icon with badge */}
          <Link to="/cart" className="btn-icon" style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Profile / Auth Button */}
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>Customer</span>
              </div>
              <button onClick={logout} className="btn-icon" title="Log Out">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => triggerLoginModal(() => navigate('/'))}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              <User size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
