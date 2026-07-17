import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, ShieldCheck } from 'lucide-react';

export const AuthModal = () => {
  const { loginModalOpen, closeLoginModal, signup, verifySignup, resendOtp, login } = useAuth();
  
  // Tabs: 'login' | 'signup' | 'verify'
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // OTP Verification fields
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!loginModalOpen) return null;

  // Handles email + password login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await login(loginEmail, loginPassword);
      // Success: clean fields
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      if (err.message === 'verification_incomplete') {
        // Redirect to OTP verification screen for unverified accounts
        setVerificationEmail(err.email);
        setActiveTab('verify');
        setTimer(60);
        setSuccessMsg('Your registration email is unverified. Verification code sent! Check server console log.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handles name + email + password sign up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword || !signupConfirmPassword) {
      setError('Please fill in all account fields.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await signup(signupName, signupEmail, signupPassword, signupConfirmPassword);
      // Cache verification target
      setVerificationEmail(signupEmail);
      setActiveTab('verify');
      setTimer(60);
      setSuccessMsg('Verification OTP dispatched! Check server console log.');
      
      // Clear signup fields
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handles verification code verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifySignup(verificationEmail, otpCode);
      setOtpCode('');
      setVerificationEmail('');
      setActiveTab('login');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handles resending OTP verification code
  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await resendOtp(verificationEmail);
      setTimer(60);
      setSuccessMsg('New verification code dispatched! Check server console log.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForms = () => {
    setActiveTab('login');
    setOtpCode('');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn var(--transition-fast) forwards'
    }}>
      <div className="card animate-scalein" style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        padding: '32px'
      }}>
        {/* Close Button */}
        <button 
          onClick={closeLoginModal} 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        {/* Tab Headers (only if not verifying) */}
        {activeTab !== 'verify' ? (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
            <button
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'login' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'login' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'signup' ? '2px solid var(--primary)' : 'none',
                color: activeTab === 'signup' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'signup' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: '50%',
              marginBottom: '12px'
            }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Confirm Email Address
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Verification code was sent to: <strong>{verificationEmail}</strong>
            </p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            borderLeft: '4px solid var(--danger)'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            borderLeft: '4px solid var(--success)'
          }}>
            {successMsg}
          </div>
        )}

        {/* Tab Content: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@email.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Tab Content: SIGNUP */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe" 
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@email.com" 
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '15px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    style={{ paddingLeft: '32px', width: '100%', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '10px', top: '15px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '32px', width: '100%', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Sending code...' : 'Register Account'}
            </button>
          </form>
        )}

        {/* Tab Content: VERIFICATION OTP CODE */}
        {activeTab === 'verify' && (
          <form onSubmit={handleVerifySubmit}>
            <div className="form-group">
              <label className="form-label">6-Digit Verification Code</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  maxLength={6}
                  className="form-input" 
                  placeholder="000000" 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ paddingLeft: '40px', letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold', width: '100%' }}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-success" 
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Confirm Verification'}
            </button>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '16px',
              fontSize: '0.875rem' 
            }}>
              <button 
                type="button" 
                onClick={handleBackToForms} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              >
                Go back to login
              </button>
              
              <button 
                type="button" 
                onClick={handleResendOtp} 
                disabled={timer > 0 || loading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: timer > 0 ? 'var(--text-muted)' : 'var(--primary)', 
                  cursor: timer > 0 ? 'default' : 'pointer',
                  fontWeight: 500
                }}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
