import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '40px 0 24px 0',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}>
          <div>
            <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>SmartStore</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Everyday household essentials delivered directly to your doorstep. Powered by intelligence.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Shop</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li><Link to="/shop">Browse Products</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Customer Account</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/loyalty">Loyalty Rewards</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Contact & Support</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li>Support Email: care@smartstore.local</li>
              <li>Operational Hours: 9 AM - 9 PM</li>
            </ul>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <span>&copy; {new Date().getFullYear()} SmartStore. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/admin/login" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>
              Store Operations Manager (Admin Access)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
