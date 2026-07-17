import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Clipboard, Truck, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;

  // Protect against access without order state context
  if (!order) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container animate-fadein" style={{ padding: '60px 24px', maxWidth: '680px', textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--success-light)',
        color: 'var(--success)',
        marginBottom: '24px'
      }}>
        <CheckCircle size={48} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Order Placed Successfully!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '32px' }}>
        Thank you for shopping with us. Your Cash on Delivery order is now in our system.
      </p>

      {/* Order Info Panel Card */}
      <div className="card" style={{ textAlign: 'left', padding: '24px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ORDER NUMBER</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text)' }}>#{order.id}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ESTIMATED DELIVERY</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={16} /> 1 - 2 Days
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>DELIVERY ADDRESS</span>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginTop: '4px', lineHeight: 1.4 }}>
            {order.delivery_address}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>PAYMENT METHOD</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>Cash on Delivery (COD)</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>AMOUNT TO PAY</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <Link to="/orders" className="btn btn-primary" style={{ padding: '12px 28px' }}>
          <Clipboard size={18} /> Track Your Order
        </Link>
        <Link to="/" className="btn btn-secondary" style={{ padding: '12px 28px' }}>
          <ShoppingBag size={18} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
