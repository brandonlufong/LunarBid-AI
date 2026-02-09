import React, { useState, useEffect } from 'react';
import { generateProposal, getSubscription } from '../../services/api';
import { Sparkles, Loader2, Copy, Check, Download, Zap, Edit2, AlertCircle, Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const ProposalForm = ({ onProposalGenerated, editingProposal }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobDescription: '',
    clientName: '',
    budget: '',
    tone: 'friendly',
    length: 'medium'
  });
  const [proposal, setProposal] = useState('');
  const [editedProposal, setEditedProposal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);

  useEffect(() => {
    loadUsageInfo();
  }, []);

  const loadUsageInfo = async () => {
    try {
      const res = await getSubscription();
      setUsageInfo(res.data);
    } catch (err) {
      console.error('Error loading usage');
    }
  };

  // Update form when editing/duplicating a proposal
  useEffect(() => {
    if (editingProposal) {
      setFormData({
        jobTitle: editingProposal.jobTitle,
        jobDescription: editingProposal.jobDescription,
        clientName: editingProposal.clientName,
        budget: editingProposal.budget,
        tone: editingProposal.tone,
        length: editingProposal.length
      });
      setProposal(''); // Clear previous proposal
    }
  }, [editingProposal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProposal('');
    setEditedProposal('');
    setIsEditing(false);

    try {
      const res = await generateProposal(formData);
      setProposal(res.data.proposal);
      setEditedProposal(res.data.proposal);
      // Update usage info
      if (res.data.usage) {
        setUsageInfo(prev => ({
          ...prev,
          usage: res.data.usage
        }));
      }
      if (onProposalGenerated) onProposalGenerated();
    } catch (err) {
      // alert('Failed to generate proposal. Please try again.');
      // Handle limit reached error
      if (err.response?.status === 403) {
        const errorData = err.response.data;
        setError({
          type: 'limit',
          message: errorData.message,
          reason: errorData.reason,
          limit: errorData.limit,
          currentPlan: errorData.currentPlan,
          usage: errorData.usage
        });
      } else {
        setError({
          type: 'general',
          message: 'Failed to generate proposal. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(isEditing ? editedProposal : proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadProposal = () => {
    const content = isEditing ? editedProposal : proposal;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunarbid_proposal_${formData.jobTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic classes for dark mode
  const cardClasses = `rounded-2xl p-8 border-2 shadow-xl transition-all duration-300 hover:shadow-2xl
    ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100 text-slate-800'}`;
  const inputClasses = `w-full px-4 py-3.5 rounded-xl font-medium shadow-sm transition-all duration-200 border-2
    ${darkMode 
      ? 'bg-slate-700 border-slate-600 placeholder-slate-400 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
      : 'bg-white border-slate-200 placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500'}`;
  const labelClasses = `block text-sm font-bold mb-2.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  const proposalBoxClasses = `rounded-xl p-6 border-2 overflow-y-auto shadow-inner min-h-[550px] max-h-[550px] transition-colors duration-500
    ${darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50 border-slate-200 text-slate-800'}`;
  const successClasses = `mt-4 p-4 rounded-xl flex items-center gap-3 transition-all duration-300 border-2
    ${darkMode ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 transition-colors duration-500">

      {/* Left Side - Input Form */}
      <div className={cardClasses}>
        <div className={`flex items-center gap-3 mb-6 pb-4 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Job Details
          </h2>
        </div>

        {/* Usage Info Display */}
        {usageInfo && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Plan: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{usageInfo.subscription.plan}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {usageInfo.limits.daily 
                    ? `${usageInfo.usage.proposalsToday}/${usageInfo.limits.daily} today`
                    : usageInfo.limits.monthly
                    ? `${usageInfo.usage.proposalsThisMonth}/${usageInfo.limits.monthly} this month`
                    : '✨ Unlimited proposals'}
                </p>
              </div>
              {usageInfo.subscription.plan !== 'pro' && (
                <button
                  onClick={() => navigate('/dashboard', { state: { tab: 'subscription' } })}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message - Limit Reached */}
        {error && error.type === 'limit' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                  {error.reason === 'daily_limit' ? '📅 Daily Limit Reached' : '📊 Monthly Limit Reached'}
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                  You've used all {error.limit} proposals for {error.reason === 'daily_limit' ? 'today' : 'this month'} on your <span className="font-bold capitalize">{error.currentPlan}</span> plan.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate('/dashboard', { state: { tab: 'subscription' } })}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade Now
                  </button>
                  {error.reason === 'daily_limit' && (
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Or wait until tomorrow to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Error Message */}
        {error && error.type === 'general' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error.message}</span>
          </div>
        )}


        <div className="space-y-5">
          {/* Job Title */}
          <div>
            <label className={labelClasses}>
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g., Full Stack Developer"
              className={inputClasses}
            />
          </div>

          {/* Job Description */}
          <div>
            <label className={labelClasses}>
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder="Paste the complete job description here..."
              rows={8}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {/* Client Name and Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Optional"
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Budget</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="$5,000"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className={labelClasses}>Proposal Tone <span className="text-red-500">*</span></label>
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className={`${inputClasses} font-bold cursor-pointer`}
            >
              <option value="formal">🎩 Formal – Corporate & Professional</option>
              <option value="friendly">😊 Friendly – Warm & Approachable</option>
              <option value="persuasive">🎯 Persuasive – Results-Focused</option>
            </select>
          </div>

          {/* Length Selector */}
          <div>
            <label className={labelClasses}>Proposal Length <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'short', label: '📄 Short', desc: '2-3 min read' },
                { value: 'medium', label: '📋 Medium', desc: '4-5 min read' },
                { value: 'detailed', label: '📚 Detailed', desc: '7-10 min read' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, length: option.value })}
                  className={`relative p-3.5 rounded-lg font-bold text-sm transition-all duration-200 border-2 text-center transform hover:scale-105
                    ${formData.length === option.value
                      ? darkMode
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/50'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 text-white shadow-lg shadow-indigo-400/50'
                      : darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <div>{option.label}</div>
                  <div className={`text-xs mt-1 ${formData.length === option.value ? 'text-white/80' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.jobTitle || !formData.jobDescription}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Your Winning Proposal...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>Generate Proposal with AI</span>
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Side - Generated Proposal */}
      <div className={cardClasses}>
        <div className={`flex items-center justify-between mb-6 pb-4 border-b-2 ${darkMode ? 'border-slate-700' : 'border-purple-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Generated Proposal
              </h2>
              {proposal && (
                <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isEditing ? 'Editing mode active' : 'Review before sending'}
                </p>
              )}
            </div>
          </div>

          {proposal && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-amber-100 hover:bg-amber-50'} p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2`}
                title="Edit proposal"
              >
                <Edit2 className={`w-5 h-5 ${isEditing ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-slate-400' : 'text-slate-600')} group-hover:scale-110 transition-transform`} />
              </button>
              <button
                onClick={copyToClipboard}
                className={`${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-indigo-100 hover:bg-indigo-50'} p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2`}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} group-hover:scale-110 transition-transform`} />
                )}
              </button>
              <button
                onClick={downloadProposal}
                className={`${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-purple-100 hover:bg-purple-50'} p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2`}
                title="Download"
              >
                <Download className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'} group-hover:scale-110 transition-transform`} />
              </button>
            </div>
          )}
        </div>

        <div className={proposalBoxClasses}>
          {!proposal && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-6">
                <Sparkles className={`w-24 h-24 ${darkMode ? 'opacity-10 text-indigo-400' : 'opacity-20 text-indigo-300'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className={`w-12 h-12 ${darkMode ? 'text-indigo-300' : 'text-indigo-300'} animate-pulse`} />
                </div>
              </div>
              <p className={darkMode ? 'text-slate-300 text-xl font-bold mb-2' : 'text-slate-500 text-xl font-bold mb-2'}>
                Your AI proposal will appear here
              </p>
              <p className={darkMode ? 'text-slate-400 text-sm' : 'text-slate-400 text-sm'}>
                Fill in the job details and click "Generate" to create your winning proposal
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className={`w-16 h-16 animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <Sparkles className={`w-20 h-20 animate-pulse ${darkMode ? 'text-purple-400' : 'text-purple-400'}`} />
              </div>
              <p className={`text-xl font-bold mb-2 animate-pulse ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                Crafting Your Perfect Proposal...
              </p>
              <p className={darkMode ? 'text-slate-400 text-sm' : 'text-slate-500 text-sm'}>
                Our AI is analyzing the job and tailoring your proposal
              </p>
            </div>
          )}

          {proposal && !loading && (
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  value={editedProposal}
                  onChange={(e) => setEditedProposal(e.target.value)}
                  className={`w-full h-[450px] p-4 rounded-lg font-mono text-sm border-2 resize-none
                    ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}
                    focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              ) : (
                <div className={`${darkMode ? 'bg-slate-800/70 border-slate-700 text-slate-200' : 'bg-white/80 border-indigo-100 text-slate-800'} backdrop-blur-sm rounded-lg p-6 shadow-sm border-2 h-[450px] overflow-y-auto`}>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">{proposal}</pre>
                </div>
              )}

              {/* Success message */}
              <div className={successClasses}>
                <Check className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">
                    ✨ Proposal Generated Successfully!
                  </p>
                  <p className="text-xs mt-1">
                    {isEditing ? 'Make your changes and download' : 'Review, customize if needed, and send to win the bid!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalForm;