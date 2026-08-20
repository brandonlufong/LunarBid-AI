import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, DollarSign, Clock, BarChart3, PieChart, Loader2, Download, Calendar, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const { darkMode } = useTheme();
  const toast = useToast();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [period, setPeriod] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        params: { period }
      });
      setAnalytics(response.data);
      setHasAccess(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      }
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics/export?format=csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('dashboard.analytics.exportFailed'));
    }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className={`p-12 rounded-2xl ${darkMode ? 'bg-slate-800 border-2 border-slate-700' : 'bg-white border-2 border-indigo-100'}`}>
          <BarChart3 className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('dashboard.analytics.lockedTitle')}
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.analytics.lockedDesc')}
          </p>
          <div className={`inline-block px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            {t('dashboard.analytics.lockedCta')}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('dashboard.analytics.title')}
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.analytics.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`px-4 py-2 rounded-lg font-semibold border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
          >
            <option value="7">{t('dashboard.analytics.last7')}</option>
            <option value="30">{t('dashboard.analytics.last30')}</option>
            <option value="90">{t('dashboard.analytics.last90')}</option>
            <option value="365">{t('dashboard.analytics.last365')}</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <Download className="w-4 h-4" />
            {t('dashboard.analytics.export')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Win Rate */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <Award className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
          <div className={`text-4xl font-black mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {analytics?.overview?.winRate || 0}%
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.analytics.winRate')}
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {t('dashboard.analytics.wonSent', { won: analytics?.overview?.won || 0, sent: analytics?.overview?.total || 0 })}
          </div>
        </div>

        {/* Total Revenue */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
              <DollarSign className={`w-6 h-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
          </div>
          <div className={`text-4xl font-black mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            ${(analytics?.overview?.totalRevenue || 0).toLocaleString()}
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.analytics.totalRevenue')}
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {t('dashboard.analytics.avg')}: ${Math.round(analytics?.overview?.avgRevenue || 0)}
          </div>
        </div>

        {/* Proposals Sent */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
          <div className={`text-4xl font-black mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            {analytics?.overview?.total || 0}
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.analytics.proposalsSent')}
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {t('dashboard.analytics.inSelectedPeriod')}
          </div>
        </div>

        {/* Avg Response Time */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
              <Clock className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </div>
          <div className={`text-4xl font-black mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            {t('dashboard.analytics.avg')}: ${Math.round(analytics?.overview?.avgResponseTime || 0)}h
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.analytics.avgResponseTime')}
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {t('dashboard.analytics.clientResponseTime')}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance by Tone */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('dashboard.analytics.performanceByTone')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.performanceByTone || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="tone" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: `2px solid ${darkMode ? '#475569' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#6366f1" name="Total" />
              <Bar dataKey="won" fill="#10b981" name="Won" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('dashboard.analytics.monthlyTrends')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthlyTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: `2px solid ${darkMode ? '#475569' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total Sent" />
              <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} name="Won" />
              <Line type="monotone" dataKey="winRate" stroke="#f59e0b" strokeWidth={2} name="Win Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Proposals Table */}
      <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {t('dashboard.analytics.recentProposals')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('dashboard.analytics.tableDate')}</th>
                <th className={`text-left py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('dashboard.analytics.tableStatus')}</th>
                <th className={`text-right py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('dashboard.analytics.tableRevenue')}</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentProposals?.map((proposal, idx) => (
                <tr key={idx} className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  <td className={`py-3 px-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {new Date(proposal.dateSubmitted).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      proposal.status === 'accepted' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : proposal.status === 'rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ${proposal.actualRevenue || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;