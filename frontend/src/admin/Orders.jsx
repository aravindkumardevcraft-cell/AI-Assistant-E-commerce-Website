import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Eye, Printer, CheckCircle, Package, Truck, XCircle, Clock, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function Orders() {
  const { token } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Transition form state
  const [deliveryEta, setDeliveryEta] = useState('30-45 minutes');
  const [codReceived, setCodReceived] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      let url = 'http://localhost:8000/api/orders/admin-ops/';
      
      const params = [];
      if (selectedStatus) params.push(`status=${selectedStatus}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        setError('Failed to fetch administrative order log.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection refused.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, searchQuery]);

  const handleTransition = async (orderId, targetStatus) => {
    setError('');
    const payload = {
      status: targetStatus,
      notes: notes,
      delivery_eta: targetStatus === 'OUT_FOR_DELIVERY' ? deliveryEta : '',
      cod_received: targetStatus === 'DELIVERED' ? codReceived : false
    };

    try {
      const res = await fetch(`http://localhost:8000/api/orders/admin-ops/${orderId}/transition/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNotes('');
        setCodReceived(false);
        fetchOrders();
      } else {
        const data = await res.json();
        setError(data.detail || 'Transition rejected by state machine.');
      }
    } catch (e) {
      console.error(e);
      setError('Server connection error.');
    }
  };

  // Printable Packing Slip Handler
  const handlePrintPackingSlip = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Packing Slip - Order #${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 28px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .meta { font-size: 14px; text-align: right; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .details h3 { border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; font-size: 16px; }
            .details p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f5f5f5; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; font-size: 13px; font-weight: bold; }
            td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 15px; }
            .footer { border-top: 1px solid #ddd; margin-top: 50px; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">SMART STORE</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Warehouse Packing Slip</p>
            </div>
            <div class="meta">
              <strong>Order ID: #${order.id}</strong><br/>
              Date: ${new Date(order.created_at).toLocaleString()}<br/>
              Status: ${order.status}
            </div>
          </div>

          <div class="details">
            <div>
              <h3>Ship To</h3>
              <strong>${order.customer_name}</strong>
              <p>${order.delivery_address}</p>
              <p>Phone: ${order.delivery_phone}</p>
              <p>Email: ${order.customer_email}</p>
            </div>
            <div>
              <h3>Order Details</h3>
              <p>Payment Method: Cash on Delivery (COD)</p>
              <p>Payment Status: ${order.payment_status}</p>
              <p>Est. Delivery ETA: ${order.delivery_eta || '1-2 Days'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td><strong>${item.sku}</strong></td>
                  <td>${item.brand} - ${item.product_name} (${item.variant_name})</td>
                  <td>₹${parseFloat(item.price).toFixed(2)}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Total Amount Due: ₹${parseFloat(order.total_amount).toFixed(2)}
          </div>

          <div class="footer">
            Thank you for shopping with Smart Store. Please check contents before accepting delivery.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fadein">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800 }}>Order Backlog Manager</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Accept new orders, track warehouse packing, and log deliveries.</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by ID, name, email, address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%', minWidth: '260px' }}
          />
        </div>

        <select 
          className="form-input" 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ width: '220px' }}
        >
          <option value="">All Order Statuses</option>
          <option value="NEW">New / Unprocessed</option>
          <option value="ACCEPTED">Accepted Backlog</option>
          <option value="PACKING">Being Packed</option>
          <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered & Paid</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Orders List display */}
      {loading && orders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading system orders...</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No orders match the selected filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div 
                key={order.id} 
                className="card" 
                style={{ 
                  padding: '24px', 
                  borderLeft: order.status === 'NEW' ? '4px solid var(--primary)' : '1px solid var(--border)' 
                }}
              >
                {/* Header overview row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER #{order.id}</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0 4px 0' }}>{order.customer_name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleString()} &bull; Total: <strong>₹{parseFloat(order.total_amount).toFixed(2)}</strong> &bull; COD
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className={`badge ${
                      order.status === 'NEW' ? 'badge-primary' : 
                      order.status === 'DELIVERED' ? 'badge-success' : 
                      ['CANCELLED', 'REJECTED'].includes(order.status) ? 'badge-danger' : 
                      'badge-warning'
                    }`}>
                      {order.status}
                    </span>
                    <button 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> Process Order
                    </button>
                    <button 
                      onClick={() => handlePrintPackingSlip(order)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Printer size={14} /> Slip
                    </button>
                  </div>
                </div>

                {/* Expanded State transitions & Items list details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '20px' }}>
                    
                    {/* Items List */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>Items Snapshot</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '8px 0' }}>SKU</th>
                            <th style={{ padding: '8px 0' }}>Product Description</th>
                            <th style={{ padding: '8px 0' }}>Price</th>
                            <th style={{ padding: '8px 0' }}>Quantity</th>
                            <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 0' }}><strong>{item.sku}</strong></td>
                              <td style={{ padding: '8px 0' }}>{item.brand} - {item.product_name} ({item.variant_name})</td>
                              <td style={{ padding: '8px 0' }}>₹{parseFloat(item.price).toFixed(2)}</td>
                              <td style={{ padding: '8px 0' }}>{item.quantity}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>Shipment Contact Info</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {order.delivery_address}<br/>
                          Phone: {order.delivery_phone}<br/>
                          Email: {order.customer_email}
                        </p>
                      </div>

                      {/* State transitions options */}
                      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>State Machine Actions</h4>
                        
                        {order.status === 'NEW' && (
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                              onClick={() => handleTransition(order.id, 'ACCEPTED')}
                              className="btn btn-primary"
                              style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                            >
                              <CheckCircle size={16} /> Accept Order
                            </button>
                            <button 
                              onClick={() => handleTransition(order.id, 'REJECTED')}
                              className="btn btn-secondary"
                              style={{ color: 'var(--danger)', borderColor: 'hsl(0, 84%, 90%)', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                            >
                              <XCircle size={16} /> Reject Order
                            </button>
                          </div>
                        )}

                        {order.status === 'ACCEPTED' && (
                          <button 
                            onClick={() => handleTransition(order.id, 'PACKING')}
                            className="btn btn-primary"
                            style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                          >
                            <Package size={16} /> Start Packing order
                          </button>
                        )}

                        {order.status === 'PACKING' && (
                          <button 
                            onClick={() => handleTransition(order.id, 'READY_FOR_DELIVERY')}
                            className="btn btn-primary"
                            style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                          >
                            <Clock size={16} /> Mark Ready for delivery boy
                          </button>
                        )}

                        {order.status === 'READY_FOR_DELIVERY' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.8rem' }}>Set delivery ETA *</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                value={deliveryEta} 
                                onChange={(e) => setDeliveryEta(e.target.value)} 
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              />
                            </div>
                            <button 
                              onClick={() => handleTransition(order.id, 'OUT_FOR_DELIVERY')}
                              className="btn btn-primary"
                              style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                            >
                              <Truck size={16} /> Send Out with Delivery Boy
                            </button>
                          </div>
                        )}

                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input 
                                type="checkbox" 
                                id={`cod_confirm_${order.id}`} 
                                checked={codReceived} 
                                onChange={(e) => setCodReceived(e.target.checked)} 
                                style={{ width: '16px', height: '16px' }}
                              />
                              <label htmlFor={`cod_confirm_${order.id}`} style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                                Confirm Cash Received (₹{parseFloat(order.total_amount).toFixed(2)})
                              </label>
                            </div>
                            <button 
                              onClick={() => handleTransition(order.id, 'DELIVERED')}
                              className="btn btn-primary"
                              disabled={!codReceived}
                              style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.85rem' }}
                            >
                              <CheckCircle size={16} /> Complete Delivery
                            </button>
                          </div>
                        )}

                        {['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.status) && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            No further transition actions available for this terminal status.
                          </span>
                        )}
                      </div>
                    </div>

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
