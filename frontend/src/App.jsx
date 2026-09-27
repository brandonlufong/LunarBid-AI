// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './locales/LanguageContext.jsx';
import { ToastProvider } from './components/UI/Toast';
import LandingPage from './components/LandingPage';
import { Loader2 } from 'lucide-react';

// The landing page ships in the main bundle for a fast first paint; everything else loads on demand.
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const PublicProposal = lazy(() => import('./components/PublicProposal'));
const LegalPage = lazy(() => import('./components/Legal/LegalPage'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));
const OAuthCallback = lazy(() => import('./components/Auth/OAuthCallback'));
const VerifyEmail = lazy(() => import('./components/Auth/VerifyEmail'));
const NotFound = lazy(() => import('./components/NotFound'));

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden="true" />
  </div>
);

const AnimatedRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();


  return (
    <>
      <Suspense fallback={<PageLoading />}>
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="animate-fade">
                <LandingPage />
              </div>
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="animate-fade">
                <Login onSwitch={() => (window.location.href = '/register')} />
              </div>
            )
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="animate-fade">
                <Register onSwitch={() => (window.location.href = '/login')} />
              </div>
            )
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <div className="animate-fade">
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Password reset + OAuth callback (public) */}
        <Route path="/forgot-password" element={<div className="animate-fade"><ForgotPassword /></div>} />
        <Route path="/reset-password" element={<div className="animate-fade"><ResetPassword /></div>} />
        <Route path="/oauth" element={<OAuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Public shared proposal (no auth) */}
        <Route
          path="/p/:token"
          element={
            <div className="animate-fade">
              <PublicProposal />
            </div>
          }
        />

        {/* Legal pages (public) */}
        <Route path="/terms" element={<div className="animate-fade"><LegalPage doc="terms" /></div>} />
        <Route path="/privacy" element={<div className="animate-fade"><LegalPage doc="privacy" /></div>} />
        <Route path="/refunds" element={<div className="animate-fade"><LegalPage doc="refunds" /></div>} />

        {/* Catch-all → redirect to landing */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-800 dark:text-white text-lg font-semibold">Loading LunarBid...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
};

function App() {
  return (
    <>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </>
  );
}

export default App;
