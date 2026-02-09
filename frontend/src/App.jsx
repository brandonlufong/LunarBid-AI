// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import LandingPage from './components/LandingPage';
import { Loader2, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dark Mode Toggle Button Component
const DarkModeToggle = ({ theme, toggleTheme }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-white dark:bg-slate-800 shadow-2xl border-2 border-indigo-200 dark:border-indigo-600 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-300"
      title="Toggle Dark Mode"
    >
      {theme === 'light' ? (
        <Moon className="w-6 h-6 text-indigo-600" />
      ) : (
        <Sun className="w-6 h-6 text-yellow-400" />
      )}
    </motion.button>
  );
};

const AnimatedRoutes = ({ theme }) => {
  const { user } = useAuth();
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5 },
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <motion.div {...pageTransition}>
                <LandingPage theme={theme} />
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
                <Login onSwitch={() => window.location.href = '/register'} />
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
                <Register onSwitch={() => window.location.href = '/login'} />
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
                <Dashboard theme={theme} />
              </motion.div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all → redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  // Dark mode state
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, default to light
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900 transition-colors duration-500">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-white text-lg font-semibold">Loading LunarBid...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {/* Navbar - conditionally rendered based on route */}
      <Navbar />

      {/* Routes with animated transitions */}
      <AnimatedRoutes theme={theme} />

      {/* Floating Dark Mode Toggle - Available on all pages */}
      {/* <DarkModeToggle theme={theme} toggleTheme={toggleTheme} /> */}
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;