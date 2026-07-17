import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ArrowUpRight, ArrowDownRight, RefreshCw, Trophy, Star } from 'lucide-react';

export default function LoyaltyDashboard() {
  const { token } = useAuth();
  
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoyaltyData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:8000/api/loyalty/', { headers });
      if (res.ok) {
        const data = await res.json();
        setLoyaltyAccount(data);
      } else {
        setError('Failed to fetch loyalty account details.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLoyaltyData();
    }
  }, [token]);

  // Determine next tier and progress
  const getTierProgress = (lifetimePoints, currentTier) => {
    let nextTier = 'SILVER';
    let targetPoints = 500;
    let minPoints = 0;

    if (currentTier === 'SILVER') {
      nextTier = 'GOLD';
      targetPoints = 1500;
      minPoints = 500;
    } else if (currentTier === 'GOLD') {
      nextTier = 'PLATINUM';
      targetPoints = 5000;
      minPoints = 1500;
    } else if (currentTier === 'PLATINUM') {
      return { percentage: 100, nextTier: 'MAX TIER', pointsNeeded: 0 };
    }

    const range = targetPoints - minPoints;
    const earnedInRange = lifetimePoints - minPoints;
    const percentage = Math.min(Math.max((earnedInRange / range) * 100, 0), 100);
    const pointsNeeded = Math.max(targetPoints - lifetimePoints, 0);

    return { percentage, nextTier, pointsNeeded };
  };

  if (loading && !loyaltyAccount) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span>Loading rewards data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container animate-fadein" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Rewards Offline</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{error}</p>
      </div>
    );
  }

  const { percentage, nextTier, pointsNeeded } = loyaltyAccount 
    ? getTierProgress(loyaltyAccount.lifetime_points, loyaltyAccount.tier)
    : { percentage: 0, nextTier: 'SILVER', pointsNeeded: 500 };

  return (
    <div className="container animate-fadein" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Loyalty Rewards
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Shop. Earn Points. Unlock discount perks.</p>
        </div>
        <button onClick={fetchLoyaltyData} className="btn-icon" title="Refresh Points">
          <RefreshCw size={18} />
        </button>
      </div>

      {loyaltyAccount && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Main Points Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white',
            padding: '32px',
            boxShadow: 'var(--shadow-glow)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              opacity: 0.1,
              transform: 'rotate(15deg)'
            }}>
              <Trophy size={180} />
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Star size={16} /> {loyaltyAccount.tier_name} MEMBER
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Active Points Balance</span>
                  <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1, margin: '4px 0 0 0' }}>
                    {loyaltyAccount.balance}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>LIFETIME ACCRUED</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{loyaltyAccount.lifetime_points} pts</div>
                </div>
              </div>

              {/* Progress bar to next tier */}
              {nextTier !== 'MAX TIER' && (
                <div style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                    <span>Progress to {nextTier} Tier</span>
                    <span>{pointsNeeded} points needed</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '9999px', transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reward milestones info card */}
          <div className="card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Redeemable Milestones</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REDEEM 500 PTS</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', margin: '4px 0', color: 'var(--success)' }}>₹25 Off</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>On checkout total</span>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REDEEM 1,000 PTS</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', margin: '4px 0', color: 'var(--success)' }}>₹60 Off</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>On checkout total</span>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>REDEEM 2,000 PTS</span>
                <strong style={{ fontSize: '1.25rem', display: 'block', margin: '4px 0', color: 'var(--success)' }}>₹150 Off</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>On checkout total</span>
              </div>
            </div>
          </div>

          {/* Transaction Ledger list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Rewards History Log</h3>
            </div>

            {loyaltyAccount.transactions && loyaltyAccount.transactions.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'hsl(220, 20%, 98%)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 24px' }}>Points Change</th>
                    <th style={{ padding: '12px 24px' }}>Action Type</th>
                    <th style={{ padding: '12px 24px' }}>Notes / Order ID</th>
                    <th style={{ padding: '12px 24px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loyaltyAccount.transactions.map((tx) => {
                    const isPositive = tx.points >= 0;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 24px' }}>
                          <strong style={{
                            color: isPositive ? 'var(--success)' : 'var(--danger)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {isPositive ? `+${tx.points}` : tx.points}
                          </strong>
                        </td>
                        <td style={{ padding: '12px 24px' }}>
                          <span className={`badge ${tx.transaction_type === 'EARN' ? 'badge-success' : tx.transaction_type === 'REFUND' ? 'badge-primary' : 'badge-danger'}`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>
                          {tx.notes} {tx.order_id && `(Order #${tx.order_id})`}
                        </td>
                        <td style={{ padding: '12px 24px', color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No points transactions registered. Start shopping to earn points!
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
