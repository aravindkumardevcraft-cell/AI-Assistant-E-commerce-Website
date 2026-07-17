import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, HelpCircle, PackageX } from 'lucide-react';

export default function Analytics() {
  const { token } = useAuth();
  
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('http://localhost:8000/api/analytics/demand/', { headers });
        if (res.ok) {
          const data = await res.json();
          setQueries(data);
        } else {
          setError('Failed to load demand intelligence reports.');
        }
      } catch (err) {
        console.error(err);
        setError('Network failure.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <BarChart3 style={{ color: 'var(--primary)' }} /> Demand Intelligence Insights
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Understand client search queries that resulted in out-of-stock or catalog misses.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Intro info card */}
      <div style={{
        display: 'flex',
        gap: '16px',
        backgroundColor: 'var(--primary-light)',
        border: '1px solid hsl(220, 95%, 85%)',
        color: 'var(--text)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        marginBottom: '32px'
      }}>
        <HelpCircle size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div>
          <strong>How this works:</strong>
          <span style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            When customers use the Store search bar or ask the AI Shopping Assistant for brands or items that we do not have in stock, the system registers the query. Below is the ranked frequency index of items the owner should procure to capture unfulfilled store demand.
          </span>
        </div>
      </div>

      {/* Queries Ledger list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ranked Unfulfilled Searches</h3>
        </div>

        {loading && queries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading search statistics...</div>
        ) : queries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <PackageX size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p>No unfulfilled search queries logged yet.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 24px' }}>Rank</th>
                <th style={{ padding: '12px 24px' }}>Search Query String</th>
                <th style={{ padding: '12px 24px', textAlign: 'center' }}>Frequencies (Misses)</th>
                <th style={{ padding: '12px 24px' }}>Last Requested</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 24px' }}><strong>#{idx + 1}</strong></td>
                  <td style={{ padding: '12px 24px' }}><code style={{ backgroundColor: 'hsl(220, 10%, 94%)', padding: '3px 6px', borderRadius: '4px' }}>{q.query}</code></td>
                  <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                    <span className="badge badge-danger" style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                      {q.count}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>
                    {new Date(q.last_requested).toLocaleString('en-IN')}
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
