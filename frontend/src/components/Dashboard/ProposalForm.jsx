import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateProposal, getSubscription, sendProposal, analyzeJob, shareProposal } from '../../services/api';
import { Sparkles, Loader2, Copy, Check, Download, Zap, Edit2, AlertCircle, Crown, Send, Mail, FileText,
  ScanSearch, Target, AlertTriangle, Lightbulb, ListChecks, Gauge, ChevronDown, X, Wand2, Share2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TEMPLATE_META } from '../../config/proposalTemplates';

const ProposalForm = ({ onProposalGenerated, editingProposal }) => {
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
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
  const [proposalId, setProposalId] = useState(null);
  const [editedProposal, setEditedProposal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  // Seconds since generation started, for the progress messages.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);
  const loadingStage = elapsed < 6 ? 'stageReading' : elapsed < 14 ? 'stageWriting' : elapsed < 20 ? 'stagePolishing' : 'stageSlow';
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendData, setSendData] = useState({
    recipientEmail: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [applied, setApplied] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [analyzedText, setAnalyzedText] = useState('');

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
    setError(null);

    try {
      const res = await generateProposal(formData);
      setProposal(res.data.proposal);
      setEditedProposal(res.data.proposal);
      setProposalId(res.data.id);
      // All AI providers failed and a template was returned: say so (it was not counted).
      if (res.data.isTemplate) {
        toast.info(t('dashboard.generate.templateNotice'));
      }
      // Update usage info
      if (res.data.usage) {
        setUsageInfo(prev => ({
          ...prev,
          usage: res.data.usage
        }));
      }
      if (onProposalGenerated) onProposalGenerated();
    } catch (err) {
      if (err.response?.data?.code === 'email_unverified') {
        setError({ type: 'general', message: err.response.data.message });
      } else if (err.response?.status === 403) {
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

  // ---- Multi-format export (proposal power-tool) ----
  const getProposalText = () => (isEditing ? editedProposal : proposal);
  const baseName = () => `lunarbid_proposal_${(formData.jobTitle || 'proposal').replace(/\s+/g, '_')}`;
  const escapeHtml = (s = '') =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const downloadBlob = (content, mime, ext) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = (text) => {
    const title = escapeHtml(formData.jobTitle || 'Proposal');
    const w = window.open('', '_blank');
    if (!w) { toast.error(t('dashboard.generate.toastPopup')); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;line-height:1.6;color:#1e293b;max-width:720px;margin:40px auto;padding:0 24px;white-space:pre-wrap;}
        h1{font-family:Arial,Helvetica,sans-serif;color:#4f46e5;font-size:20px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:20px;}
        @media print{body{margin:0;}}
      </style></head><body><h1>${title}</h1>${escapeHtml(text)}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  const exportAs = (fmt) => {
    const text = getProposalText();
    setShowExport(false);
    if (!text) return;
    if (fmt === 'txt') return downloadBlob(text, 'text/plain', 'txt');
    if (fmt === 'md') return downloadBlob(`# ${formData.jobTitle || 'Proposal'}\n\n${text}`, 'text/markdown', 'md');
    if (fmt === 'word') {
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Proposal</title></head><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;white-space:pre-wrap;">${escapeHtml(text)}</body></html>`;
      return downloadBlob(html, 'application/msword', 'doc');
    }
    if (fmt === 'pdf') return exportPdf(text);
  };

  // ---- AI Job-Post Analyzer (AI intelligence) ----
  const hasFreshAnalysis = analysis && analyzedText === formData.jobDescription;

  const handleAnalyze = async (force = false) => {
    if (!formData.jobDescription || formData.jobDescription.trim().length < 20) {
      setAnalyzeError(t('dashboard.analyzer.needDescription'));
      return;
    }
    setAnalyzeError(null);
    // If we already analyzed this exact description, just reopen the panel — no refetch.
    if (!force && hasFreshAnalysis) {
      setAnalyzerOpen(true);
      return;
    }
    setApplied(false);
    setAnalyzerOpen(true);   // open immediately so the user gets instant feedback (skeleton)
    setAnalyzing(true);
    try {
      const res = await analyzeJob({ jobDescription: formData.jobDescription, jobTitle: formData.jobTitle });
      setAnalysis(res.data.analysis);
      setAnalyzedText(formData.jobDescription);
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || t('dashboard.analyzer.error'));
      setAnalyzerOpen(false);
      toast.error(err.response?.data?.message || t('dashboard.analyzer.error'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!proposalId) {
      toast.error(t('dashboard.generate.toastNoProposal'));
      return;
    }
    try {
      const res = await shareProposal(proposalId);
      const url = `${window.location.origin}/p/${res.data.shareToken}`;
      await navigator.clipboard.writeText(url);
      toast.success(t('dashboard.generate.toastShared'));
    } catch (err) {
      toast.error(t('dashboard.generate.toastShareFailed'));
    }
  };

  const applyTemplate = (i) => {
    const item = t('dashboard.templates.items')[i];
    const meta = TEMPLATE_META[i] || {};
    if (!item) return;
    setFormData((prev) => ({
      ...prev,
      jobTitle: item.jobTitle,
      jobDescription: item.jobDescription,
      tone: meta.tone || prev.tone,
      length: meta.length || prev.length,
    }));
    toast.success(t('dashboard.templates.applied'));
  };

  const applySuggestions = () => {
    if (!analysis) return;
    setFormData((prev) => ({ ...prev, tone: analysis.suggestedTone, length: analysis.suggestedLength }));
    setApplied(true);
    toast.success(t('dashboard.analyzer.applied'));
    // Close the panel so the user sees the tone/length applied on the form.
    setTimeout(() => { setApplied(false); setAnalyzerOpen(false); }, 900);
  };

  const handleSendProposal = async () => {
    if (!sendData.recipientEmail || !sendData.subject) {
      toast.error(t('dashboard.generate.toastSendMissing'));
      return;
    }
    if (!proposalId) {
      toast.error(t('dashboard.generate.toastNoProposal'));
      return;
    }

    setSending(true);
    try {
      // Send exactly what is on screen, including unsaved edits.
      await sendProposal(proposalId, { ...sendData, content: getProposalText() });
      setShowSendModal(false);
      toast.success(t('dashboard.generate.toastSent', { email: sendData.recipientEmail }));
      setSendData({ recipientEmail: '', subject: '', message: '' });

      // Refresh proposal history if callback exists
      if (onProposalGenerated) onProposalGenerated();
    } catch (error) {
      console.error('Error sending proposal:', error);
      // Show the server's reason (not set up, daily limit, delivery failure).
      toast.error(error.response?.data?.message || t('dashboard.generate.toastSendFailed'));
    } finally {
      setSending(false);
    }
  };

  // ✅ FULLY THEMED CLASSES
  const cardClasses = `rounded-2xl p-8 border-2 shadow-xl transition-all duration-300 hover:shadow-2xl
    ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100 text-slate-800'}`;
  
  const inputClasses = `w-full px-4 py-3.5 rounded-xl font-medium shadow-sm transition-all duration-200 border-2
    ${darkMode 
      ? 'bg-slate-700 border-slate-600 placeholder-slate-400 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
      : 'bg-white border-slate-200 placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500'}`;
  
  const labelClasses = `block text-sm font-bold mb-2.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`;
  
  const proposalBoxClasses = `rounded-xl p-6 border-2 overflow-y-auto shadow-inner min-h-[450px] max-h-[550px] transition-colors duration-500
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
            {t('dashboard.generate.jobDetails')}
          </h2>
        </div>

        {/* ✅ THEMED Usage Info */}
        {usageInfo && (
          <div className={`mb-6 p-4 rounded-xl border-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-blue-900/20 border-blue-700' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {usageInfo.limits.dailyProposals
                    ? t('dashboard.generate.usageToday', { usage: usageInfo.usage.proposalsToday, limit: usageInfo.limits.dailyProposals })
                    : usageInfo.limits.monthlyProposals
                    ? t('dashboard.generate.usageThisMonth', { usage: usageInfo.usage.proposalsThisMonth, limit: usageInfo.limits.monthlyProposals })
                    : t('dashboard.generate.unlimitedProposals')}
                </p>
              </div>
              {usageInfo.subscription.plan !== 'pro' && usageInfo.subscription.plan !== 'agency' && (
                <button
                  onClick={() => navigate('/dashboard', { state: { tab: 'subscription' } })}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {t('dashboard.generate.upgrade')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ✅ THEMED Edit/Duplicate Notification */}
        {/* {editingProposal && (
          <div className={`mb-6 p-5 rounded-xl border-2 transition-colors duration-300 ${
            editingProposal.isDuplicate
              ? darkMode 
                ? 'bg-blue-900/20 border-blue-700' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
              : darkMode
                ? 'bg-purple-900/20 border-purple-700'
                : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
          }`}>
            <div className="flex items-start gap-3">
              {editingProposal.isDuplicate ? (
                <>
                  <Sparkles className={`w-6 h-6 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className="flex-1">
                    <p className={`font-bold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                      Duplicating Proposal
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Modify the details below and generate a new proposal
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FileText className={`w-6 h-6 flex-shrink-0 mt-0.5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <div className="flex-1">
                    <p className={`font-bold mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                      Editing Proposal
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      Make your changes and regenerate
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )} */}

        {/* ✅ THEMED Error Message - Limit Reached */}
        {error && error.type === 'limit' && (
          <div className={`mb-6 p-5 rounded-xl border-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                  {error.reason === 'daily_limit' ? t('dashboard.generate.dailyLimitReached') : t('dashboard.generate.monthlyLimitReached')}
                </h3>
                <p className={`text-sm mb-3 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                  {t('dashboard.generate.limitReachedMessage', { 
                    limit: error.limit, 
                    period: error.reason === 'daily_limit' ? 'today' : 'this month', 
                    plan: error.currentPlan 
                  })}
                </p>
                <button
                  onClick={() => navigate('/dashboard', { state: { tab: 'subscription' } })}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Crown className="w-4 h-4" />
                  {t('dashboard.generate.upgradeNow')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ THEMED General Error */}
        {error && error.type === 'general' && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-2 transition-colors duration-300 ${
            darkMode 
              ? 'bg-red-900/20 border-red-700 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error.message}</span>
          </div>
        )}

        {/* Quick-start templates */}
        <div className="mb-5">
          <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('dashboard.templates.label')}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {(t('dashboard.templates.items') || []).map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(i)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all whitespace-nowrap ${
                  darkMode
                    ? 'bg-slate-700/60 border-slate-600 text-slate-200 hover:border-brand-400/60 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span>{TEMPLATE_META[i]?.icon}</span>
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job Title */}
          <div>
            <label htmlFor="proposal-field-1" className={labelClasses}>
              {t('dashboard.generate.jobTitle')} <span className="text-red-500">*</span>
            </label>
            <input id="proposal-field-1"
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder={t('dashboard.generate.jobTitlePlaceholder')}
              className={inputClasses}
            />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="proposal-field-2" className={labelClasses}>
              {t('dashboard.generate.jobDescription')} <span className="text-red-500">*</span>
            </label>
            <textarea id="proposal-field-2"
              required
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              placeholder={t('dashboard.generate.jobDescriptionPlaceholder')}
              rows={8}
              className={`${inputClasses} resize-none custom-scrollbar ${darkMode ? 'dark-scrollbar' : ''}`}
            />
          </div>

          {/* AI Analyze Job Post */}
          <div>
            <button
              type="button"
              onClick={() => handleAnalyze(false)}
              disabled={analyzing}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                darkMode
                  ? 'bg-slate-700/60 border-indigo-500/40 text-indigo-300 hover:bg-slate-700 hover:border-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
              }`}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('dashboard.analyzer.analyzing')}
                </>
              ) : hasFreshAnalysis ? (
                <>
                  <ScanSearch className="w-5 h-5" />
                  {t('dashboard.analyzer.view')}
                </>
              ) : (
                <>
                  <ScanSearch className="w-5 h-5" />
                  {t('dashboard.analyzer.button')}
                </>
              )}
            </button>
            {analyzeError && !analyzerOpen && (
              <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {analyzeError}
              </p>
            )}
          </div>

          {/* Client Name and Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proposal-field-3" className={labelClasses}>{t('dashboard.generate.clientName')}</label>
              <input id="proposal-field-3"
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder={t('dashboard.generate.optional')}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="proposal-field-4" className={labelClasses}>{t('dashboard.generate.budget')}</label>
              <input id="proposal-field-4"
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder={t('dashboard.generate.budgetPlaceholder')}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label htmlFor="proposal-field-5" className={labelClasses}>{t('dashboard.generate.tone')}</label>
            <select id="proposal-field-5"
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className={`${inputClasses} cursor-pointer`}
            >
              <option value="formal">🎩 {t('dashboard.generate.toneProfessional')}</option>
              <option value="friendly">😊 {t('dashboard.generate.toneFriendly')}</option>
              <option value="persuasive">🎯 {t('dashboard.generate.tonePersuasive')}</option>
            </select>
          </div>

          {/* ✅ THEMED Length Selector */}
          <div>
            <label id="proposal-group-6" className={labelClasses}>{t('dashboard.generate.length')}</label>
            <div role="group" aria-labelledby="proposal-group-6" className="grid grid-cols-3 gap-3">
              {[
                { value: 'short', label: `📄 ${t('dashboard.generate.lengthShort')}`, desc: t('dashboard.generate.lengthShortDesc') },
                { value: 'medium', label: `📋 ${t('dashboard.generate.lengthMedium')}`, desc: t('dashboard.generate.lengthMediumDesc') },
                { value: 'detailed', label: `📚 ${t('dashboard.generate.lengthDetailed')}`, desc: t('dashboard.generate.lengthDetailedDesc') }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, length: option.value })}
                  className={`relative p-3.5 rounded-lg font-bold text-sm transition-all duration-200 border-2 text-center transform hover:scale-105 ${
                    formData.length === option.value
                      ? darkMode
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/50'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 text-white shadow-lg shadow-indigo-400/50'
                      : darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>{option.label}</div>
                  <div className={`text-xs mt-1 ${
                    formData.length === option.value 
                      ? 'text-white/80' 
                      : darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{t('common.loading')} {t('dashboard.generate.title').toLowerCase()}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>{t('dashboard.generate.generateButton')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Side - Generated Proposal */}
      <div className={`flex flex-col ${cardClasses}`}>
        <div className={`flex flex-col mb-6 pb-4 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('dashboard.generate.generatedProposal')}
              </h2>
              {proposal && (
                <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isEditing ? t('dashboard.generate.editingMode') : t('dashboard.generate.reviewBeforeSending')}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons Below Title */}
          {proposal && (
            <div className="flex flex-wrap gap-2">
              <button aria-label={t('a11y.edit')}
                onClick={() => setIsEditing(!isEditing)}
                className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2 ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' 
                    : 'bg-white border-amber-100 hover:bg-amber-50'
                }`}
                title={t('dashboard.generate.titleEdit')}
              >
                <Edit2 className={`w-5 h-5 ${
                  isEditing 
                    ? (darkMode ? 'text-amber-400' : 'text-amber-600') 
                    : (darkMode ? 'text-slate-400' : 'text-slate-600')
                } group-hover:scale-110 transition-transform`} />
              </button>
              
              <button
                onClick={copyToClipboard}
                className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2 ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' 
                    : 'bg-white border-indigo-100 hover:bg-indigo-50'
                }`}
                title={t('dashboard.generate.titleCopy')}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className={`w-5 h-5 ${
                    darkMode ? 'text-indigo-400' : 'text-indigo-600'
                  } group-hover:scale-110 transition-transform`} />
                )}
              </button>
              
              <div className="relative">
                <button aria-label={t('a11y.export')}
                  onClick={() => setShowExport((s) => !s)}
                  className={`flex items-center gap-1 p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2 ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-white border-purple-100 hover:bg-purple-50'
                  }`}
                  title={t('dashboard.export.export')}
                >
                  <Download className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'} group-hover:scale-110 transition-transform`} />
                  <ChevronDown className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
                {showExport && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                    <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl border-2 z-50 overflow-hidden ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                      {[
                        { fmt: 'pdf', label: t('dashboard.export.pdf') },
                        { fmt: 'word', label: t('dashboard.export.word') },
                        { fmt: 'txt', label: t('dashboard.export.text') },
                        { fmt: 'md', label: t('dashboard.export.markdown') },
                      ].map((opt) => (
                        <button
                          key={opt.fmt}
                          onClick={() => exportAs(opt.fmt)}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                            darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-indigo-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <button aria-label={t('a11y.share')}
                onClick={handleShare}
                className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    : 'bg-white border-blue-100 hover:bg-blue-50'
                }`}
                title={t('dashboard.generate.titleShare')}
              >
                <Share2 className={`w-5 h-5 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                } group-hover:scale-110 transition-transform`} />
              </button>

              <button aria-label={t('a11y.send')}
                onClick={() => setShowSendModal(true)}
                className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group border-2 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    : 'bg-white border-green-100 hover:bg-green-50'
                }`}
                title={t('dashboard.generate.titleSend')}
              >
                <Send className={`w-5 h-5 ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                } group-hover:scale-110 transition-transform`} />
              </button>
            </div>
          )}
        </div>

        <div className={`flex-1 ${proposalBoxClasses}`}>
          {!proposal && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-6">
                <Sparkles className={`w-24 h-24 ${darkMode ? 'opacity-10 text-indigo-400' : 'opacity-20 text-indigo-300'}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className={`w-12 h-12 ${darkMode ? 'text-indigo-300' : 'text-indigo-300'} animate-pulse`} />
                </div>
              </div>
              <p className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {t('dashboard.generate.emptyTitle')}
              </p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                {t('dashboard.generate.emptyHint')}
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
                {t('dashboard.generate.craftingTitle')}
              </p>
              <p role="status" aria-live="polite" className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(`dashboard.generate.${loadingStage}`)}
              </p>
            </div>
          )}

          {proposal && !loading && (
            <div className={`h-full flex flex-col ${
              isEditing ? 'justify-center' : ''
            }`}>
              {isEditing ? (
                <textarea
                  value={editedProposal}
                  onChange={(e) => setEditedProposal(e.target.value)}
                  className={`flex-1 w-full p-4 rounded-lg font-mono text-sm border-2 resize-none custom-scrollbar ${
                    darkMode 
                      ? 'bg-slate-800 border-slate-600 text-slate-200 dark-scrollbar' 
                      : 'bg-white border-slate-300 text-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              ) : (
                <div className={`flex-1 backdrop-blur-sm rounded-lg p-6 shadow-sm border-2 overflow-y-auto custom-scrollbar ${
                  darkMode 
                    ? 'bg-slate-800/70 border-slate-700 text-slate-200 dark-scrollbar' 
                    : 'bg-white/80 border-indigo-100 text-slate-800'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">{proposal}</pre>
                </div>
              )}

              {/* Success Message */}
              <div className={`mt-4 ${successClasses}`}>
                <Check className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">
                    ✨ {t('dashboard.generate.successTitle')}
                  </p>
                  <p className="text-xs mt-1">
                    {isEditing ? t('dashboard.generate.successEdit') : t('dashboard.generate.successReview')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Job Analysis — slide-over side panel (portaled to body so it is
          truly viewport-fixed, escaping the framer-motion transform on routes) */}
      {createPortal(
        <AnimatePresence>
        {analyzerOpen && (
          <div className="fixed inset-0 z-[70]">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAnalyzerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className={`absolute inset-y-0 right-0 w-full sm:max-w-md lg:max-w-lg flex flex-col shadow-2xl ${
                darkMode ? 'bg-slate-800' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between gap-3 p-4 sm:p-5 border-b-2 flex-shrink-0 ${
                darkMode ? 'border-slate-700 bg-slate-800' : 'border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg flex-shrink-0">
                    <ScanSearch className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t('dashboard.analyzer.title')}</h3>
                    <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.analyzer.subtitle')}</p>
                  </div>
                </div>
                <button aria-label={t('a11y.close')}
                  onClick={() => setAnalyzerOpen(false)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-white/60 text-slate-500'}`}
                  title={t('dashboard.analyzer.hide')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (scrollable) */}
              <div className={`flex-1 overflow-y-auto custom-scrollbar ${darkMode ? 'dark-scrollbar' : ''} p-4 sm:p-5 space-y-5`}>
                {analyzing && !hasFreshAnalysis ? (
                  /* Skeleton */
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Loader2 className={`w-5 h-5 animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{t('dashboard.analyzer.analyzing')}</span>
                    </div>
                    <div className={`h-24 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                    <div className="flex gap-2">
                      {[...Array(4)].map((_, i) => <div key={i} className={`h-7 w-20 rounded-full ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />)}
                    </div>
                    {[...Array(3)].map((_, i) => <div key={i} className={`h-28 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />)}
                  </div>
                ) : analysis ? (
                  <>
                    {/* Score */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-indigo-50/60 border-indigo-100'}`}>
                      {analysis.matchScore == null ? (
                        <div className={`text-4xl font-black leading-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} aria-hidden="true">–</div>
                      ) : (
                        <div className={`text-4xl font-black leading-none ${
                          analysis.matchScore >= 70 ? 'text-green-500' : analysis.matchScore >= 40 ? 'text-amber-500' : 'text-red-500'
                        }`}>{analysis.matchScore}<span className="text-lg">%</span></div>
                      )}
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.analyzer.matchScore')}</div>
                        {analysis.matchScore == null && <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('dashboard.analyzer.noProfileScore')}</p>}
                        {analysis.matchReason && <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{analysis.matchReason}</p>}
                      </div>
                    </div>

                    {/* Summary */}
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{analysis.summary}</p>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: t('dashboard.analyzer.suggestedTone'), value: analysis.suggestedTone },
                        { label: t('dashboard.analyzer.suggestedLength'), value: analysis.suggestedLength },
                        { label: t('dashboard.analyzer.complexity'), value: analysis.complexity },
                        { label: t('dashboard.analyzer.budget'), value: analysis.estimatedBudgetRange },
                      ].map((chip, i) => (
                        <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          darkMode ? 'bg-slate-700/60 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <span className={darkMode ? 'text-indigo-400' : 'text-indigo-500'}>{chip.label}:</span>
                          <span className="capitalize">{chip.value}</span>
                        </span>
                      ))}
                    </div>

                    {/* Insight cards (single column in the panel) */}
                    <div className="space-y-4">
                      {[
                        { icon: ListChecks, title: t('dashboard.analyzer.keyRequirements'), items: analysis.keyRequirements, accent: 'text-indigo-500' },
                        { icon: Target, title: t('dashboard.analyzer.suggestedSkills'), items: analysis.suggestedSkills, accent: 'text-purple-500' },
                        { icon: Gauge, title: t('dashboard.analyzer.clientPainPoints'), items: analysis.clientPainPoints, accent: 'text-blue-500' },
                        { icon: Lightbulb, title: t('dashboard.analyzer.winningAngles'), items: analysis.winningAngles, accent: 'text-green-500' },
                      ].filter(c => c.items && c.items.length).map((card, i) => {
                        const Icon = card.icon;
                        return (
                          <div key={i} className={`rounded-xl p-4 border-2 ${darkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className={`w-4 h-4 ${card.accent}`} />
                              <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{card.title}</h4>
                            </div>
                            <ul className="space-y-1.5">
                              {card.items.map((it, j) => (
                                <li key={j} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${card.accent.replace('text-', 'bg-')}`} />
                                  {it}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {/* Red flags */}
                    <div className={`rounded-xl p-4 border-2 ${
                      analysis.redFlags && analysis.redFlags.length
                        ? darkMode ? 'bg-red-900/15 border-red-800/50' : 'bg-red-50 border-red-200'
                        : darkMode ? 'bg-green-900/15 border-green-800/50' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-4 h-4 ${analysis.redFlags && analysis.redFlags.length ? 'text-red-500' : 'text-green-500'}`} />
                        <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t('dashboard.analyzer.redFlags')}</h4>
                      </div>
                      {analysis.redFlags && analysis.redFlags.length ? (
                        <ul className="space-y-1.5">
                          {analysis.redFlags.map((f, i) => (
                            <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{t('dashboard.analyzer.noRedFlags')}</p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer actions */}
              {hasFreshAnalysis && (
                <div className={`flex items-center gap-3 p-4 border-t-2 flex-shrink-0 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
                  <button
                    onClick={() => handleAnalyze(true)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                      darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('dashboard.analyzer.reanalyze')}
                  </button>
                  <button
                    onClick={applySuggestions}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      applied ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {applied ? <><Check className="w-4 h-4" /> {t('dashboard.analyzer.applied')}</> : <><Wand2 className="w-4 h-4" /> {t('dashboard.analyzer.applySuggestions')}</>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* THEMED Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full border-2 shadow-2xl transition-colors duration-300 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {t('dashboard.send.title')}
              </h3>
              <button aria-label={t('a11y.close')}
                onClick={() => setShowSendModal(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Recipient Email */}
              <div>
                <label htmlFor="proposal-field-7" className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.send.recipientEmail')} <span className="text-red-500">*</span>
                </label>
                <input id="proposal-field-7"
                  type="email"
                  value={sendData.recipientEmail}
                  onChange={(e) => setSendData({ ...sendData, recipientEmail: e.target.value })}
                  placeholder={t('dashboard.send.recipientPlaceholder')}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="proposal-field-8" className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.send.subject')} <span className="text-red-500">*</span>
                </label>
                <input id="proposal-field-8"
                  type="text"
                  value={sendData.subject}
                  onChange={(e) => setSendData({ ...sendData, subject: e.target.value })}
                  placeholder={t('dashboard.send.subjectPlaceholder', { title: formData.jobTitle })}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="proposal-field-9" className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {t('dashboard.send.message')}
                </label>
                <textarea id="proposal-field-9"
                  value={sendData.message}
                  onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
                  placeholder={t('dashboard.send.messagePlaceholder')}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border-2 resize-none ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`flex gap-3 pt-4 mt-4 border-t-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setShowSendModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t('dashboard.send.cancel')}
              </button>
              <button
                onClick={handleSendProposal}
                disabled={sending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('dashboard.send.sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('dashboard.send.send')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalForm;