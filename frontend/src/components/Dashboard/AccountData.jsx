// "Your data" section: export everything, or delete the account (with confirmation).
import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportAccountData, deleteAccount } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Alert, Button, Card, CardHeader, Field, Input, Modal } from '../ui';
import PasswordInput from '../Auth/PasswordInput';

export default function AccountData() {
  const { user, logoutUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const usesPassword = user?.hasPassword !== false;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportAccountData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lunarbid-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('dashboard.account.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setError('');
    try {
      await deleteAccount(usesPassword ? { password: confirmValue } : { confirmEmail: confirmValue });
      logoutUser();
      navigate('/', { replace: true, state: { accountDeleted: true } });
    } catch (err) {
      setError(err.response?.data?.message || t('dashboard.account.deleteError'));
      setDeleting(false);
    }
  };


  return (
    <Card id="data" aria-labelledby="account-data-title" className="scroll-mt-20">
      <CardHeader titleId="account-data-title" title={t('dashboard.account.title')} description={t('dashboard.account.subtitle')} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" leftIcon={Download} onClick={handleExport} loading={exporting}>{t('dashboard.account.export')}</Button>
        <Button variant="danger-ghost" leftIcon={Trash2} onClick={() => { setOpen(true); setConfirmValue(''); setError(''); }}>{t('dashboard.account.delete')}</Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('dashboard.account.confirmTitle')} description={t('dashboard.account.confirmBody')}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>{t('dashboard.account.cancel')}</Button>
          <Button variant="danger" type="submit" form="delete-form" loading={deleting} disabled={!confirmValue}>{t('dashboard.account.confirmDelete')}</Button>
        </>}>
        <form id="delete-form" onSubmit={handleDelete} className="space-y-3">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field id="delete-confirm" label={usesPassword ? t('dashboard.account.passwordLabel') : t('dashboard.account.emailLabel', { email: user?.email })} required>
            {usesPassword
              ? <PasswordInput id="delete-confirm" autoComplete="current-password" required value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} />
              : <Input id="delete-confirm" type="email" autoComplete="off" required value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} />}
          </Field>
        </form>
      </Modal>
    </Card>
  );
}
