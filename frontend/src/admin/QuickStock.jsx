import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PackagePlus, History, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function QuickStock() {
  const { token } = useAuth();
  
  const [records, setRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [qtyChange, setQtyChange] = useState('');
  const [txType, setTxType] = useState('RECEIVED');
  const [txNotes, setTxNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const recRes = await fetch('http://localhost:8000/api/inventory/records/', { headers });
      const txRes = await fetch('http://localhost:8000/api/inventory/transactions/', { headers });

      if (recRes.ok && txRes.ok) {
        const recData = await recRes.json();
        const txData = await txRes.json();
        setRecords(recData);
        setTransactions(txData);
      } else {
        setError('Failed to load inventory logs.');
      }
    } catch (e) {
      console.error(e);
      setError('Network communication error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedVariantId || !qtyChange) {
      setError('Please select a product variant and input quantity change.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Ensure negative values are sent correctly depending on user inputs
    const changeAmount = txType === 'RECEIVED' ? Math.abs(parseInt(qtyChange)) : -Math.abs(parseInt(qtyChange));

    const payload = {
      variant_id: parseInt(selectedVariantId),
      quantity_change: changeAmount,
      transaction_type: txType,
      notes: txNotes
    };

    try {
      const res = await fetch('http://localhost:8000/api/inventory/records/adjust/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess('Inventory transaction successfully written to the database!');
        setQtyChange('');
        setTxNotes('');
        setSelectedVariantId('');
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to update stock. Negative stock levels are rejected.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Find count of low stock items
  const lowStockCount = records.filter(r => r.current_stock <= r.low_stock_threshold).length;

  return (
    <div className="animate-fadein">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800 }}>Stock & Inventory Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track stock levels, warn of low levels, and record stock receipts.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', borderLeft: '4px solid var(--danger)' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '16px', borderLeft: '4px solid var(--success)' }}>
          {success}
        </div>
      )}

      {/* Summary widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ backgroundColor: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <PackagePlus size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total SKUs Tracked</span>
            <strong style={{ fontSize: '1.5rem', fontWeight: 700 }}>{records.length}</strong>
          </div>
        </div>

        <div className="card" style={{ 
          backgroundColor: lowStockCount > 0 ? 'hsl(38, 92%, 96%)' : 'var(--surface)', 
          border: lowStockCount > 0 ? '1px solid hsl(38, 92%, 80%)' : '1px solid var(--border)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          padding: '20px' 
        }}>
          <div style={{ 
            padding: '12px', 
            backgroundColor: lowStockCount > 0 ? 'var(--warning)' : 'var(--success-light)', 
            color: lowStockCount > 0 ? 'white' : 'var(--success)', 
            borderRadius: 'var(--radius-md)' 
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Low Stock Warnings</span>
            <strong style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStockCount > 0 ? 'hsl(38, 92%, 35%)' : 'inherit' }}>{lowStockCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        {/* Left Column: Live Stock Ledger Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Warehouse Stock Levels</h3>
          </div>
          {loading && records.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 24px' }}>SKU</th>
                  <th style={{ padding: '12px 24px' }}>Product</th>
                  <th style={{ padding: '12px 24px' }}>Variant</th>
                  <th style={{ padding: '12px 24px' }}>Current Stock</th>
                  <th style={{ padding: '12px 24px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const isOutOfStock = rec.current_stock === 0;
                  const isLowStock = rec.current_stock <= rec.low_stock_threshold;
                  return (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 24px' }}><strong>{rec.sku}</strong></td>
                      <td style={{ padding: '12px 24px' }}>{rec.product_name}</td>
                      <td style={{ padding: '12px 24px' }}>{rec.variant_name}</td>
                      <td style={{ padding: '12px 24px' }}><strong>{rec.current_stock}</strong></td>
                      <td style={{ padding: '12px 24px' }}>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Adjust Stock Drawer Form */}
        <aside className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <PackagePlus size={18} style={{ color: 'var(--primary)' }} /> Log Stock Action
          </h3>

          <form onSubmit={handleAdjustStock}>
            <div className="form-group">
              <label className="form-label">Select Variant *</label>
              <select 
                className="form-input" 
                value={selectedVariantId} 
                onChange={(e) => setSelectedVariantId(e.target.value)}
                required
              >
                <option value="">Choose item...</option>
                {records.map(r => (
                  <option key={r.id} value={r.variant}>
                    [{r.sku}] {r.product_name} ({r.variant_name})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Action Type *</label>
                <select 
                  className="form-input" 
                  value={txType} 
                  onChange={(e) => setTxType(e.target.value)}
                  required
                >
                  <option value="RECEIVED">Receive Stock</option>
                  <option value="CORRECTION">Correction/Deduct</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-input" 
                  placeholder="e.g. 50" 
                  value={qtyChange} 
                  onChange={(e) => setQtyChange(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Shipment #254" 
                value={txNotes} 
                onChange={(e) => setTxNotes(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
              Commit Adjustment
            </button>
          </form>
        </aside>
      </div>

      {/* Transaction History Log Section */}
      <div className="card" style={{ marginTop: '32px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Historical Audit Logs</h3>
        </div>
        {loading && transactions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 24px' }}>SKU</th>
                <th style={{ padding: '12px 24px' }}>Product</th>
                <th style={{ padding: '12px 24px' }}>Adjustment</th>
                <th style={{ padding: '12px 24px' }}>Transaction Type</th>
                <th style={{ padding: '12px 24px' }}>Notes</th>
                <th style={{ padding: '12px 24px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isPositive = tx.quantity_change >= 0;
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 24px' }}><strong>{tx.sku}</strong></td>
                    <td style={{ padding: '12px 24px' }}>{tx.product_name} ({tx.variant_name})</td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ 
                        color: isPositive ? 'var(--success)' : 'var(--danger)', 
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isPositive ? `+${tx.quantity_change}` : tx.quantity_change}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px' }}>
                      <span className={`badge ${tx.transaction_type === 'RECEIVED' ? 'badge-success' : tx.transaction_type === 'SOLD' ? 'badge-primary' : 'badge-warning'}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{tx.notes || '--'}</td>
                    <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>
                      {new Date(tx.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
