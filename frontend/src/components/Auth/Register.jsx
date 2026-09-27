import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { Alert, Button, Field, Input } from '../ui';
import AuthShell from './AuthShell';
import SocialButtons from './SocialButtons';
import PasswordInput from './PasswordInput';

export default function Register() {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const er = {};
    if (form.password.length < 8) er.password = t('auth.register.passwordTooShort');
    if (form.password !== form.confirmPassword) er.confirmPassword = t('auth.register.passwordMismatch');
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password });
      loginUser(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.register.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.register.heading')} subtitle={t('auth.register.sub')}
      footer={<>{t('auth.register.haveAccount')} <Link to="/login" className="font-medium text-accent-text hover:underline">{t('auth.register.signIn')}</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label={t('auth.name')} required>
          <Input autoComplete="name" required maxLength={100} value={form.name} onChange={set('name')} />
        </Field>
        <Field label={t('auth.email')} required>
          <Input type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label={t('auth.password')} required hint={t('auth.register.passwordHint')} error={errors.password}>
          <PasswordInput autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        </Field>
        <Field label={t('auth.confirmPassword')} required error={errors.confirmPassword}>
          <PasswordInput autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>{t('auth.register.submit')}</Button>
        <p className="text-center text-caption text-muted">
          {t('auth.register.agreeToTerms')} <Link to="/terms" className="font-medium text-fg-2 underline underline-offset-2">{t('auth.register.termsOfService')}</Link>{' '}
          {t('auth.register.and')} <Link to="/privacy" className="font-medium text-fg-2 underline underline-offset-2">{t('auth.register.privacyPolicy')}</Link>.
        </p>
      </form>
      <SocialButtons />
    </AuthShell>
  );
}
