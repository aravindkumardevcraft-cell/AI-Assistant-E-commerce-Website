import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Award } from 'lucide-react';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartSubtotal, loading } = useCart();
  const { token, triggerLoginModal } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutRedirect = () => {
    if (token) {
      navigate('/checkout');
    } else {
      // Trigger login modal, and proceed to checkout on success
      triggerLoginModal(() => navigate('/checkout'));
    }
  };

  if (loading) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span>Loading your shopping cart...</span>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <ShoppingBag size={32} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700 }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '32px' }}>
          Looks like you haven't added any household essentials yet.
        </p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  // Calculate points to earn (1 point for every ₹10 spent)
  const pointsToEarn = Math.floor(cartSubtotal / 10);

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Shopping Cart
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        You have {cartItems.length} unique item{cartItems.length > 1 ? 's' : ''} in your cart.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
        {/* Left Column: Cart Items List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {cartItems.map((item, idx) => {
            const isLast = idx === cartItems.length - 1;
            return (
              <div 
                key={`${item.product.id}-${item.variant.id}`} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '24px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  gap: '20px'
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'hsl(220, 20%, 98%)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  flexShrink: 0
                }}>
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name} 
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.product.brand}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '2px 0 4px 0', color: 'var(--text)' }}>
                    {item.product.name}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Size: {item.variant.name} &bull; Unit Price: ₹{item.variant.price}
                  </span>
                </div>

                {/* Quantity Adjustment Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface)',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: '32px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                    style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)' }}
                    disabled={item.quantity >= item.variant.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Total Item Price */}
                <div style={{ width: '100px', textAlign: 'right' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>
                    ₹{(item.variant.price * item.quantity).toFixed(2)}
                  </strong>
                  {item.variant.stock <= item.quantity && (
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 500 }}>
                      Stock limit reached
                    </span>
                  )}
                </div>

                {/* Trash button */}
                <button 
                  onClick={() => removeFromCart(item.product.id, item.variant.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '8px',
                    transition: 'var(--transition-fast)'
                  }}
                  title="Remove item"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary Calculations Card */}
        <aside className="card" style={{ padding: '24px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <strong style={{ color: 'var(--text)' }}>₹{cartSubtotal.toFixed(2)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE (COD)</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

          {/* Loyalty Reward Accrual Warning Card */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '24px',
            border: '1px solid hsl(142, 50%, 85%)'
          }}>
            <Award size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>+{pointsToEarn} Loyalty Points</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                Earned after successful Cash on Delivery receipt.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Total Estimate</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--text)' }}>₹{cartSubtotal.toFixed(2)}</strong>
          </div>

          <button 
            onClick={handleCheckoutRedirect}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
