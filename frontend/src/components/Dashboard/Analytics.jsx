import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, DollarSign, Clock, BarChart3, PieChart, Loader2, Download, Calendar, Filter } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [period, setPeriod] = useState('30'); // days
  const [hasAccess, setHasAccess] = useState(true);

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
      setDashboardData(response.data);
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
      alert('Error exporting data');
    }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className={`p-12 rounded-2xl ${darkMode ? 'bg-slate-800 border-2 border-slate-700' : 'bg-white border-2 border-indigo-100'}`}>
          <BarChart3 className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Advanced Analytics
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Track your proposal performance, win rates, and revenue with detailed analytics.
          </p>
          <div className={`inline-block px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            Available in Pro plan ($19/mo) and above
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
              Analytics Dashboard
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Track your proposal performance and insights
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
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <Download className="w-4 h-4" />
            Export
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
            {dashboardData?.overview?.winRate || 0}%
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Win Rate
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {dashboardData?.overview?.won || 0} won / {dashboardData?.overview?.total || 0} sent
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
            ${(dashboardData?.overview?.totalRevenue || 0).toLocaleString()}
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Total Revenue
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Avg: ${Math.round(dashboardData?.overview?.avgRevenue || 0)}
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
            {dashboardData?.overview?.total || 0}
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Proposals Sent
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            In selected period
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
            {Math.round(dashboardData?.overview?.avgResponseTime || 0)}h
          </div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Avg Response Time
          </div>
          <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Client response time
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance by Tone */}
        <div className={`p-6 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'} shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            Performance by Tone
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData?.performanceByTone || []}>
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
            Monthly Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.monthlyTrends || []}>
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
          Recent Proposals
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date</th>
                <th className={`text-left py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Status</th>
                <th className={`text-right py-3 px-4 font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.recentProposals?.map((proposal, idx) => (
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