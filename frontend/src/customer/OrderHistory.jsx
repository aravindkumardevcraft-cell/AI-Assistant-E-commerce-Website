import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clipboard, Truck, AlertCircle, ChevronDown, ChevronUp, XOctagon } from 'lucide-react';

export default function OrderHistory() {
  const { token } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:8000/api/orders/history/', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setError('Failed to fetch order history.');
      }
    } catch (e) {
      console.error(e);
      setError('Network communication failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/orders/history/${orderId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Order successfully cancelled!");
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to cancel order.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    }
  };

  // State Machine Timeline Steps mapping
  const timelineSteps = [
    { key: 'NEW', label: 'Placed' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PACKING', label: 'Packing' },
    { key: 'READY_FOR_DELIVERY', label: 'Ready' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  const getStepIndex = (status) => {
    return timelineSteps.findIndex(s => s.key === status);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span>Loading purchase history...</span>
      </div>
    );
  }

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        My Orders
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Track progress and check past orders.
      </p>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)'
        }}>
          <Clipboard size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No orders found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            You haven't placed any orders yet. Visit our shop directory to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStepIdx = getStepIndex(order.status);
            const isTerminalCancel = order.status === 'CANCELLED';
            const isTerminalReject = order.status === 'REJECTED';

            return (
              <div 
                key={order.id}
                className="card"
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  transition: 'var(--transition-normal)'
                }}
              >
                {/* Header summary info block */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '16px'
                }} onClick={() => toggleExpandOrder(order.id)}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER NUMBER</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>#{order.id}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN')} &bull; ₹{parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className={`badge ${
                      order.status === 'DELIVERED' ? 'badge-success' : 
                      (isTerminalCancel || isTerminalReject) ? 'badge-danger' : 
                      'badge-primary'
                    }`}>
                      {order.status}
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Expanded Tracking Timeline and Items */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '20px', animation: 'fadeIn var(--transition-fast) forwards' }}>
                    {/* Status Tracking Progress Bar */}
                    {!isTerminalCancel && !isTerminalReject ? (
                      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DELIVERY STATUS TIMELINE</span>
                        
                        {/* Progress Dots grid */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '12px' }}>
                          {/* Connection line */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: 0,
                            right: 0,
                            height: '4px',
                            backgroundColor: 'var(--border)',
                            zIndex: 1
                          }}></div>
                          
                          {/* Active filled line */}
                          {currentStepIdx >= 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: 0,
                              width: `${(currentStepIdx / (timelineSteps.length - 1)) * 100}%`,
                              height: '4px',
                              backgroundColor: 'var(--primary)',
                              zIndex: 2,
                              transition: 'width var(--transition-slow)'
                            }}></div>
                          )}

                          {timelineSteps.map((step, idx) => {
                            const isPassed = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            
                            return (
                              <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, width: '60px' }}>
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: isCurrent ? 'var(--primary)' : isPassed ? 'var(--primary)' : 'white',
                                  border: '4px solid',
                                  borderColor: isPassed ? 'var(--primary)' : 'var(--border)',
                                  boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none',
                                  transition: 'all var(--transition-normal)'
                                }}></div>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: isCurrent ? '700' : '500',
                                  color: isCurrent ? 'var(--primary)' : isPassed ? 'var(--text)' : 'var(--text-muted)',
                                  marginTop: '6px',
                                  textAlign: 'center'
                                }}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        backgroundColor: 'var(--danger-light)',
                        color: 'var(--danger)',
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        marginBottom: '24px',
                        borderLeft: '4px solid var(--danger)'
                      }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Order Status: {order.status}</strong>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                            {isTerminalCancel ? 'This transaction was cancelled by you.' : 'This transaction was rejected by store administrators.'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ETA block */}
                    {order.delivery_eta && (
                      <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text)' }}>
                        <strong>Estimated Delivery:</strong> {order.delivery_eta}
                      </div>
                    )}

                    {/* Address block */}
                    <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Delivery Address:</strong> {order.delivery_address}
                    </div>

                    {/* Items List */}
                    <div style={{ marginBottom: '24px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>ITEMS ORDERED</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.items && order.items.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span>
                              {item.quantity} x {item.product_name} ({item.variant_name})
                            </span>
                            <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cancel action button */}
                    {order.status === 'NEW' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="btn btn-secondary"
                        style={{
                          color: 'var(--danger)',
                          borderColor: 'hsl(0, 84%, 90%)',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--danger-light)'
                        }}
                      >
                        <XOctagon size={16} /> Cancel Order
                      </button>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
