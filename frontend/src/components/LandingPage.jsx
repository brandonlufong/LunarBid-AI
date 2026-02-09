import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Moon, Zap, Target, Clock, Users, TrendingUp, Award, Shield, ArrowRight, Star, Crown, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ theme }) => {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white overflow-hidden">

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl border-b border-indigo-500/30 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Moon className="w-10 h-10 text-white" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">LunarBid</h1>
              <p className="text-xs text-indigo-300">AI-Powered Proposals</p>
            </div>
          </div>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-white font-semibold hover:text-indigo-200 transition-colors"
            >
              Login
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-32 pb-24 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl top-20 left-1/4"
            animate={{ 
              x: [0, 100, -100, 0],
              y: [0, -50, 50, 0],
              scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-80 h-80 bg-purple-500/20 rounded-full blur-3xl bottom-20 right-1/4"
            animate={{ 
              x: [0, -80, 80, 0],
              y: [0, 60, -60, 0],
              scale: [1, 0.8, 1.2, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl top-1/2 right-1/3"
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
            <span className="px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-sm font-semibold backdrop-blur-sm">
              🚀 Trusted by 10,000+ Freelancers & Agencies
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            Win More Bids in
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Seconds, Not Hours
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-indigo-100 leading-relaxed"
          >
            LunarBid helps <strong className="text-white">freelancers and agencies</strong> create personalized, winning proposals using AI — faster, smarter, and tailored to every opportunity.
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
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
            >
              Watch Demo
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
              { value: '10K+', label: 'Active Users' },
              { value: '500K+', label: 'Proposals Generated' },
              { value: '4.9/5', label: 'User Rating' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-indigo-200">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="px-6 py-24 bg-slate-900/50 backdrop-blur-xl">
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
              The Proposal Problem
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-center text-indigo-200 mb-12 max-w-2xl mx-auto"
            >
              Whether you're a solo freelancer or running an agency, writing proposals shouldn't be your bottleneck.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Clock, text: 'Spending 2-3 hours per proposal kills productivity', color: 'from-red-500 to-orange-500' },
                { icon: Target, text: 'Generic templates do not win competitive bids', color: 'from-orange-500 to-yellow-500' },
                { icon: Users, text: 'Agency teams waste time on repetitive writing', color: 'from-yellow-500 to-green-500' },
                { icon: TrendingUp, text: 'Missing opportunities because writing takes too long', color: 'from-green-500 to-blue-500' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-lg font-semibold">{item.text}</p>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              variants={fadeInUp}
              className="mt-12 text-center p-8 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-2 border-indigo-400/30 rounded-2xl backdrop-blur-sm"
            >
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">LunarBid Solves This</h3>
              <p className="text-indigo-200 text-lg">Generate personalized, professional proposals in under 60 seconds</p>
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
              How It Works
            </motion.h2>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', icon: '📋', title: 'Paste Job Details', desc: 'Copy the job description from Upwork, Fiverr, or any platform' },
                { step: '02', icon: '🎯', title: 'Choose Your Style', desc: 'Select tone (formal, friendly, persuasive) and customize your profile' },
                { step: '03', icon: '✨', title: 'AI Generates', desc: 'Our AI crafts a personalized, winning proposal in seconds' },
                { step: '04', icon: '🚀', title: 'Copy & Win', desc: 'One-click copy and submit to win more bids' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="relative text-center group"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-white/5">
                    {item.step}
                  </div>
                  <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl hover:border-indigo-400/50 transition-all duration-300 hover:scale-105">
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-indigo-200 text-sm">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
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
              Powerful Features
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-center text-indigo-200 mb-12"
            >
              Everything freelancers and agencies need to win more bids
            </motion.p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Sparkles, title: 'AI-Powered Generation', desc: 'Advanced AI creates human-like, personalized proposals' },
                { icon: Target, title: 'Platform Ready', desc: 'Perfect for Upwork, Fiverr, Freelancer.com, and more' },
                { icon: Zap, title: 'Lightning Fast', desc: 'Generate proposals in under 60 seconds' },
                { icon: Users, title: 'Team Collaboration', desc: 'Perfect for agencies with multiple team members' },
                { icon: Award, title: 'Tone Control', desc: 'Professional, friendly, or persuasive — you choose' },
                { icon: Shield, title: 'History & Analytics', desc: 'Track all proposals and see what works best' }
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-400/50 transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-indigo-200">{feature.desc}</p>
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
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-center text-indigo-200 mb-12"
            >
              Start free, upgrade when you need more. Cancel anytime.
            </motion.p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  id: 'free',
                  name: 'Free', 
                  price: '$0', 
                  period: 'forever', 
                  features: [
                    '5 proposals per day',
                    'Basic templates',
                    'Email support'
                  ],
                  cta: 'Start Free',
                  popular: false,
                  icon: Zap,
                  color: 'from-gray-500 to-gray-600'
                },
                { 
                  id: 'starter',
                  name: 'Starter', 
                  price: '$12', 
                  period: 'per month', 
                  features: [
                    '50 proposals per month',
                    'Save client profiles',
                    'All tones & styles',
                    'Standard support'
                  ],
                  cta: 'Start Trial',
                  popular: false,
                  icon: TrendingUp,
                  color: 'from-blue-500 to-indigo-600'
                },
                { 
                  id: 'pro',
                  name: 'Pro', 
                  price: '$19', 
                  period: 'per month', 
                  features: [
                    'Unlimited proposals',
                    'Priority AI processing',
                    'Advanced analytics',
                    'Priority support',
                    'Custom branding'
                  ],
                  cta: 'Start Trial',
                  popular: true,
                  icon: Crown,
                  color: 'from-purple-500 to-pink-600'
                },
                { 
                  id: 'agency',
                  name: 'Agency', 
                  price: '$49', 
                  period: 'per month', 
                  features: [
                    'Everything in Pro',
                    'Team collaboration',
                    '5 team members',
                    'White-label branding',
                    'API access',
                    'Dedicated support'
                  ],
                  cta: 'Contact Sales',
                  popular: false,
                  icon: Building2,
                  color: 'from-emerald-500 to-teal-600'
                }
              ].map((plan, i) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-yellow-400 scale-105 shadow-2xl' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold text-sm rounded-full">
                        Most Popular
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span className="text-indigo-200 ml-2">/{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
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
      <section className="px-6 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-center mb-16"
          >
            Loved by Professionals
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Johnson', role: 'Freelance Designer', text: 'LunarBid cut my proposal time from 2 hours to 2 minutes. Game changer!' },
              { name: 'Mike Chen', role: 'Agency Owner', text: 'Our team now submits 5x more proposals. ROI was immediate.' },
              { name: 'Emma Davis', role: 'Full Stack Developer', text: 'I win 60% more bids now. The AI understands what clients want.' }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-indigo-200">{testimonial.role}</div>
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
          className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Win More Bids?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join 10,000+ freelancers and agencies using LunarBid
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl text-lg"
            >
              Start Free Trial →
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
                <div className="text-sm text-indigo-200">AI-Powered Proposals</div>
              </div>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-indigo-200">
            © {new Date().getFullYear()} LunarBid. All rights reserved. Powered by Moon Solutions.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;