// Settings: profile (what the AI may say about you), preferences, security and your data.
import React, { useEffect, useState } from 'react';
import { Database, Monitor, Shield, User } from 'lucide-react';
import { getProfile, updateProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';
import { useToast } from '../UI/Toast';
import { Button, Card, CardHeader, Field, Input, PageHeader, Segmented, Skeleton, Textarea, cn } from '../ui';
import AccountSecurity from './AccountSecurity';
import AccountData from './AccountData';

const SECTIONS = [
  { id: 'profile', icon: User },
  { id: 'preferences', icon: Monitor },
  { id: 'security', icon: Shield },
  { id: 'data', icon: Database },
];
const EMPTY = { role: '', experience: '', skills: '', hourlyRate: '', portfolio: '', bio: '', preferredTone: 'Professional' };

function ProfileSection() {
  const { updateUser, user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((r) => setForm({ ...EMPTY, ...(r.data || {}) })).catch(() => setForm({ ...EMPTY }));
  }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { role, experience, skills, hourlyRate, portfolio, bio, preferredTone } = form;
      const res = await updateProfile({ role, experience, skills, hourlyRate, portfolio, bio, preferredTone });
      updateUser({ ...user, ...res.data });
      toast.success(t('settings.profile.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('settings.profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="profile" aria-labelledby="profile-title" className="scroll-mt-20">
      <CardHeader titleId="profile-title" title={t('settings.profile.title')} description={t('settings.profile.subtitle')} />
      {!form ? (
        <div className="space-y-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('settings.profile.role')} hint={t('settings.profile.roleHint')}>
              <Input value={form.role} onChange={set('role')} maxLength={100} placeholder={t('settings.profile.rolePlaceholder')} />
            </Field>
            <Field label={t('settings.profile.rate')} optional={t('common.optional')} hint={t('settings.profile.rateHint')}>
              <Input value={form.hourlyRate} onChange={set('hourlyRate')} maxLength={50} placeholder="$60/hour" />
            </Field>
          </div>
          <Field label={t('settings.profile.skills')} hint={t('settings.profile.skillsHint')}>
            <Input value={form.skills} onChange={set('skills')} maxLength={500} placeholder={t('settings.profile.skillsPlaceholder')} />
          </Field>
          <Field label={t('settings.profile.experience')} hint={t('settings.profile.experienceHint')} counter={`${form.experience.length} / 2,000`}>
            <Textarea rows={4} value={form.experience} onChange={set('experience')} maxLength={2000} placeholder={t('settings.profile.experiencePlaceholder')} />
          </Field>
          <Field label={t('settings.profile.bio')} optional={t('common.optional')} counter={`${form.bio.length} / 2,000`}>
            <Textarea rows={3} value={form.bio} onChange={set('bio')} maxLength={2000} />
          </Field>
          <Field label={t('settings.profile.portfolio')} optional={t('common.optional')}>
            <Input type="url" value={form.portfolio} onChange={set('portfolio')} maxLength={300} placeholder="https://" />
          </Field>
          <div>
            <p className="mb-1.5 text-small font-medium text-fg">{t('settings.profile.tone')}</p>
            <Segmented label={t('settings.profile.tone')} value={form.preferredTone} onChange={set('preferredTone')} describedBy="pref-tone-help"
              options={[
                { value: 'Professional', label: t('composer.tones.formal') },
                { value: 'Friendly', label: t('composer.tones.friendly') },
                { value: 'Persuasive', label: t('composer.tones.persuasive') },
              ]} className="max-w-md" />
            <p id="pref-tone-help" className="mt-1.5 text-caption text-muted">{t('settings.profile.toneHint')}</p>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted">{t('settings.profile.honesty')}</p>
            <Button type="submit" loading={saving}>{t('settings.profile.save')}</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function PreferencesSection() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { darkMode, toggleTheme } = useTheme();
  return (
    <Card id="preferences" aria-labelledby="prefs-title" className="scroll-mt-20">
      <CardHeader titleId="prefs-title" title={t('settings.prefs.title')} description={t('settings.prefs.subtitle')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-small font-medium text-fg">{t('settings.prefs.language')}</p>
          <Segmented label={t('settings.prefs.language')} value={currentLanguage} onChange={changeLanguage}
            options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }]} />
        </div>
        <div>
          <p className="mb-1.5 text-small font-medium text-fg">{t('settings.prefs.theme')}</p>
          <Segmented label={t('settings.prefs.theme')} value={darkMode ? 'dark' : 'light'} onChange={(v) => { if ((v === 'dark') !== darkMode) toggleTheme(); }}
            options={[{ value: 'light', label: t('settings.prefs.light') }, { value: 'dark', label: t('settings.prefs.dark') }]} />
        </div>
      </div>
    </Card>
  );
}

export default function ProfileSetup() {
  const { t } = useLanguage();
  const [active, setActive] = useState('profile');
  const jump = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />
      <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label={t('settings.sectionsLabel')} className="flex gap-1 overflow-x-auto lg:sticky lg:top-6 lg:flex-col">
          {SECTIONS.map(({ id, icon: Icon }) => (
            <button key={id} type="button" onClick={() => jump(id)} aria-current={active === id ? 'true' : undefined}
              className={cn('flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-body font-medium transition-colors',
                active === id ? 'bg-accent-soft text-accent-text' : 'text-fg-2 hover:bg-subtle hover:text-fg')}>
              <Icon className="h-4 w-4" aria-hidden="true" />{t(`settings.sections.${id}`)}
            </button>
          ))}
        </nav>
        <div className="min-w-0 space-y-6">
          <ProfileSection />
          <PreferencesSection />
          <AccountSecurity />
          <AccountData />
        </div>
      </div>
    </div>
  );
}
