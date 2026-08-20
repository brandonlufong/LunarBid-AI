import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Moon, Zap, Target, Clock, Users, TrendingUp, Award, Shield, ArrowRight, Star, Crown, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import LanguageSelector from './UI/LanguageSelector';
import DarkModeToggle from './DarkModeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { darkMode } = useTheme();

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-500 ${
      darkMode
        ? 'bg-[#0b1020] text-slate-100'
        : 'bg-gradient-to-b from-white via-indigo-50/50 to-white text-slate-900'
    }`}>

      {/* NAVIGATION */}
      <nav className={`fixed top-0 w-full backdrop-blur-xl border-b z-50 transition-colors duration-500 ${
        darkMode
          ? 'bg-[#0b1020]/70 border-white/10'
          : 'bg-white/70 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-4 h-4 text-accent-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>LunarBid</h1>
              <p className={`hidden sm:block text-xs font-medium ${darkMode ? 'text-brand-300' : 'text-brand-600'}`}>{t('landing.footer.tagline')}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <LanguageSelector />
            <DarkModeToggle />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              className={`hidden sm:block px-5 py-2.5 font-semibold rounded-xl transition-colors ${
                darkMode ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-brand-700'
              }`}
            >
              {t('landing.hero.login')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="px-4 sm:px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm sm:text-base leading-tight shadow-lg shadow-brand-600/25 transition-all"
            >
              {t('landing.hero.cta')}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-32 pb-24 overflow-hidden">
        {/* Animated background orbs */}
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
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block mb-6"
          >
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-sm font-semibold backdrop-blur-sm ${
              darkMode
                ? 'bg-brand-500/10 border-brand-400/30 text-brand-100'
                : 'bg-brand-50 border-brand-200 text-brand-700'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              {t('landing.hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            {t('landing.hero.title1')}
            <br />
            <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-accent-400 bg-clip-text text-transparent">
              {t('landing.hero.title2')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-medium ${
              darkMode ? 'text-indigo-100' : 'text-slate-700'
            }`}
          >
            {t('landing.hero.subtitleA')}<strong className={`font-black ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>{t('landing.hero.subtitleStrong')}</strong>{t('landing.hero.subtitleB')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-600/30 hover:shadow-brand-600/50 transition-all duration-300 flex items-center gap-2"
            >
              {t('landing.hero.startTrial')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 backdrop-blur-sm border-2 rounded-2xl font-bold text-lg transition-all duration-300 ${
                darkMode
                  ? 'bg-white/5 border-white/15 text-white hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {t('landing.hero.watchDemo')}
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: '10K+', label: t('landing.hero.statUsers') },
              { value: '500K+', label: t('landing.hero.statProposals') },
              { value: '4.9/5', label: t('landing.hero.statRating') }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-3xl md:text-4xl font-black mb-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>{stat.value}</div>
                <div className={`text-sm font-medium ${
                  darkMode ? 'text-indigo-200' : 'text-slate-600'
                }`}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className={`px-6 py-24 border-y transition-colors duration-500 ${
        darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className={`text-4xl md:text-5xl font-black text-center mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t('landing.problem.title')}
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className={`text-xl text-center mb-12 max-w-2xl mx-auto ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t('landing.problem.subtitle')}
            </motion.p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Clock, color: 'from-red-500 to-orange-500' },
                { icon: Target, color: 'from-orange-500 to-yellow-500' },
                { icon: Users, color: 'from-yellow-500 to-green-500' },
                { icon: TrendingUp, color: 'from-green-500 to-blue-500' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`p-6 border rounded-2xl transition-all duration-300 group ${
                      darkMode
                        ? 'bg-white/5 border-white/10 hover:border-brand-400/40'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t('landing.problem.items')[i]}</p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              variants={fadeInUp}
              className={`mt-12 text-center p-8 rounded-2xl border-2 transition-colors duration-500 ${
                darkMode
                  ? 'bg-gradient-to-r from-brand-600/15 to-violet-600/15 border-brand-400/30'
                  : 'bg-gradient-to-r from-brand-50 to-violet-50 border-brand-200'
              }`}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>{t('landing.problem.solveTitle')}</h3>
              <p className={`text-lg ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>{t('landing.problem.solveText')}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-black text-center mb-16"
            >
              {t('landing.how.title')}
            </motion.h2>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', icon: '📋' },
                { step: '02', icon: '🎯' },
                { step: '03', icon: '✨' },
                { step: '04', icon: '🚀' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="relative text-center group"
                >
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black ${
                    darkMode ? 'text-white/10' : 'text-slate-900/10'
                  }`}>
                    {item.step}
                  </div>
                  <div className={`p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                    darkMode
                      ? 'bg-white/5 border-white/10 hover:border-brand-400/40'
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300'
                  }`}>
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <h3 className={`text-xl font-bold mb-3 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{t('landing.how.steps')[i].title}</h3>
                    <p className={`text-sm leading-relaxed ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>{t('landing.how.steps')[i].desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-brand-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={`px-6 py-24 border-y transition-colors duration-500 ${
        darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-black text-center mb-6"
            >
              {t('landing.features.title')}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className={`text-xl text-center mb-12 font-medium ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {t('landing.features.subtitle')}
            </motion.p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Sparkles }, { icon: Target }, { icon: Zap },
                { icon: Users }, { icon: Award }, { icon: Shield }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`p-6 border rounded-2xl transition-all duration-300 group ${
                      darkMode
                        ? 'bg-white/5 border-white/10 hover:border-brand-400/40'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300'
                    }`}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-brand-600 to-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand-600/20">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>{t('landing.features.items')[i].title}</h3>
                    <p className={`${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>{t('landing.features.items')[i].desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-black text-center mb-6"
            >
              {t('landing.pricing.title')}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className={`text-xl text-center mb-12 font-medium ${
                darkMode ? 'text-indigo-100' : 'text-slate-500'
              }`}
            >
              {t('landing.pricing.subtitle')}
            </motion.p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { id: 'free', name: 'Free', price: '$0', popular: false, icon: Zap, color: 'from-gray-500 to-gray-600', cta: t('landing.pricing.ctaFree') },
                { id: 'starter', name: 'Starter', price: '$12', popular: false, icon: TrendingUp, color: 'from-blue-500 to-indigo-600', cta: t('landing.pricing.ctaTrial') },
                { id: 'pro', name: 'Pro', price: '$19', popular: true, icon: Crown, color: 'from-purple-500 to-pink-600', cta: t('landing.pricing.ctaTrial') },
                { id: 'agency', name: 'Agency', price: '$49', popular: false, icon: Building2, color: 'from-emerald-500 to-teal-600', cta: t('landing.pricing.ctaSales') }
              ].map((plan, i) => {
                const planFeatures = t('landing.pricing.features')[plan.id];
                const planPeriod = plan.id === 'free' ? t('landing.pricing.forever') : t('landing.pricing.perMonth');
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-yellow-400 scale-105 shadow-2xl' 
                        : darkMode
                          ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                          : 'bg-white border-slate-200 shadow-lg hover:shadow-xl hover:bg-slate-50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold text-sm rounded-full">
                        {t('landing.pricing.mostPopular')}
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span className={`ml-2 ${
                        darkMode ? 'text-indigo-200' : 'text-slate-600'
                      }`}>/{planPeriod}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {planFeatures.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className={`text-sm ${
                            darkMode ? 'text-slate-200' : 'text-slate-700'
                          }`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/register')}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        plan.popular
                          ? 'bg-white text-indigo-600 hover:bg-gray-100'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {plan.cta}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={`px-6 py-24 border-y transition-colors duration-500 ${
        darkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center mb-16"
          >
            {t('landing.testimonials.title')}
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson' },
              { name: 'Mike Chen' },
              { name: 'Emma Davis' }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 border rounded-2xl transition-colors ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <p className={`text-lg mb-4 italic ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>"{t('landing.testimonials.items')[i].text}"</p>
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{testimonial.name}</div>
                  <div className={`text-sm ${darkMode ? 'text-brand-300' : 'text-brand-600'}`}>{t('landing.testimonials.items')[i].role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-brand-600 via-violet-600 to-brand-700 rounded-3xl shadow-2xl shadow-brand-600/30"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-xl mb-8 text-brand-100">
            {t('landing.finalCta.subtitle')}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 transition-all shadow-xl text-lg"
            >
              {t('landing.finalCta.button')}
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Moon className="w-8 h-8 text-white" />
              <div>
                <div className="font-bold text-lg">LunarBid</div>
                <div className="text-sm text-indigo-200">{t('landing.footer.tagline')}</div>
              </div>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-indigo-400 transition-colors">{t('landing.footer.privacy')}</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">{t('landing.footer.terms')}</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">{t('landing.footer.contact')}</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-indigo-200">
            {t('landing.footer.rights', { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;