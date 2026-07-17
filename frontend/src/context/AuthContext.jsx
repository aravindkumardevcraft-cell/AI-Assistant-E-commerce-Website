import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authCallback, setAuthCallback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token and role to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', isAdmin.toString());
      if (!user) {
        setUser({
          email: localStorage.getItem('userEmail') || 'user@example.com',
          name: localStorage.getItem('userName') || '',
        });
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [token, isAdmin]);

  // Request OTP code for a new customer signup
  const signup = async (name, email, password, confirmPassword) => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirm_password: confirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register account.');
      }
      return data;
    } catch (err) {
      console.error('Error in signup:', err);
      throw err;
    }
  };

  // Verify OTP for new customer signup and log in automatically
  const verifySignup = async (email, code) => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts/signup/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid OTP code.');
      }

      // Login customer
      setToken(data.token);
      setIsAdmin(data.is_staff);
      setUser({ email: data.email, name: data.name });
      localStorage.setItem('userEmail', data.email || '');
      localStorage.setItem('userName', data.name || '');

      setLoginModalOpen(false);

      // Execute callback to resume pending Add to Cart / Buy Now actions
      if (authCallback) {
        authCallback(data);
        setAuthCallback(null);
      }
      return data;
    } catch (err) {
      console.error('Error in verifySignup:', err);
      throw err;
    }
  };

  // Resend OTP for unverified accounts
  const resendOtp = async (email) => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts/signup/resend/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend verification code.');
      }
      return data;
    } catch (err) {
      console.error('Error in resendOtp:', err);
      throw err;
    }
  };

  // Standard customer login using email and password (no OTP)
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Intercept unverified account status to trigger verification modal
        if (data.detail === 'verification_incomplete') {
          const customError = new Error('verification_incomplete');
          customError.email = email;
          throw customError;
        }
        throw new Error(data.detail || 'Invalid email or password.');
      }

      setToken(data.token);
      setIsAdmin(data.is_staff);
      setUser({ email: data.email, name: data.name });
      localStorage.setItem('userEmail', data.email || '');
      localStorage.setItem('userName', data.name || '');

      setLoginModalOpen(false);

      // Execute callback to resume pending actions
      if (authCallback) {
        authCallback(data);
        setAuthCallback(null);
      }
      return data;
    } catch (err) {
      console.error('Error in login:', err);
      throw err;
    }
  };

  // Dedicated Admin Login using credentials
  const adminLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts/admin/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json(); // { token, email, is_staff: true }
      if (!data.is_staff) {
        throw new Error('Not authorized as administrator');
      }

      setToken(data.token);
      setIsAdmin(true);
      setUser({ email: data.email, name: 'Administrator' });
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', 'Administrator');
      return data;
    } catch (err) {
      console.error('Error in adminLogin:', err);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    setUser(null);
    setAuthCallback(null);
  };

  // Show login modal with optional callback to run on successful login
  const triggerLoginModal = (onSuccess) => {
    setAuthCallback(() => onSuccess);
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setAuthCallback(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAdmin,
      loading,
      loginModalOpen,
      signup,
      verifySignup,
      resendOtp,
      login,
      adminLogin,
      logout,
      triggerLoginModal,
      closeLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};
