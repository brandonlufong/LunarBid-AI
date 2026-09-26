import React, { useState } from 'react';
import { login, OAUTH_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { LogIn, Loader2, Moon, Sparkles, Mail, Lock, Chrome, Github, Shield, Zap, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import DarkModeToggle from '../DarkModeToggle';
import LanguageSelector from '../UI/LanguageSelector';

const Login = ({ onSwitch }) => {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get('error');
    if (e === 'oauth_unconfigured') return t('auth.oauth.unconfigured', { provider: (p.get('provider') || 'OAuth').replace(/^./, (c) => c.toUpperCase()) });
    if (e === 'oauth_unverified_email') return t('auth.oauth.unverified');
    if (e === 'oauth_failed' || e === 'oauth_no_email') return t('auth.oauth.failed');
    const session = p.get('session');
    if (session === 'revoked') return t('auth.login.sessionRevoked');
    if (session === 'expired') return t('auth.login.sessionExpired');
    return '';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      loginUser(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen overflow-hidden relative transition-colors duration-500 ${
      darkMode
        ? 'bg-[#0b1020]'
        : 'bg-gradient-to-br from-white via-indigo-50/60 to-white'
    }`}>

      {/* Top-right controls (navbar is hidden on auth pages) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <LanguageSelector />
        <DarkModeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-brand-500/25 rounded-full blur-3xl top-20 left-1/4"
          animate={{ 
            x: [0, 100, -100, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-violet-600/20 rounded-full blur-3xl bottom-20 right-1/4"
          animate={{ 
            x: [0, -80, 80, 0],
            y: [0, 60, -60, 0],
            scale: [1, 0.8, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-accent-400/15 rounded-full blur-3xl top-1/2 right-1/3"
          animate={{ 
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Floating geometric shapes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 border-2 border-white/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%'
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            
            {/* LEFT SIDE - Marketing Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block space-y-8 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 p-10 shadow-2xl shadow-brand-900/40"
            >
              {/* Logo & Title */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <Moon className="w-16 h-16 text-white drop-shadow-lg" />
                  <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white">LunarBid</h1>
                  <p className="text-indigo-200 font-medium">AI-Powered Proposals</p>
                </div>
              </div>

              {/* Main Headline */}
              <div>
                <h2 className="text-5xl font-black text-white mb-4 leading-tight">
                  {t('auth.side.loginHeading1')}
                  <span className="block bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {t('auth.side.loginHeading2')}
                  </span>
                </h2>
                <p className="text-xl text-indigo-200">
                  {t('auth.side.loginSubtitle')}
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-4">
                {[Zap, Award, TrendingUp, Shield].map((Icon, i) => {
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white font-medium text-lg">{t('auth.side.features')[i]}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                {[
                  { value: '5', label: t('auth.side.statUsers') },
                  { value: '4', label: t('auth.side.statProposals') },
                  { value: '2', label: t('auth.side.statRating') }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-indigo-200">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT SIDE - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full"
            >
              <div className={`p-10 backdrop-blur-xl rounded-3xl shadow-2xl border-2 transition-colors duration-500 ${
                darkMode 
                  ? 'bg-slate-900/95 border-indigo-900' 
                  : 'bg-white/95 border-indigo-100'
              }`}>
                
                {/* Mobile Logo (only shows on mobile) */}
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                    <Moon className="w-12 h-12 text-white" />
                    <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className={`text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 ${
                    darkMode ? '' : ''
                  }`}>
                    {t('auth.login.title')}
                  </h2>
                  <p className={`font-medium ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {t('auth.login.subtitle')}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2"
                  >
                    <span className="flex-shrink-0">⚠️</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Login Form */}
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="login-field-1" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {t('auth.login.email')}
                    </label>
                    <input id="login-field-1"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-medium shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600"
                      placeholder={t('auth.login.emailPlaceholder')}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="login-field-2" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      {t('auth.login.password')}
                    </label>
                    <input id="login-field-2"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-medium shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600"
                      placeholder={t('auth.login.passwordPlaceholder')}
                    />
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right">
                    <button type="button" onClick={() => { window.location.href = '/forgot-password'; }} className="text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                      {t('auth.login.forgotPassword')}
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{t('auth.login.signingIn')}</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-6 h-6" />
                        <span>{t('auth.login.signIn')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                      {t('auth.login.orContinueWith')}
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => { window.location.href = OAUTH_URL('google'); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-700 dark:text-slate-200">
                    <Chrome className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('auth.login.google')}</span>
                  </button>
                  <button type="button" onClick={() => { window.location.href = OAUTH_URL('github'); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-700 dark:text-slate-200">
                    <Github className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('auth.login.github')}</span>
                  </button>
                </div>

                {/* Switch to Register */}
                <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {t('auth.login.noAccount')}{' '}
                    <button
                      onClick={onSwitch}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline decoration-2 underline-offset-2"
                    >
                      {t('auth.login.signUp')}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;