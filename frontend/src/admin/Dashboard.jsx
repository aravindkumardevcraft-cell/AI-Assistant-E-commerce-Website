import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, ClipboardList, AlertTriangle, Users, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const statsRes = await fetch('http://localhost:8000/api/orders/admin-ops/stats/', { headers });
      const stockRes = await fetch('http://localhost:8000/api/inventory/records/', { headers });

      if (statsRes.ok && stockRes.ok) {
        const statsData = await statsRes.json();
        const stockData = await stockRes.json();
        setStats(statsData);
        // Filter low stock records in frontend
        setLowStockItems(stockData.filter(r => r.current_stock <= r.low_stock_threshold));
      } else {
        setError('Failed to load dashboard metrics.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection refused.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading && !stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span>Loading dashboard analytics...</span>
      </div>
    );
  }

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800 }}>Store Operations Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Welcome back, administrator. Here is your store metrics summary.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Main KPI Stats Cards Grid */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Revenue */}
          <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{stats.total_sales.toFixed(2)}</strong>
            </div>
          </div>

          {/* New Orders */}
          <Link to="/admin/orders?status=NEW" className="card card-hover" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
              <ClipboardList size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>New Orders</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.new_orders > 0 ? 'var(--primary)' : 'inherit' }}>
                {stats.new_orders}
              </strong>
            </div>
          </Link>

          {/* Active Backlogs */}
          <Link to="/admin/orders" className="card card-hover" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'hsl(194, 91%, 95%)', color: 'hsl(194, 91%, 35%)', borderRadius: 'var(--radius-md)' }}>
              <ClipboardList size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>In Operations</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.active_operations}</strong>
            </div>
          </Link>

          {/* Customers */}
          <Link to="/admin/customers" className="card card-hover" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'hsl(262, 89%, 95%)', color: 'hsl(262, 89%, 45%)', borderRadius: 'var(--radius-md)' }}>
              <Users size={28} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Customers</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.total_customers}</strong>
            </div>
          </Link>
        </div>
      )}

      {/* Low Stock Warning Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        
        {/* Warning Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} /> Inventory Shortfall Warnings
            </h3>
            <Link to="/admin/stock" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Replenish Stock <ArrowRight size={14} />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShieldAlert size={32} style={{ color: 'var(--success)', marginBottom: '8px' }} />
              <p>All warehouse stock levels are good. No items fall below safety limits.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 24px' }}>SKU</th>
                  <th style={{ padding: '12px 24px' }}>Product Variant</th>
                  <th style={{ padding: '12px 24px' }}>Stock Level</th>
                  <th style={{ padding: '12px 24px' }}>Threshold Limit</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 24px' }}><strong>{item.sku}</strong></td>
                    <td style={{ padding: '12px 24px' }}>{item.product_name} ({item.variant_name})</td>
                    <td style={{ padding: '12px 24px', color: 'var(--danger)', fontWeight: 700 }}>{item.current_stock}</td>
                    <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{item.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Operational Quick Links panel */}
        <aside className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Task Quick Shortcuts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/admin/orders?status=NEW" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.9rem' }}>
              <span>Process New Orders</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/admin/stock" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.9rem' }}>
              <span>Receive New Shipments</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/admin/products" className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '0.9rem' }}>
              <span>Add Items to Storefront</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </aside>

      </div>
    </div>
  );
}
