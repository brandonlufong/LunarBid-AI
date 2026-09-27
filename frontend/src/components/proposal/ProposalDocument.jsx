// A proposal presented as a document, with editing, saving and the actions a freelancer needs:
// copy, share a link, export, email to the client and regenerate. Used by the composer and history.
import React, { useEffect, useRef, useState } from 'react';
import {
  Check, Copy, Download, FileText, Link2, Link2Off, MoreHorizontal, PenLine, RefreshCw, Save, Send,
} from 'lucide-react';
import { shareProposal, unshareProposal, updateProposal } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Badge, Button, IconButton, Menu, cn } from '../ui';
import { exportProposal, wordCount } from './exporters';
import SendDialog from './SendDialog';
import { formatDate } from '../Dashboard/proposalMeta.jsx';

export default function ProposalDocument({
  id, title, clientName, createdAt, text, isTemplate, isPublic: isPublicProp = false,
  onSaved, onRegenerate, regenerating = false, onSent, headerActions, className,
}) {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [value, setValue] = useState(text || '');
  const [saved, setSaved] = useState(text || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(isPublicProp);
  const editorRef = useRef(null);
  const dirty = value !== saved;

  // A new proposal (new id or regenerated text) replaces the document.
  useEffect(() => { setValue(text || ''); setSaved(text || ''); setEditing(false); }, [id, text]);
  useEffect(() => { setIsPublic(isPublicProp); }, [isPublicProp, id]);
  useEffect(() => { if (editing) editorRef.current?.focus(); }, [editing]);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    if (!dirty || !id) return true;
    setSaving(true);
    try {
      await updateProposal(id, { editedProposal: value });
      setSaved(value);
      onSaved?.(value);
      toast.success(t('doc.saved'));
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || t('doc.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = async () => {
    if (editing && dirty && !(await save())) return;
    setEditing((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t('doc.copied'));
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t('doc.copyError'));
    }
  };

  const share = async () => {
    if (!id) return;
    try {
      if (dirty) await save();
      const res = await shareProposal(id);
      const url = `${window.location.origin}/p/${res.data.shareToken}`;
      setIsPublic(true);
      try { await navigator.clipboard.writeText(url); toast.success(t('doc.linkCopied')); }
      catch { toast.info(url); }
    } catch {
      toast.error(t('doc.shareError'));
    }
  };

  const unshare = async () => {
    try {
      await unshareProposal(id);
      setIsPublic(false);
      toast.success(t('doc.unshared'));
    } catch {
      toast.error(t('doc.shareError'));
    }
  };

  const doExport = (format) => {
    const ok = exportProposal(format, { title, text: value });
    if (!ok) toast.error(t('doc.popupBlocked'));
  };

  const exportItems = [
    { label: t('doc.export.pdf'), icon: FileText, onSelect: () => doExport('pdf') },
    { label: t('doc.export.word'), icon: FileText, onSelect: () => doExport('word') },
    { label: t('doc.export.md'), icon: FileText, onSelect: () => doExport('md') },
    { label: t('doc.export.txt'), icon: FileText, onSelect: () => doExport('txt') },
  ];
  const moreItems = [
    { label: t('doc.shareLink'), icon: Link2, onSelect: share },
    ...(isPublic ? [{ label: t('doc.stopSharing'), icon: Link2Off, onSelect: unshare }] : []),
    { label: t('doc.send'), icon: Send, onSelect: () => setSendOpen(true) },
    'separator',
    ...exportItems,
    ...(onRegenerate ? ['separator', { label: t('doc.regenerate'), icon: RefreshCw, onSelect: onRegenerate, disabled: regenerating }] : []),
  ];

  const meta = [clientName && t('doc.preparedFor', { name: clientName }), formatDate(createdAt, currentLanguage)].filter(Boolean).join(' · ');

  return (
    <article className={cn('flex flex-col rounded-lg border border-line bg-surface shadow-card', className)} aria-labelledby="doc-title">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
        <Button variant={editing ? 'primary' : 'secondary'} size="sm" leftIcon={editing ? Check : PenLine} onClick={toggleEdit} loading={saving && editing}>
          {editing ? t('doc.done') : t('doc.edit')}
        </Button>
        {dirty && (
          <Button variant="ghost" size="sm" leftIcon={Save} onClick={save} loading={saving}>{t('doc.save')}</Button>
        )}
        <span className="text-caption text-muted" aria-live="polite">
          {dirty ? t('doc.unsaved') : saved ? t('doc.allSaved') : ''}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon={copied ? Check : Copy} label={copied ? t('doc.copiedShort') : t('doc.copy')} onClick={copy} size="sm" />
          <div className="hidden items-center gap-1 sm:flex">
            <IconButton icon={Link2} label={t('doc.shareLink')} onClick={share} size="sm" />
            <Menu items={exportItems} trigger={(p) => <IconButton icon={Download} label={t('doc.exportLabel')} size="sm" {...p} />} />
            <IconButton icon={Send} label={t('doc.send')} onClick={() => setSendOpen(true)} size="sm" />
            {onRegenerate && <IconButton icon={RefreshCw} label={t('doc.regenerate')} onClick={onRegenerate} disabled={regenerating} size="sm" />}
            {isPublic && (
              <Menu items={[{ label: t('doc.stopSharing'), icon: Link2Off, onSelect: unshare }]}
                trigger={(p) => <button type="button" {...p} className="ml-1"><Badge tone="accent">{t('doc.shared')}</Badge></button>} />
            )}
          </div>
          <div className="sm:hidden">
            <Menu items={moreItems} trigger={(p) => <IconButton icon={MoreHorizontal} label={t('doc.more')} size="sm" {...p} />} />
          </div>
          {headerActions}
        </div>
      </div>

      {/* Document */}
      <div className="px-5 py-6 sm:px-10 sm:py-9">
        {isTemplate && (
          <Alert tone="warning" className="mb-6" title={t('doc.templateTitle')}>{t('doc.templateBody')}</Alert>
        )}
        <header className="mb-6 border-b border-line pb-5">
          <h2 id="doc-title" className="font-document text-[1.625rem] font-medium leading-tight text-fg">{title || t('doc.untitled')}</h2>
          {meta && <p className="mt-2 text-small text-muted">{meta}</p>}
        </header>
        {editing ? (
          <textarea ref={editorRef} value={value} onChange={(e) => setValue(e.target.value)} aria-label={t('doc.editorLabel')}
            maxLength={20000}
            className="prose-document min-h-[420px] w-full resize-y rounded-md border border-line-strong bg-surface p-4 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20" />
        ) : (
          <div className="prose-document max-w-[68ch]">{value}</div>
        )}
        <p className="mt-6 text-caption text-muted">{t('doc.words', { count: wordCount(value) })}</p>
      </div>

      <SendDialog open={sendOpen} onClose={() => setSendOpen(false)} proposalId={id} title={title} getText={() => value}
        onSent={() => { setSaved(value); onSent?.(); }} />
    </article>
  );
}
