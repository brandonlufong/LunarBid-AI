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

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const getAuthProviders = () => api.get('/auth/providers');
export const OAUTH_URL = (provider) => `${API_URL}/auth/${provider}`;

// Profile APIs
export const updateProfile = (data) => api.put('/profile', data);
export const getProfile = () => api.get('/profile');

// Proposal APIs
export const generateProposal = (data) => api.post('/proposals/generate', data);
export const analyzeJob = (data) => api.post('/proposals/analyze', data);
export const getProposalHistory = () => api.get('/proposals/history');
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