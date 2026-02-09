import React, { useState, useEffect } from 'react';
import { getProposalHistory, deleteProposal } from '../../services/api';
import { FileText, Trash2, Eye, Loader2, Clock, DollarSign, Sparkles, Copy, Edit, RefreshCw, Download, Share2 } from 'lucide-react';

const ProposalHistory = ({ refreshTrigger, onEditProposal, onDuplicateProposal }) => {
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
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    try {
      await deleteProposal(id);
      setProposals(proposals.filter(p => p._id !== id));
      if (selectedProposal?._id === id) setSelectedProposal(null);
    } catch (error) {
      alert('Failed to delete proposal');
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
      case 'formal': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'friendly': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'persuasive': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 border-2 border-purple-100 dark:border-slate-700 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-200 font-medium">
            Loading your proposal history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border-2 border-purple-100 dark:border-slate-700 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-purple-100 dark:border-slate-700">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Proposal History
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-1 font-medium">
            {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'} generated
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl border-2 border-dashed border-indigo-200 dark:border-slate-700 transition-colors duration-300">
          <div className="relative inline-block mb-6">
            <FileText className="w-28 h-28 text-slate-300 dark:text-slate-600" />
            <Sparkles className="w-10 h-10 text-indigo-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">No proposals yet</p>
          <p className="text-lg text-slate-500 dark:text-slate-400">Generate your first winning proposal to see it here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposal List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {proposals.map((proposal) => (
              <div
                key={proposal._id}
                onClick={() => setSelectedProposal(proposal)}
                className={`
                  p-5 rounded-xl cursor-pointer transition-all duration-300 border-2
                  ${selectedProposal?._id === proposal._id
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700 border-indigo-400 shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md'
                  }
                `}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-200 truncate mb-2">
                      {proposal.jobTitle}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(proposal.createdAt)}</span>
                    </div>

                    {proposal.budget && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3">
                        <DollarSign className="w-4 h-4" />
                        <span>{proposal.budget}</span>
                      </div>
                    )}
                    
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border-2 ${getToneBadgeColor(proposal.tone)}`}>
                      {proposal.tone.charAt(0).toUpperCase() + proposal.tone.slice(1)}
                    </span>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyProposal(proposal.generatedProposal, proposal._id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                        title="Copy proposal"
                      >
                        {copiedId === proposal._id ? (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProposal(proposal);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                        title="Edit & reuse"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProposal(proposal);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                        title="Duplicate proposal"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Duplicate
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProposal(proposal);
                      }}
                      className="p-2.5 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-indigo-100 dark:border-slate-600 group"
                      title="View"
                    >
                      <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(proposal._id);
                      }}
                      className="p-2.5 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border-2 border-red-100 dark:border-red-900/30 group"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Proposal Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg transition-colors duration-300">
            {selectedProposal ? (
              <div className="h-[600px] flex flex-col">
                {/* Preview Header with Actions */}
                <div className="p-6 border-b-2 border-indigo-100 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-200 mb-3">
                        {selectedProposal.jobTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(selectedProposal.createdAt)}</span>
                        </div>
                        {selectedProposal.clientName && (
                          <span className="font-medium">Client: {selectedProposal.clientName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyProposal(selectedProposal.generatedProposal, selectedProposal._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      {copiedId === selectedProposal._id ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Text
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadProposal(selectedProposal)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>

                    <button
                      onClick={() => handleEditProposal(selectedProposal)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      Edit & Reuse
                    </button>

                    <button
                      onClick={() => handleDuplicateProposal(selectedProposal)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Duplicate
                    </button>
                  </div>
                </div>

                {/* Proposal Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/50 rounded-xl p-6 border-2 border-indigo-100 dark:border-slate-700">
                    <pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
                      {selectedProposal.generatedProposal}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800/50 rounded-xl text-slate-400">
                <div className="text-center p-8">
                  <Eye className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-xl font-bold text-slate-500 dark:text-slate-300 mb-2">Select a proposal to preview</p>
                  <p className="text-sm text-slate-400 dark:text-slate-400">Click on any proposal to view its full content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalHistory;