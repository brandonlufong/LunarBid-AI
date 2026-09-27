import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Alert, Button, Field, Input } from '../ui';
import AuthShell from './AuthShell';
import SocialButtons from './SocialButtons';
import PasswordInput from './PasswordInput';

// Messages passed back in the URL (OAuth errors, ended sessions).
function initialMessage(t) {
  const p = new URLSearchParams(window.location.search);
  const e = p.get('error');
  if (e === 'oauth_unconfigured') return { tone: 'warning', text: t('auth.oauth.unconfigured', { provider: (p.get('provider') || 'OAuth').replace(/^./, (c) => c.toUpperCase()) }) };
  if (e === 'oauth_unverified_email') return { tone: 'warning', text: t('auth.oauth.unverified') };
  if (e === 'oauth_failed' || e === 'oauth_no_email') return { tone: 'danger', text: t('auth.oauth.failed') };
  const session = p.get('session');
  if (session === 'revoked') return { tone: 'info', text: t('auth.login.sessionRevoked') };
  if (session === 'expired') return { tone: 'info', text: t('auth.login.sessionExpired') };
  return null;
}

export default function Login() {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => initialMessage(t));

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
    } catch (err) {
      setMessage({ tone: 'danger', text: err.response?.data?.message || t('auth.login.failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.login.heading')} subtitle={t('auth.login.sub')}
      footer={<>{t('auth.login.noAccount')} <Link to="/register" className="font-medium text-accent-text hover:underline">{t('auth.login.createOne')}</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Field label={t('auth.email')} required>
          <Input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label={t('auth.password')} required
          labelAction={<Link to="/forgot-password" className="text-small font-medium text-accent-text hover:underline">{t('auth.login.forgot')}</Link>}>
          <PasswordInput autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>{t('auth.login.submit')}</Button>
      </form>
      <SocialButtons />
    </AuthShell>
  );
}
