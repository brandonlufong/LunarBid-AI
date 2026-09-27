// Proposal history: filterable list + the selected proposal as a document.
// On small screens the list and the document are separate views.
import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Copy as CopyIcon, FilePlus2, Files, Trash2 } from 'lucide-react';
import { deleteProposal, getProposal, getProposalHistory, updateProposalStatus } from '../../services/api';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Button, Card, EmptyState, IconButton, Modal, PageHeader, Select, Skeleton, cn } from '../ui';
import ProposalDocument from '../proposal/ProposalDocument';
import { STATUSES, StatusBadge, formatDate } from './proposalMeta.jsx';

const FILTERS = ['all', ...STATUSES];

export default function ProposalHistory({ refreshTrigger, onEditProposal, selectedId, onNavigate }) {
  const { t, currentLanguage } = useLanguage();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    setItems(null);
    getProposalHistory(null, filter === 'all' ? undefined : filter)
      .then((r) => { setItems(r.data.items || []); setNextCursor(r.data.nextCursor || null); })
      .catch(() => { setItems([]); setFailed(true); });
  }, [filter]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  // Open the proposal given in the URL (e.g. from Home), even if it isn't on the first page.
  useEffect(() => {
    if (!selectedId) return;
    const hit = items?.find((p) => p._id === selectedId);
    if (hit) setSelected(hit); // eslint-disable-line react-hooks/set-state-in-effect
    else if (items) getProposal(selectedId).then((r) => setSelected(r.data)).catch(() => {});
  }, [selectedId, items]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await getProposalHistory(nextCursor, filter === 'all' ? undefined : filter);
      setItems((prev) => [...prev, ...(r.data.items || [])]);
      setNextCursor(r.data.nextCursor || null);
    } catch {
      toast.error(t('history.loadMoreError'));
    } finally {
      setLoadingMore(false);
    }
  };

  const select = (p) => { setSelected(p); onNavigate?.('history', { id: p._id }); };
  const back = () => { setSelected(null); onNavigate?.('history'); };

  const patchLocal = (id, patch) => {
    setItems((prev) => prev?.map((p) => (p._id === id ? { ...p, ...patch } : p)));
    setSelected((s) => (s && s._id === id ? { ...s, ...patch } : s));
  };

  const changeStatus = async (status) => {
    const id = selected._id;
    const previous = selected.status;
    patchLocal(id, { status });
    try {
      await updateProposalStatus(id, status);
      toast.success(t('history.statusUpdated', { status: t(`proposal.status.${status}`) }));
    } catch {
      patchLocal(id, { status: previous });
      toast.error(t('history.statusError'));
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteProposal(selected._id);
      setItems((prev) => prev.filter((p) => p._id !== selected._id));
      setConfirmDelete(false);
      back();
      toast.success(t('history.deleted'));
    } catch {
      toast.error(t('history.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const list = (
    <Card padded={false} className={cn(selected && 'hidden lg:block')}>
      <div className="flex gap-1 overflow-x-auto border-b border-line p-2" role="tablist" aria-label={t('history.filterLabel')}>
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={cn('h-8 shrink-0 rounded-md px-3 text-small font-medium transition-colors',
              filter === f ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-subtle hover:text-fg')}>
            {f === 'all' ? t('history.all') : t(`proposal.status.${f}`)}
          </button>
        ))}
      </div>
      {items === null ? (
        <div className="space-y-4 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11" />)}</div>
      ) : failed ? (
        <div className="p-4"><Alert tone="danger" action={<Button size="sm" variant="secondary" onClick={load}>{t('common.retry')}</Button>}>{t('history.loadError')}</Alert></div>
      ) : items.length === 0 ? (
        filter === 'all' ? (
          <EmptyState icon={Files} title={t('history.emptyTitle')} description={t('history.emptyBody')}
            actions={<Button leftIcon={FilePlus2} onClick={() => onNavigate?.('generate')}>{t('shell.newProposal')}</Button>} />
        ) : (
          <EmptyState title={t('history.emptyFilter', { status: t(`proposal.status.${filter}`).toLowerCase() })} />
        )
      ) : (
        <ul className="divide-y divide-line">
          {items.map((p) => {
            const current = selected?._id === p._id;
            return (
              <li key={p._id}>
                <button type="button" onClick={() => select(p)} aria-current={current ? 'true' : undefined}
                  className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
                    current ? 'bg-accent-soft' : 'hover:bg-subtle')}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-fg">{p.jobTitle}</p>
                    <p className={cn('mt-0.5 truncate text-small', current ? 'text-fg-2' : 'text-muted')}>
                      {[p.clientName, formatDate(p.createdAt, currentLanguage)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {nextCursor && (
        <div className="border-t border-line p-3">
          <Button variant="secondary" className="w-full" onClick={loadMore} loading={loadingMore}>{t('history.loadMore')}</Button>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <PageHeader title={t('history.title')} description={t('history.subtitle')}
        actions={<Button leftIcon={FilePlus2} onClick={() => onNavigate?.('generate')}>{t('shell.newProposal')}</Button>} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {list}
        <div className={cn(!selected && 'hidden lg:block')}>
          {selected ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={back} className="lg:hidden">{t('history.back')}</Button>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="status-select" className="text-small font-medium text-fg">{t('history.statusLabel')}</label>
                <div className="w-36">
                  <Select id="status-select" value={selected.status || 'draft'} onChange={(e) => changeStatus(e.target.value)} className="!h-9">
                    {STATUSES.map((s) => <option key={s} value={s}>{t(`proposal.status.${s}`)}</option>)}
                  </Select>
                </div>
                <div className="ml-auto flex gap-1">
                  <Button variant="secondary" size="sm" leftIcon={CopyIcon} onClick={() => onEditProposal?.(selected)}>{t('history.reuse')}</Button>
                  <IconButton icon={Trash2} label={t('history.delete')} variant="danger-ghost" size="sm" onClick={() => setConfirmDelete(true)} />
                </div>
              </div>
              <ProposalDocument key={selected._id} id={selected._id} title={selected.jobTitle} clientName={selected.clientName}
                createdAt={selected.createdAt} text={selected.editedProposal || selected.generatedProposal} isPublic={!!selected.isPublic}
                onSaved={(text) => patchLocal(selected._id, { editedProposal: text })}
                onSent={() => patchLocal(selected._id, { status: 'sent', isPublic: true })} />
            </div>
          ) : items?.length ? (
            <Card><EmptyState icon={Files} title={t('history.selectTitle')} description={t('history.selectBody')} /></Card>
          ) : null}
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} size="sm" title={t('history.confirmTitle')}
        description={t('history.confirmBody', { title: selected?.jobTitle || '' })}
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" loading={deleting} onClick={remove}>{t('history.delete')}</Button>
        </>}>
        <p className="text-small text-muted">{t('history.confirmNote')}</p>
      </Modal>
    </div>
  );
}
