import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Award } from 'lucide-react';

export default function Customers() {
  const { token } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('http://localhost:8000/api/accounts/admin/customers/', { headers });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        } else {
          setError('Failed to fetch user directory.');
        }
      } catch (err) {
        console.error(err);
        setError('Network communication failure.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCustomers();
    }
  }, [token]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800 }}>Customer Directory</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inspect customer registrations, contacts, and loyalty accounts.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '32px', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search by name, email, phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '40px', width: '100%' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && customers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 24px' }}>Name / ID</th>
                <th style={{ padding: '12px 24px' }}>Email Address</th>
                <th style={{ padding: '12px 24px' }}>Phone Number</th>
                <th style={{ padding: '12px 24px' }}>Loyalty Balance</th>
                <th style={{ padding: '12px 24px' }}>Loyalty Tier</th>
                <th style={{ padding: '12px 24px' }}>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 24px' }}><strong>{c.name}</strong></td>
                  <td style={{ padding: '12px 24px' }}>{c.email}</td>
                  <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>{c.phone || '--'}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={14} /> {c.loyalty_balance}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px' }}>
                    <span className={`badge ${
                      c.loyalty_tier.includes('Platinum') ? 'badge-success' :
                      c.loyalty_tier.includes('Gold') ? 'badge-warning' :
                      c.loyalty_tier.includes('Silver') ? 'badge-primary' :
                      'badge-secondary'
                    }`}>
                      {c.loyalty_tier}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>
                    {new Date(c.date_joined).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
