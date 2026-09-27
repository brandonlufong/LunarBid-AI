// Shared proposal status badge and date formatting (Home, History, editor).
import React from 'react';
import { Badge } from '../ui';
import { useLanguage } from '../../locales/LanguageContext.jsx';

const TONE = { draft: 'neutral', sent: 'accent', accepted: 'success', rejected: 'danger' };
export const STATUSES = ['draft', 'sent', 'accepted', 'rejected'];

export function StatusBadge({ status = 'draft' }) {
  const { t } = useLanguage();
  return <Badge tone={TONE[status] || 'neutral'} dot>{t(`proposal.status.${status}`)}</Badge>;
}

export function formatDate(value, lang = 'en', withTime = false) {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
