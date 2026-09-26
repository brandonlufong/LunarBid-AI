import axios from 'axios';

// Set VITE_API_URL at build time (for example https://api.lunarbid.ai/api).
// In development the Vite proxy forwards /api to the local backend.
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Session ended (expired, revoked by "sign out everywhere"/password change, or invalid):
// clear it and send the user to sign in with an explanation, instead of failing silently.
const SESSION_CODES = ['session_expired', 'session_revoked', 'session_invalid', 'no_session'];
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code;
    if (error.response?.status === 401 && SESSION_CODES.includes(code) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      const reason = code === 'session_revoked' ? 'revoked' : 'expired';
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?session=${reason}`);
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const getAuthProviders = () => api.get('/auth/providers');
export const OAUTH_URL = (provider) => `${API_URL}/auth/${provider}`;
export const exchangeOAuthCode = (code) => api.post('/auth/oauth/exchange', { code });

// Profile APIs
export const updateProfile = (data) => api.put('/profile', data);
export const getProfile = () => api.get('/profile');

// Proposal APIs
export const generateProposal = (data) => api.post('/proposals/generate', data);
export const analyzeJob = (data) => api.post('/proposals/analyze', data);
// 20 per page, newest first; pass the previous response's nextCursor for the next page.
export const getProposalHistory = (cursor) => api.get('/proposals/history', { params: cursor ? { cursor } : {} });
export const getProposal = (id) => api.get(`/proposals/${id}`);
export const deleteProposal = (id) => api.delete(`/proposals/${id}`);
export const updateProposal = (id, data) => api.put(`/proposals/${id}`, data);
export const sendProposal = (id, data) => api.post(`/proposals/${id}/send`, data);
export const shareProposal = (id) => api.post(`/proposals/${id}/share`);
export const unshareProposal = (id) => api.post(`/proposals/${id}/unshare`);
export const getPublicProposal = (token) => api.get(`/proposals/public/${token}`);

// NEW: Subscription endpoints
export const getSubscription = () => api.get('/subscription');
// Billing: both return { url } to redirect to (Stripe Checkout or the Customer Portal).
export const createCheckout = (plan) => api.post('/subscription/checkout', { plan });
export const openBillingPortal = () => api.post('/subscription/portal');
export const upgradePlan = createCheckout; // kept for older imports
export const cancelSubscription = () => api.post('/subscription/cancel');

// Client Profiles
export const getClientProfiles = () => api.get('/client-profiles');
export const createClientProfile = (data) => api.post('/client-profiles', data);
export const updateClientProfile = (id, data) => api.put(`/client-profiles/${id}`, data);
export const deleteClientProfile = (id) => api.delete(`/client-profiles/${id}`);
export const toggleFavoriteProfile = (id) => api.patch(`/client-profiles/${id}/favorite`);

// Analytics
export const getAnalyticsDashboard = (params) => api.get('/analytics/dashboard', { params });
export const getWinRate = (params) => api.get('/analytics/win-rate', { params });
export const getIndustryPerformance = () => api.get('/analytics/industry-performance');
export const exportAnalytics = (params) => api.get('/analytics/export', { params, responseType: 'blob' });

// Branding
export const getBranding = () => api.get('/branding');
export const updateBranding = (data) => api.put('/branding', data);
export const uploadLogo = (formData) => api.post('/branding/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteLogo = () => api.delete('/branding/logo');
export const resetBranding = () => api.post('/branding/reset');

export default api;
// Account data: export everything, or delete the account.
export const exportAccountData = () => api.get('/account/export');
export const deleteAccount = (confirmation) => api.delete('/account', { data: confirmation });

// Sessions, password and email confirmation
export const refreshSession = () => api.post('/auth/refresh');
export const logoutAllDevices = () => api.post('/auth/logout-all');
export const changePassword = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword });
export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const resendVerification = () => api.post('/auth/resend-verification');
