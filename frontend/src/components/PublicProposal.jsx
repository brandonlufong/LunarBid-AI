// src/components/PublicProposal.jsx
// Public, no-auth view of a shared proposal at /p/:token. Branded, responsive.
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../locales/LanguageContext.jsx';
import { useParams } from 'react-router-dom';
import { getPublicProposal } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './UI/Toast';
import { Moon, Sparkles, Copy, Check, Printer, Loader2, FileWarning } from 'lucide-react';

const PublicProposal = () => {
  const { token } = useParams();
  const { darkMode } = useTheme();
  const { t } = useLanguage();

  // Shared proposals are private documents: keep them out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicProposal(token);
        setData(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const copy = () => {
    navigator.clipboard.writeText(data?.content || '');
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const bg = darkMode
    ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950'
    : 'bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${bg}`}>
        <div className={`text-center max-w-md p-8 rounded-2xl border-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
          <FileWarning className="w-14 h-14 mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-bold mb-2">Proposal unavailable</h1>
          <p className="text-sm opacity-80">This proposal link is invalid, private, or has been revoked.</p>
        </div>
      </div>
    );
  }

  const branding = data.author?.branding || {};
  const accent = branding.primaryColor || '#6366f1';
  const displayName = branding.companyName || data.author?.name || 'LunarBid User';
  const created = data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className={`min-h-screen py-6 sm:py-12 px-4 ${bg}`}>
      <div className="max-w-3xl mx-auto">
        {/* Action bar (hidden when printing) */}
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button aria-label={copied ? t('a11y.copied') : t('a11y.copy')}
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: accent }}
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>

        {/* Document */}
        <div className={`rounded-2xl shadow-2xl border-2 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} print:shadow-none print:border-0`}>
          {/* Branded header */}
          <div className="p-6 sm:p-8 border-b-2" style={{ borderColor: `${accent}33` }}>
            <div className="flex items-center gap-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={displayName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent }}>
                  <span className="text-white text-2xl font-black">{displayName.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className={`text-xl font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{displayName}</h2>
                {branding.tagline && <p className="text-sm truncate opacity-70" style={{ color: accent }}>{branding.tagline}</p>}
                {branding.website && <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{branding.website}</p>}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="px-6 sm:px-8 pt-6 sm:pt-8">
            <h1 className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{data.jobTitle}</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {data.clientName ? `Prepared for ${data.clientName}` : 'Proposal'}{created ? ` · ${created}` : ''}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <pre className={`whitespace-pre-wrap font-sans text-[15px] leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
{data.content}
            </pre>
          </div>
        </div>

        {/* Footer badge */}
        <div className="flex items-center justify-center gap-2 mt-6 opacity-70 print:hidden">
          <div className="relative">
            <Moon className={`w-5 h-5 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
            <Sparkles className="w-2.5 h-2.5 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Made with LunarBid</span>
        </div>
      </div>
    </div>
  );
};

export default PublicProposal;
