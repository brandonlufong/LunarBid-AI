import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, refreshSession } from '../services/api';

// Sessions last 7 days. Renew quietly once the current token is more than a day old,
// so active users stay signed in and idle sessions still expire.
function tokenAgeHours() {
  try {
    const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return (Date.now() / 1000 - payload.iat) / 3600;
  } catch {
    return 0;
  }
}
function renewIfOld() {
  if (tokenAgeHours() < 24) return;
  refreshSession()
    .then((res) => localStorage.setItem('token', res.data.token))
    .catch(() => {});
}

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Only wait for the session check when there is a token to check.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    getCurrentUser()
      .then((response) => {
        setUser(response.data);
        renewIfOld();
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser }}>
        {children}
    </AuthContext.Provider>
  );
};