// The signed-in frame: sidebar navigation on desktop, top bar + drawer on smaller screens.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, FilePlus2, Files, Users, BarChart3, Calculator, Palette, Settings, CreditCard, LifeBuoy,
  Menu as MenuIcon, X, LogOut, Moon, Sun, Languages, ChevronsUpDown, Check,
} from 'lucide-react';
import { Logo } from './Logo';
import { Avatar, Badge, Button, IconButton, Menu, UsageMeter, cn } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../locales/LanguageContext.jsx';

export const NAV = [
  { section: 'workspace', items: [
    { id: 'home', icon: Home },
    { id: 'generate', icon: FilePlus2 },
    { id: 'history', icon: Files },
    { id: 'clients', icon: Users, feature: 'clientProfiles', requires: 'Starter' },
  ] },
  { section: 'tools', items: [
    { id: 'calculator', icon: Calculator },
    { id: 'analytics', icon: BarChart3, feature: 'analytics', requires: 'Pro' },
  ] },
  { section: 'account', items: [
    { id: 'profile', icon: Settings },
    { id: 'branding', icon: Palette, feature: 'customBranding', requires: 'Pro' },
    { id: 'subscription', icon: CreditCard },
    { id: 'support', icon: LifeBuoy },
  ] },
];

function NavList({ active, onNavigate, features }) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t('shell.navLabel')} className="space-y-6">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-2.5 text-caption font-medium uppercase tracking-wider text-muted">{t(`shell.sections.${group.section}`)}</p>
          <ul className="space-y-0.5">
            {group.items.map(({ id, icon: Icon, feature, requires }) => {
              const current = active === id;
              const locked = feature && features && !features[feature];
              return (
                <li key={id}>
                  <button type="button" onClick={() => onNavigate(id)} aria-current={current ? 'page' : undefined}
                    className={cn('group flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-body font-medium transition-colors duration-150',
                      current ? 'bg-accent-soft text-accent-text' : 'text-fg-2 hover:bg-subtle hover:text-fg')}>
                    <Icon className={cn('h-4 w-4 shrink-0', current ? 'text-accent-text' : 'text-muted group-hover:text-fg-2')} aria-hidden="true" />
                    <span className="flex-1 truncate text-left">{t(`shell.nav.${id}`)}</span>
                    {locked && <Badge tone="neutral" className="!px-1.5 !py-0 !text-[0.6875rem]">{requires}</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function PlanCard({ subscription, onNavigate }) {
  const { t } = useLanguage();
  if (!subscription?.subscription) return null;
  const plan = subscription.subscription.plan;
  const usage = subscription.usage || {};
  const limits = subscription.limits || {};
  return (
    <div className="rounded-lg border border-line bg-subtle p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-small font-medium text-fg">{t('shell.planName', { plan: t(`shell.plans.${plan}`) })}</span>
        {plan === 'free' && (
          <button type="button" onClick={() => onNavigate('subscription')} className="text-small font-medium text-accent-text hover:underline">
            {t('shell.upgrade')}
          </button>
        )}
      </div>
      {limits.dailyProposals != null && !limits.fairUse ? (
        <UsageMeter label={t('shell.proposalsToday')} used={usage.proposalsToday || 0} limit={limits.dailyProposals} />
      ) : limits.monthlyProposals != null ? (
        <UsageMeter label={t('shell.proposalsThisMonth')} used={usage.proposalsThisMonth || 0} limit={limits.monthlyProposals} />
      ) : (
        <p className="text-small text-muted">{t('shell.unlimitedProposals')}</p>
      )}
    </div>
  );
}

function UserMenu({ onNavigate, compact }) {
  const { user, logoutUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const items = [
    { label: t('shell.nav.profile'), icon: Settings, onSelect: () => onNavigate('profile') },
    { label: t('shell.nav.subscription'), icon: CreditCard, onSelect: () => onNavigate('subscription') },
    'separator',
    { label: darkMode ? t('shell.lightMode') : t('shell.darkMode'), icon: darkMode ? Sun : Moon, onSelect: toggleTheme },
    { label: 'English', icon: currentLanguage === 'en' ? Check : Languages, onSelect: () => changeLanguage('en') },
    { label: 'Français', icon: currentLanguage === 'fr' ? Check : Languages, onSelect: () => changeLanguage('fr') },
    'separator',
    { label: t('shell.signOut'), icon: LogOut, onSelect: () => { logoutUser(); window.location.assign('/login'); } },
  ];
  return (
    <Menu align={compact ? 'end' : 'start'} className={compact ? '' : 'w-full'} items={items}
      trigger={(props) => compact ? (
        <button type="button" {...props} aria-label={t('shell.accountMenu')} className="rounded-full">
          <Avatar name={user?.name} src={user?.avatar} size={32} />
        </button>
      ) : (
        <button type="button" {...props} aria-label={t('shell.accountMenu')}
          className="flex w-full items-center gap-2.5 rounded-md p-2 text-left hover:bg-subtle">
          <Avatar name={user?.name} src={user?.avatar} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small font-medium text-fg">{user?.name}</span>
            <span className="block truncate text-caption text-muted">{user?.email}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </button>
      )} />
  );
}

function Drawer({ open, onClose, children }) {
  const ref = useRef(null);
  const { t } = useLanguage();
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={t('shell.navLabel')}
        className="animate-pop absolute inset-y-0 left-0 flex w-[86%] max-w-[300px] flex-col border-r border-line bg-surface shadow-modal">
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo />
          <IconButton icon={X} label={t('shell.closeMenu')} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AppShell({ active, onNavigate, subscription, children }) {
  const { t } = useLanguage();
  const [drawer, setDrawer] = useState(false);
  const go = (id) => { setDrawer(false); onNavigate(id); };
  const features = subscription?.features;

  const sidebarBody = (
    <>
      <div className="p-3">
        <Button className="w-full" leftIcon={FilePlus2} onClick={() => go('generate')}>{t('shell.newProposal')}</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        <NavList active={active} onNavigate={go} features={features} />
      </div>
      <div className="space-y-2 border-t border-line p-3">
        <PlanCard subscription={subscription} onNavigate={go} />
        <UserMenu onNavigate={go} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-page">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow-pop">
        {t('shell.skipToContent')}
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Link to="/dashboard?tab=home" aria-label={t('shell.home')}><Logo /></Link>
        </div>
        {sidebarBody}
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur lg:hidden">
        <IconButton icon={MenuIcon} label={t('shell.openMenu')} onClick={() => setDrawer(true)} />
        <Link to="/dashboard?tab=home" aria-label={t('shell.home')} className="mr-auto"><Logo size={26} /></Link>
        <Button size="sm" leftIcon={FilePlus2} onClick={() => go('generate')} className="max-[359px]:hidden">{t('shell.newShort')}</Button>
        <UserMenu onNavigate={go} compact />
      </header>
      <Drawer open={drawer} onClose={() => setDrawer(false)}>{sidebarBody}</Drawer>

      <main id="main" tabIndex={-1} className="outline-none lg:pl-64">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
