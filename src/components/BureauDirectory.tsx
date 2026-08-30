import { useMemo, useState } from 'react';
import { Building2, LocateFixed, MapPin, Navigation, Phone, Star } from 'lucide-react';
import type { BureauWithRate, LocalVendor } from '@/lib/types';
import { formatCDF, formatDistance } from '@/lib/format';
import { EmptyState } from './EmptyState';
import { BureauMap } from './BureauMap';

interface BureauDirectoryProps {
  bureaus: BureauWithRate[];
  vendors: LocalVendor[];
  loading: boolean;
  userCoords: { lat: number; lng: number } | null;
  geoStatus: 'idle' | 'requested' | 'granted' | 'denied';
  onLocate: () => void;
  onSelectBureau: (bureau: BureauWithRate) => void;
}

type ProximityFilter = 'all' | 500 | 1000 | 5000;

const PROXIMITY_OPTIONS: { value: ProximityFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 500, label: '< 500 m' },
  { value: 1000, label: '< 1 km' },
  { value: 5000, label: '< 5 km' },
];

export function BureauDirectory({
  bureaus,
  vendors,
  loading,
  userCoords,
  geoStatus,
  onLocate,
  onSelectBureau,
}: BureauDirectoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proximity, setProximity] = useState<ProximityFilter>('all');

  const sorted = useMemo(() => {
    return [...bureaus].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    );
  }, [bureaus]);

  const filtered = useMemo(() => {
    if (proximity === 'all') return sorted;
    const maxKm = proximity / 1000;
    return sorted.filter((b) => b.distanceKm != null && b.distanceKm <= maxKm);
  }, [sorted, proximity]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-[400px] animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-700/40" />
        ))}
      </div>
    );
  }

  if (bureaus.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-8 w-8" />}
        title="Aucun bureau sur la carte"
        message="Les bureaux de change avec position géographique apparaîtront ici."
      />
    );
  }

  const hasGeoloc = bureaus.some((b) => b.latitude != null && b.longitude != null);

  return (
    <div className="space-y-4">
      {/* Location button + proximity filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onLocate}
          disabled={geoStatus === 'requested'}
          className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950/60"
        >
          <LocateFixed className="h-4 w-4" />
          {geoStatus === 'granted' ? 'Position activée' : geoStatus === 'requested' ? 'Localisation…' : 'Me localiser'}
        </button>
        {geoStatus === 'denied' && (
          <span className="text-xs text-slate-400">Localisation indisponible — tri par proximité désactivé</span>
        )}
      </div>

      {geoStatus === 'granted' && (
        <div className="flex flex-wrap gap-2 no-scrollbar overflow-x-auto">
          {PROXIMITY_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setProximity(opt.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                proximity === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      {hasGeoloc && (
        <BureauMap bureaus={filtered} vendors={vendors} userCoords={userCoords} onSelectBureau={onSelectBureau} />
      )}

      {/* List */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {filtered.length} bureau{filtered.length > 1 ? 'x' : ''}
        </h2>
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
            Aucun bureau dans ce rayon.
          </p>
        )}
        {filtered.map((b) => {
          const isSelected = selectedId === b.id;
          const directionsUrl =
            b.latitude != null && b.longitude != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`
              : null;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedId(isSelected ? null : b.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                isSelected
                  ? 'border-primary-400 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-950/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{b.name}</h3>
                    {b.verified && <Star className="h-3.5 w-3.5 fill-primary-500 text-primary-500" />}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Building2 className="h-3 w-3" />
                    {b.municipality}
                    {b.address && <span className="truncate">· {b.address}</span>}
                  </p>
                  {b.distanceKm != null && (
                    <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      <Navigation className="h-2.5 w-2.5" />
                      {formatDistance(b.distanceKm)}
                    </span>
                  )}
                </div>
                {b.latest && (
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {formatCDF(b.latest.usd_sell)} <span className="text-[10px] font-normal text-slate-400">FC</span>
                    </p>
                    <p className="text-[10px] text-slate-400">vente USD</p>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {b.phone}
                    </a>
                  )}
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Itinéraire
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBureau(b);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-700"
                  >
                    Voir la fiche
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
