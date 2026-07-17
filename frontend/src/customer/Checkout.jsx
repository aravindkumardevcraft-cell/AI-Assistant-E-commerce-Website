import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, ClipboardCheck, ArrowRight, Award } from 'lucide-react';

export default function Checkout() {
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  // State Variables
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Address creation form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);

  // Fetch address list and loyalty balance
  const fetchCheckoutData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const addrRes = await fetch('http://localhost:8000/api/accounts/addresses/', { headers });
      const loyaltyRes = await fetch('http://localhost:8000/api/loyalty/', { headers });

      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData);
        if (addrData.length > 0) {
          // Default to the default address or first in list
          const defAddr = addrData.find(a => a.is_default) || addrData[0];
          setSelectedAddressId(defAddr.id);
        }
      }
      
      if (loyaltyRes.ok) {
        const loyaltyData = await loyaltyRes.json();
        setLoyaltyAccount(loyaltyData);
      }
    } catch (err) {
      console.error('Error fetching checkout dependencies:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/cart');
      return;
    }
    fetchCheckoutData();
  }, [token]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addrStreet || !addrCity || !addrState || !addrZip || !addrPhone) {
      setError('Please fill in all address fields.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      title: addrTitle,
      street_address: addrStreet,
      city: addrCity,
      state: addrState,
      postal_code: addrZip,
      phone: addrPhone,
      is_default: addrDefault
    };

    try {
      const res = await fetch('http://localhost:8000/api/accounts/addresses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddressForm(false);
        // Clear address fields
        setAddrStreet('');
        setAddrCity('');
        setAddrState('');
        setAddrZip('');
        setAddrPhone('');
        setAddrDefault(false);
        fetchCheckoutData();
      } else {
        setError('Failed to save address details.');
      }
    } catch (e) {
      console.error(e);
      setError('Network communication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or create a delivery address before placing order.');
      return;
    }

    setLoading(true);
    setError('');

    // Generate random Idempotency Key to protect against duplicate orders
    const idempotencyKey = crypto.randomUUID();

    const payload = {
      address_id: selectedAddressId,
      idempotency_key: idempotencyKey,
      loyalty_points_to_redeem: pointsToRedeem
    };

    try {
      const res = await fetch('http://localhost:8000/api/orders/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        // Clear local/DB cart
        clearCart();
        // Redirect to confirmation page, passing order data in location state
        navigate('/order-confirmation', { state: { order: orderData } });
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to place order. Please review stock availability.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Point Discounts
  const getPointsDiscount = () => {
    if (pointsToRedeem === 500) return 25.00;
    if (pointsToRedeem === 1000) return 60.00;
    if (pointsToRedeem === 2000) return 150.00;
    return 0.00;
  };

  const discount = getPointsDiscount();
  const finalTotal = Math.max(cartSubtotal - discount, 0);
  const pointsToEarn = Math.floor(finalTotal / 10);

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.02em' }}>
        Checkout
      </h1>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', borderLeft: '4px solid var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        {/* Left Column: Delivery Address & Loyalty points options */}
        <div>
          {/* Address card */}
          <div className="card" style={{ marginBottom: '32px', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <MapPin size={20} style={{ color: 'var(--primary)' }} /> Delivery Address
            </h3>

            {/* Address Selector list */}
            {addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <label 
                      key={addr.id}
                      style={{
                        display: 'flex',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer',
                        gap: '12px',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="address_select" 
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: '4px', accentColor: 'var(--primary)' }}
                      />
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 600, display: 'block', color: 'var(--text)' }}>
                          {addr.title} {addr.is_default && <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--success)', marginLeft: '6px' }}>[Default]</span>}
                        </span>
                        <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          {addr.street_address}, {addr.city}, {addr.state} - {addr.postal_code}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Phone: {addr.phone}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                No delivery address created. Please configure an address below.
              </div>
            )}

            {/* Toggle Address Drawer */}
            {!showAddressForm ? (
              <button 
                onClick={() => setShowAddressForm(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Add New Address
              </button>
            ) : (
              <form onSubmit={handleCreateAddress} style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Address Label *</label>
                    <input type="text" className="form-input" placeholder="Home, Work" value={addrTitle} onChange={(e) => setAddrTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone *</label>
                    <input type="text" className="form-input" placeholder="Delivery contact" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address *</label>
                  <input type="text" className="form-input" placeholder="Flat, building, street details" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" className="form-input" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input type="text" className="form-input" value={addrState} onChange={(e) => setAddrState(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code *</label>
                    <input type="text" className="form-input" placeholder="Pincode" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                  <input type="checkbox" id="addr_default" checked={addrDefault} onChange={(e) => setAddrDefault(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="addr_default" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Set as default delivery address</label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Save Address
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddressForm(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Loyalty point choices */}
          {loyaltyAccount && loyaltyAccount.balance >= 500 && (
            <div className="card" style={{ backgroundColor: 'var(--surface)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Award size={20} style={{ color: 'var(--success)' }} /> Redeem Loyalty Rewards
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
                You have <strong>{loyaltyAccount.balance}</strong> points. Choose a reward discount to apply to this order:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="loyalty_redeem" 
                    checked={pointsToRedeem === 0} 
                    onChange={() => setPointsToRedeem(0)}
                    style={{ accentColor: 'var(--success)' }}
                  />
                  Do not redeem points (Keep balance)
                </label>

                {loyaltyAccount.balance >= 500 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="loyalty_redeem" 
                      checked={pointsToRedeem === 500} 
                      onChange={() => setPointsToRedeem(500)}
                      style={{ accentColor: 'var(--success)' }}
                    />
                    Redeem 500 points &rarr; <strong>₹25.00 discount</strong>
                  </label>
                )}

                {loyaltyAccount.balance >= 1000 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="loyalty_redeem" 
                      checked={pointsToRedeem === 1000} 
                      onChange={() => setPointsToRedeem(1000)}
                      style={{ accentColor: 'var(--success)' }}
                    />
                    Redeem 1,000 points &rarr; <strong>₹60.00 discount</strong>
                  </label>
                )}

                {loyaltyAccount.balance >= 2000 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="loyalty_redeem" 
                      checked={pointsToRedeem === 2000} 
                      onChange={() => setPointsToRedeem(2000)}
                      style={{ accentColor: 'var(--success)' }}
                    />
                    Redeem 2,000 points &rarr; <strong>₹150.00 discount</strong>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Calculator Review Card */}
        <aside className="card" style={{ padding: '24px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
            Checkout Details
          </h3>

          {/* Cart items listing */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {cartItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text)', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.quantity} x {item.product.name} ({item.variant.name})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ₹{(item.variant.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <strong style={{ color: 'var(--text)' }}>₹{cartSubtotal.toFixed(2)}</strong>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--success)' }}>
              <span>Loyalty Points Discount</span>
              <strong>-₹{discount.toFixed(2)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Shipping Fee</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Option</span>
            <strong style={{ color: 'var(--text)' }}>Cash on Delivery</strong>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

          {/* Loyalty Reward Accrual warning */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            marginBottom: '24px',
            border: '1px solid hsl(142, 50%, 85%)'
          }}>
            <Award size={18} style={{ flexShrink: 0 }} />
            <div>
              <span>You will earn <strong>{pointsToEarn} points</strong> upon Cash on Delivery completion.</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Amount To Collect</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--text)' }}>₹{finalTotal.toFixed(2)}</strong>
          </div>

          <button 
            onClick={handlePlaceOrder}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}
            disabled={loading}
          >
            <ClipboardCheck size={18} /> {loading ? 'Placing Order...' : 'Place COD Order'}
          </button>
        </aside>
      </div>
    </div>
  );
}
