// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './locales/LanguageContext.jsx';
import { ToastProvider } from './components/UI/Toast';
import Navbar from './components/navbar';
import LandingPage from './components/LandingPage';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

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

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden="true" />
  </div>
);

const AnimatedRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 },
  };

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoading />}>
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <motion.div {...pageTransition}>
                <LandingPage />
              </motion.div>
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
              <motion.div {...pageTransition}>
                <Login onSwitch={() => (window.location.href = '/register')} />
              </motion.div>
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
              <motion.div {...pageTransition}>
                <Register onSwitch={() => (window.location.href = '/login')} />
              </motion.div>
            )
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <motion.div {...pageTransition}>
                <Dashboard />
              </motion.div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Password reset + OAuth callback (public) */}
        <Route path="/forgot-password" element={<motion.div {...pageTransition}><ForgotPassword /></motion.div>} />
        <Route path="/reset-password" element={<motion.div {...pageTransition}><ResetPassword /></motion.div>} />
        <Route path="/oauth" element={<OAuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Public shared proposal (no auth) */}
        <Route
          path="/p/:token"
          element={
            <motion.div {...pageTransition}>
              <PublicProposal />
            </motion.div>
          }
        />

        {/* Legal pages (public) */}
        <Route path="/terms" element={<motion.div {...pageTransition}><LegalPage doc="terms" /></motion.div>} />
        <Route path="/privacy" element={<motion.div {...pageTransition}><LegalPage doc="privacy" /></motion.div>} />
        <Route path="/refunds" element={<motion.div {...pageTransition}><LegalPage doc="refunds" /></motion.div>} />

        {/* Catch-all → redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AnimatePresence>
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
      <Navbar />
      <AnimatedRoutes />
    </Router>
  );
};

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}

export default App;
