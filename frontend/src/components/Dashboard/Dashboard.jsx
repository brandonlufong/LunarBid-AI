// Signed-in app. The active screen comes from the URL (?tab=...), so reloads keep the
// screen, the Back button works, and Stripe can return users to ?tab=subscription.
import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getSubscription } from '../../services/api';
import AppShell, { NAV } from '../app/AppShell';
import VerifyEmailBanner from './VerifyEmailBanner';
import Home from './Home';
import ProposalForm from './ProposalForm';
import ProposalHistory from './ProposalHistory';
import ClientProfiles from './ClientProfiles';
import Branding from './Branding';
import ProfileSetup from './ProfileSetup';
import Subscription from './Subscription';
import PricingCalculator from './PricingCalculator';
import Support from './Support';
import { Skeleton } from '../ui';

// Analytics pulls in the chart library, so it loads only when its tab is opened.
const Analytics = lazy(() => import('./Analytics'));

const TABS = new Set(NAV.flatMap((g) => g.items.map((i) => i.id)));

export default function Dashboard() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') || location.state?.tab;
  const activeTab = TABS.has(requested) ? requested : 'home';

  const [subscription, setSubscription] = useState(null);
  const [subscriptionRefresh, setSubscriptionRefresh] = useState(0);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [editingProposal, setEditingProposal] = useState(null);

  useEffect(() => {
    getSubscription().then((res) => setSubscription(res.data)).catch(() => setSubscription(null));
  }, [subscriptionRefresh]);

  const onNavigate = useCallback((tab, extra = {}) => {
    if (tab !== 'generate') setEditingProposal(null);
    setParams({ tab, ...extra });
    window.scrollTo(0, 0);
  }, [setParams]);

  const refreshUsage = () => setSubscriptionRefresh((n) => n + 1);

  // "Use as a starting point" from history: prefill the composer with that job.
  const handleEditProposal = (proposal) => {
    setEditingProposal({
      jobTitle: proposal.jobTitle,
      jobDescription: proposal.jobDescription,
      clientName: proposal.clientName || '',
      budget: proposal.budget || '',
      tone: proposal.tone || 'friendly',
      length: proposal.length || 'medium',
    });
    setParams({ tab: 'generate' });
  };

  return (
    <AppShell active={activeTab} onNavigate={onNavigate} subscription={subscription}>
      <VerifyEmailBanner />
      {activeTab === 'home' && (
        <Home subscription={subscription} onNavigate={onNavigate} onOpenProposal={(id) => onNavigate('history', { id })} />
      )}
      {activeTab === 'generate' && (
        <ProposalForm
          editingProposal={editingProposal}
          subscription={subscription}
          onProposalGenerated={() => { setRefreshHistory((n) => n + 1); refreshUsage(); }}
          onNavigate={onNavigate}
        />
      )}
      {activeTab === 'history' && (
        <ProposalHistory refreshTrigger={refreshHistory} onEditProposal={handleEditProposal}
          selectedId={params.get('id')} onNavigate={onNavigate} />
      )}
      {activeTab === 'clients' && (
        <ClientProfiles onNavigate={onNavigate}
          onStartProposal={(prefill) => { setEditingProposal({ jobTitle: '', jobDescription: '', budget: '', ...Object.fromEntries(Object.entries(prefill).filter(([, v]) => v)) }); setParams({ tab: 'generate' }); }} />
      )}
      {activeTab === 'analytics' && (
        <Suspense fallback={<div className="space-y-4" role="status" aria-label="Loading"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>}>
          <Analytics onNavigate={onNavigate} />
        </Suspense>
      )}
      {activeTab === 'calculator' && <PricingCalculator />}
      {activeTab === 'branding' && <Branding onNavigate={onNavigate} />}
      {activeTab === 'profile' && <ProfileSetup />}
      {activeTab === 'subscription' && <Subscription onSubscriptionChange={refreshUsage} />}
      {activeTab === 'support' && <Support />}
    </AppShell>
  );
}
