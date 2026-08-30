import { useState } from 'react';
import { BadgeCheck, Building2, Navigation, Phone, Store, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { BureauWithRate } from '@/lib/types';
import { formatCDF } from '@/lib/format';
import { useLocalVendors } from '@/hooks/useLocalVendors';
import { LocalVendorCard } from './LocalVendorCard';

interface BureauProfileProps {
  bureau: BureauWithRate | null;
  onClose: () => void;
}

type Tab = 'rates' | 'vendors';

export function BureauProfile({ bureau, onClose }: BureauProfileProps) {
  const [tab, setTab] = useState<Tab>('rates');
  const { vendors, loading } = useLocalVendors(bureau?.id ?? null);

  if (!bureau) return null;

  const directionsUrl =
    bureau.latitude != null && bureau.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${bureau.latitude},${bureau.longitude}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{bureau.name}</h2>
                {bureau.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary-500" />}
              </div>
              <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="h-3 w-3" /> {bureau.municipality}
                {bureau.address ? ` · ${bureau.address}` : ''}
              </p>
              {bureau.address_description && (
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{bureau.address_description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`mx-4 mb-3 grid gap-2 ${bureau.phone && directionsUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {bureau.phone && (
              <a
                href={`tel:${bureau.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-50 py-2 text-sm font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
              >
                <Phone className="h-4 w-4" /> Appeler
              </a>
            )}
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white dark:bg-slate-700"
              >
                <Navigation className="h-4 w-4" /> Itinéraire
              </a>
            )}
          </div>

          <div className="flex gap-1 px-4 pb-3">
            <button
              onClick={() => setTab('rates')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === 'rates'
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Taux & Offres
            </button>
            <button
              onClick={() => setTab('vendors')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === 'vendors'
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Commerces & Vendeurs
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'rates' ? (
            bureau.latest ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Achat</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {formatCDF(bureau.latest.usd_buy)} <span className="text-xs font-normal text-slate-400">FC</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase">Vente</span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {formatCDF(bureau.latest.usd_sell)} <span className="text-xs font-normal text-slate-400">FC</span>
                    </p>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-400">
                  {bureau.latest.status === 'verified' ? 'Taux vérifié' : 'Signalé par la communauté, non vérifié'}
                </p>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">Aucun taux publié pour l'instant.</p>
            )
          ) : loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>
          ) : vendors.length === 0 ? (
            <div className="py-8 text-center">
              <Store className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">Aucun commerce affilié pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vendors.map((v) => (
                <LocalVendorCard key={v.id} vendor={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
