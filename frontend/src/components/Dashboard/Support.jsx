import React, { useState } from 'react';
import { Mail, MessageCircle, Phone, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import axios from 'axios';

const Support = () => {
  const { darkMode } = useTheme();
  const toast = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/support/ticket', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubmitted(true);
      setFormData({ subject: '', message: '', category: 'general' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error(t('dashboard.support.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'general', label: t('dashboard.support.catGeneral'), icon: MessageCircle },
    { value: 'technical', label: t('dashboard.support.catTechnical'), icon: Mail },
    { value: 'billing', label: t('dashboard.support.catBilling'), icon: MessageCircle },
    { value: 'feature', label: t('dashboard.support.catFeature'), icon: MessageCircle }
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className={`p-8 rounded-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('dashboard.support.submittedTitle')}
          </h3>
          <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('dashboard.support.submittedMsg')}
          </p>
          <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <strong>{t('dashboard.support.ticketId')}</strong> #TK{Date.now().toString().slice(-6)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`mb-8 p-8 rounded-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('dashboard.support.title')}
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              {t('dashboard.support.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.support.sendMessage')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.support.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.support.subject')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={t('dashboard.support.subjectPlaceholder')}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.support.message')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('dashboard.support.messagePlaceholder')}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border-2 resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white/30 animate-spin"></div>
                    {t('dashboard.support.sending')}
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    {t('dashboard.support.sendBtn')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Contact Info */}
          <div>
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('dashboard.support.otherWays')}
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} border-2 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t('dashboard.support.emailLabel')}</h4>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>support@lunarbid.com</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} border-2 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t('dashboard.support.responseTime')}</h4>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{t('dashboard.support.within24')}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} border-2 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <ExternalLink className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t('dashboard.support.helpCenter')}</h4>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>docs.lunarbid.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
