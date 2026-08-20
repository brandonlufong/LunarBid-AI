import React, { useState, useEffect } from 'react';
import { getProposalHistory, deleteProposal } from '../../services/api';
import { FileText, Trash2, Eye, Loader2, Clock, DollarSign, Sparkles, Copy, Edit, RefreshCw, Download, Share2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../UI/Toast';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const ProposalHistory = ({ refreshTrigger, onEditProposal, onDuplicateProposal }) => {
  const { darkMode } = useTheme();
  const toast = useToast();
  const { t } = useLanguage();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    try {
      const response = await getProposalHistory();
      setProposals(response.data);
    } catch (error) {
      console.error('Error loading history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('dashboard.history.deleteConfirm'))) return;
    try {
      await deleteProposal(id);
      setProposals(proposals.filter(p => p._id !== id));
      if (selectedProposal?._id === id) setSelectedProposal(null);
    } catch (error) {
      toast.error(t('dashboard.history.deleteFailed'));
    }
  };

  const handleCopyProposal = (proposalText, id) => {
    navigator.clipboard.writeText(proposalText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadProposal = (proposal) => {
    const blob = new Blob([proposal.generatedProposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunarbid_${proposal.jobTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditProposal = (proposal) => {
    if (onEditProposal) {
      onEditProposal(proposal);
    }
  };

  const handleDuplicateProposal = (proposal) => {
    if (onDuplicateProposal) {
      onDuplicateProposal(proposal);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getToneBadgeColor = (tone) => {
    switch(tone) {
      case 'professional':
      case 'formal': 
        return darkMode 
          ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
          : 'bg-blue-100 text-blue-700 border-blue-200';
      case 'friendly': 
        return darkMode 
          ? 'bg-green-900/30 text-green-300 border-green-700' 
          : 'bg-green-100 text-green-700 border-green-200';
      case 'persuasive': 
        return darkMode 
          ? 'bg-purple-900/30 text-purple-300 border-purple-700' 
          : 'bg-purple-100 text-purple-700 border-purple-200';
      default: 
        return darkMode 
          ? 'bg-gray-800 text-gray-300 border-gray-700' 
          : 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <p className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-600'}`}>
          {t('dashboard.history.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className={`flex items-center gap-3 mb-8 pb-6 border-b-2 ${darkMode ? 'border-slate-700' : 'border-indigo-100'}`}>
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('dashboard.history.title')}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {proposals.length === 1
              ? t('dashboard.history.oneGenerated')
              : t('dashboard.history.countGenerated', { count: proposals.length })}
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className={`text-center py-20 rounded-xl border-2 border-dashed ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gradient-to-br from-slate-50 to-indigo-50 border-indigo-200'}`}>
          <div className="relative inline-block mb-6">
            <FileText className={`w-28 h-28 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <Sparkles className="w-10 h-10 text-indigo-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className={`text-2xl font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t('dashboard.history.noProposals')}</p>
          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('dashboard.history.generateFirst')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposal List */}
          <div className={`space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar ${
            darkMode ? 'dark-scrollbar' : ''
          }`}>
            {proposals.map((proposal) => (
              <div
                key={proposal._id}
                onClick={() => setSelectedProposal(proposal)}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedProposal?._id === proposal._id
                    ? darkMode
                      ? 'bg-indigo-900/30 border-indigo-500 shadow-lg'
                      : 'bg-indigo-50 border-indigo-400 shadow-lg'
                    : darkMode
                      ? 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {proposal.jobTitle}
                  </h3>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded border ${getToneBadgeColor(proposal.tone)}`}>
                    {proposal.tone}
                  </span>
                </div>

                <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {proposal.jobDescription}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(proposal.createdAt)}</span>
                  </div>
                  {proposal.budget && (
                    <div className={`flex items-center gap-1 font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{proposal.budget}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Proposal Preview */}
          {selectedProposal ? (
            <div className={`p-6 rounded-xl border-2 shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-xl ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {selectedProposal.jobTitle}
                </h3>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                    darkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {t('dashboard.history.close')}
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopyProposal(selectedProposal.generatedProposal, selectedProposal._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    copiedId === selectedProposal._id
                      ? darkMode
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-green-100 text-green-700'
                      : darkMode
                        ? 'bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                  }`}
                >
                  {copiedId === selectedProposal._id ? <Eye className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === selectedProposal._id ? t('dashboard.history.copied') : t('dashboard.history.copy')}
                </button>

                <button
                  onClick={() => handleEditProposal(selectedProposal)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    darkMode 
                      ? 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-300' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {t('dashboard.history.edit')}
                </button>

                <button
                  onClick={() => handleDuplicateProposal(selectedProposal)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    darkMode 
                      ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('dashboard.history.duplicate')}
                </button>

                <button
                  onClick={() => handleDownloadProposal(selectedProposal)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    darkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {t('dashboard.history.download')}
                </button>

                <button
                  onClick={() => handleDelete(selectedProposal._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    darkMode 
                      ? 'bg-red-900/30 hover:bg-red-800/40 text-red-300' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('dashboard.history.delete')}
                </button>
              </div>

              <div className={`p-4 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed custom-scrollbar ${
                darkMode ? 'bg-slate-900/50 text-slate-300 dark-scrollbar' : 'bg-slate-50 text-slate-700'
              }`}>
                {selectedProposal.generatedProposal}
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-center p-12 rounded-xl border-2 border-dashed ${
              darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="text-center">
                <Eye className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('dashboard.history.selectDetails')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalHistory;