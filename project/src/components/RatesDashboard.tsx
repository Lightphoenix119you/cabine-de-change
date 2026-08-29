import { useMemo, useState } from 'react';
import { Building2, Filter, Search, ShieldAlert } from 'lucide-react';
import type { BureauWithRate } from '@/lib/types';
import { MUNICIPALITIES } from '@/lib/constants';
import { BureauCard, UnverifiedReportCard } from './BureauCard';
import { EmptyState } from './EmptyState';

interface RatesDashboardProps {
  bureaus: BureauWithRate[];
  loading: boolean;
  onSelectBureau: (bureau: BureauWithRate) => void;
}

export function RatesDashboard({ bureaus, loading, onSelectBureau }: RatesDashboardProps) {
  const [search, setSearch] = useState('');
  const [municipality, setMunicipality] = useState<string>('all');
  const [rateFilter, setRateFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'best' | 'proximity'>('recent');

  const filtered = useMemo(() => {
    let list = [...bureaus];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.municipality.toLowerCase().includes(q) ||
          (b.address?.toLowerCase().includes(q) ?? false)
      );
    }

    if (municipality !== 'all') {
      list = list.filter((b) => b.municipality === municipality);
    }

    if (rateFilter === 'verified') {
      list = list.filter((b) => b.latest?.status === 'verified');
    } else if (rateFilter === 'unverified') {
      list = list.filter((b) => b.latest?.status === 'pending');
    }

    switch (sortBy) {
      case 'best':
        list.sort((a, b) => (b.latest?.usd_sell ?? 0) - (a.latest?.usd_sell ?? 0));
        break;
      case 'proximity':
        list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.latest?.updated_at ?? b.created_at).getTime() -
            new Date(a.latest?.updated_at ?? a.created_at).getTime()
        );
    }

    return list;
  }, [bureaus, search, municipality, rateFilter, sortBy]);

  const verifiedList = filtered.filter((b) => b.latest?.status === 'verified');
  const unverifiedList = filtered.filter((b) => b.latest?.status === 'pending');
  const noRateList = filtered.filter((b) => !b.latest);

  const availableMunicipalities = useMemo(() => {
    const set = new Set(bureaus.map((b) => b.municipality));
    return MUNICIPALITIES.filter((m) => set.has(m));
  }, [bureaus]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
        ))}
      </div>
    );
  }

  if (bureaus.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Aucun bureau enregistré pour l'instant"
        message="Les bureaux de change apparaîtront ici dès qu'ils seront ajoutés. Vous pouvez signaler un bureau ou un taux via le bouton « Signaler »."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un bureau, une commune…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Municipality chips */}
        {availableMunicipalities.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={municipality === 'all'} onClick={() => setMunicipality('all')}>
              Toutes
            </FilterChip>
            {availableMunicipalities.map((m) => (
              <FilterChip key={m} active={municipality === m} onClick={() => setMunicipality(m)}>
                {m}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Rate type + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900/60">
            {(['all', 'verified', 'unverified'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRateFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  rateFilter === f
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'verified' ? 'Vérifiés' : 'Non vérifiés'}
              </button>
            ))}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="recent">Récents</option>
              <option value="best">Meilleur taux</option>
              <option value="proximity">Plus proches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verified rates */}
      {verifiedList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Taux vérifiés
            <span className="ml-2 text-xs font-normal text-slate-400">({verifiedList.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {verifiedList.map((b) => (
              <BureauCard key={b.id} bureau={b} onSelect={onSelectBureau} />
            ))}
          </div>
        </div>
      )}

      {/* Unverified reports */}
      {unverifiedList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Signalé par la communauté, non vérifié
              <span className="ml-2 text-xs font-normal text-slate-400">({unverifiedList.length})</span>
            </h2>
          </div>
          <div className="space-y-2">
            {unverifiedList.map((b) => (
              <UnverifiedReportCard key={b.id} bureau={b} />
            ))}
          </div>
        </div>
      )}

      {/* Bureaus without rates */}
      {noRateList.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Bureaux sans taux publié
            <span className="ml-2 text-xs font-normal text-slate-400">({noRateList.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {noRateList.map((b) => (
              <BureauCard key={b.id} bureau={b} onSelect={onSelectBureau} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Aucun résultat"
          message="Aucun bureau ne correspond à vos critères de recherche."
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
