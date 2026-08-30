import { useMemo, useState } from 'react';
import { AlertCircle, Building2, Megaphone, TrendingDown, TrendingUp } from 'lucide-react';
import { ThemeProvider } from '@/context/ThemeContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useBureaus, useGeolocation } from '@/hooks/useBureaus';
import { useAllLocalVendors } from '@/hooks/useLocalVendors';
import { useAuth } from '@/hooks/useAuth';
import { formatCDF } from '@/lib/format';
import { Header } from '@/components/Header';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { RatesDashboard } from '@/components/RatesDashboard';
import { BureauDirectory } from '@/components/BureauDirectory';
import { CommunityReportModal } from '@/components/CommunityReportModal';
import { AuthModal } from '@/components/AuthModal';
import { AccountPanel } from '@/components/AccountPanel';
import { BureauProfile } from '@/components/BureauProfile';
import type { BureauWithRate } from '@/lib/types';

function AppContent() {
  const [tab, setTab] = useState<Tab>('accueil');
  const [reportOpen, setReportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedBureau, setSelectedBureau] = useState<BureauWithRate | null>(null);

  const auth = useAuth();
  const { coords, status: geoStatus, request: requestGeo } = useGeolocation();
  const { bureaus, loading, error, refetch } = useBureaus({
    userLat: coords?.lat,
    userLng: coords?.lng,
  });
  const { vendors: allVendors } = useAllLocalVendors();

  const ownedBureaus = useMemo(
    () => bureaus.filter((b) => auth.ownedBureauIds.includes(b.id)),
    [bureaus, auth.ownedBureauIds]
  );

  const stats = useMemo(() => {
    const verifiedBureaus = bureaus.filter((b) => b.verified);
    const ratesWithSell = bureaus
      .filter((b) => b.latest?.status === 'verified' && b.latest.usd_sell != null)
      .map((b) => b.latest!.usd_sell as number);
    const ratesWithBuy = bureaus
      .filter((b) => b.latest?.status === 'verified' && b.latest.usd_buy != null)
      .map((b) => b.latest!.usd_buy as number);

    const avgSell = ratesWithSell.length
      ? ratesWithSell.reduce((a, b) => a + b, 0) / ratesWithSell.length
      : null;
    const avgBuy = ratesWithBuy.length
      ? ratesWithBuy.reduce((a, b) => a + b, 0) / ratesWithBuy.length
      : null;

    return {
      totalBureaus: bureaus.length,
      verifiedCount: verifiedBureaus.length,
      avgBuy,
      avgSell,
    };
  }, [bureaus]);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === 'signaler') {
      setReportOpen(true);
    } else {
      setTab(newTab);
    }
  };

  function handleAccountClick() {
    if (auth.session) {
      setAccountOpen(true);
    } else {
      setAuthOpen(true);
    }
  }

  function handleAccountChanged() {
    refetch();
    auth.refreshOwnedBureaus();
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="max-w-md rounded-2xl border border-error-200 bg-white p-6 text-center dark:border-error-800 dark:bg-slate-900">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-error-500" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Configuration manquante</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            La connexion à la base de données n'est pas configurée. Vérifiez que les variables
            d'environnement <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">VITE_SUPABASE_URL</code> et{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">VITE_SUPABASE_ANON_KEY</code> sont définies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Header onAccountClick={handleAccountClick} isLoggedIn={!!auth.session} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 sm:pb-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/30 dark:text-error-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Erreur de chargement: {error}
          </div>
        )}

        {tab === 'accueil' && (
          <div className="space-y-5 animate-fade-in">
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-lg shadow-primary-500/20">
              <h2 className="text-xl font-bold sm:text-2xl">Taux de change à Kinshasa</h2>
              <p className="mt-1 text-sm text-primary-100">
                Comparez les taux des bureaux de change en temps réel et trouvez le meilleur cours.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Bureaux actifs"
                value={stats.totalBureaus}
                sublabel={`${stats.verifiedCount} vérifié${stats.verifiedCount > 1 ? 's' : ''}`}
                icon={<Building2 className="h-5 w-5" />}
                accent="primary"
              />
              <StatCard
                label="Taux vente moy."
                value={stats.avgSell != null ? `${formatCDF(stats.avgSell)}` : '—'}
                sublabel="FC pour 1 USD"
                icon={<TrendingUp className="h-5 w-5" />}
                accent="success"
              />
              <StatCard
                label="Taux achat moy."
                value={stats.avgBuy != null ? `${formatCDF(stats.avgBuy)}` : '—'}
                sublabel="FC pour 1 USD"
                icon={<TrendingDown className="h-5 w-5" />}
                accent="accent"
              />
              <StatCard
                label="Signaler"
                value="Contribuer"
                sublabel="Ajouter un taux"
                icon={<Megaphone className="h-5 w-5" />}
                accent="warning"
              />
            </div>

            {/* Converter + quick rates */}
            <div className="grid gap-5 lg:grid-cols-2">
              <CurrencyConverter bureaus={bureaus} />
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Derniers taux</h2>
                  <button
                    onClick={() => setTab('bureaux')}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400"
                  >
                    Voir tout →
                  </button>
                </div>
                {bureaus.length === 0 && !loading ? (
                  <EmptyState
                    icon={<Building2 className="h-8 w-8" />}
                    title="Aucun bureau enregistré pour l'instant"
                    message="Soyez le premier à signaler un bureau de change ou un taux à Kinshasa."
                    action={
                      <button
                        onClick={() => setReportOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                      >
                        <Megaphone className="h-4 w-4" />
                        Signaler un taux
                      </button>
                    }
                  />
                ) : (
                  <RatesDashboard bureaus={bureaus} loading={loading} onSelectBureau={setSelectedBureau} />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'bureaux' && (
          <div className="animate-fade-in">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Bureaux de change</h2>
            <RatesDashboard bureaus={bureaus} loading={loading} onSelectBureau={setSelectedBureau} />
          </div>
        )}

        {tab === 'carte' && (
          <div className="animate-fade-in">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Carte & annuaire</h2>
            <BureauDirectory
              bureaus={bureaus}
              vendors={allVendors}
              loading={loading}
              userCoords={coords}
              geoStatus={geoStatus}
              onLocate={requestGeo}
              onSelectBureau={setSelectedBureau}
            />
          </div>
        )}
      </main>

      {/* Floating signaller button (desktop) */}
      <button
        onClick={() => setReportOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-full bg-accent-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600 sm:bottom-6 sm:right-6"
      >
        <Megaphone className="h-4 w-4" />
        <span className="hidden sm:inline">Signaler un taux</span>
      </button>

      <BottomNav active={tab} onChange={handleTabChange} />

      <CommunityReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        bureaus={bureaus}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {auth.session && (
        <AccountPanel
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          userId={auth.session.user.id}
          profile={auth.profile}
          isAdmin={auth.isAdmin}
          ownedBureaus={ownedBureaus}
          onChanged={handleAccountChanged}
        />
      )}

      <BureauProfile bureau={selectedBureau} onClose={() => setSelectedBureau(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
