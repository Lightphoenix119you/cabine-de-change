import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock,
  Minus,
  Navigation,
  Phone,
  ShieldAlert,
  Star,
} from 'lucide-react';
import type { BureauWithRate } from '@/lib/types';
import { formatCDF, formatDistance, timeAgo } from '@/lib/format';

interface BureauCardProps {
  bureau: BureauWithRate;
  previousRate?: { usd_buy: number | null; usd_sell: number | null } | null;
  variant?: 'list' | 'compact';
  onSelect?: (bureau: BureauWithRate) => void;
}

type Trend = 'up' | 'down' | 'stable' | 'unknown';

function getTrend(
  current: number | null | undefined,
  previous: number | null | undefined
): Trend {
  if (current == null || previous == null) return 'unknown';
  const diff = current - previous;
  if (Math.abs(diff) < 1) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up')
    return <ArrowUpRight className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />;
  if (trend === 'down')
    return <ArrowDownRight className="h-3.5 w-3.5 text-error-600 dark:text-error-400" />;
  if (trend === 'stable')
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  return <span className="text-[10px] text-slate-400">—</span>;
}

export function BureauCard({ bureau, previousRate, variant = 'list', onSelect }: BureauCardProps) {
  const latest = bureau.latest;
  const isVerified = latest?.status === 'verified';

  const buyTrend = getTrend(latest?.usd_buy, previousRate?.usd_buy);
  const sellTrend = getTrend(latest?.usd_sell, previousRate?.usd_sell);

  const directionsUrl =
    bureau.latitude != null && bureau.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${bureau.latitude},${bureau.longitude}`
      : null;

  return (
    <div
      onClick={() => onSelect?.(bureau)}
      role={onSelect ? 'button' : undefined}
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/60 ${onSelect ? 'cursor-pointer' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{bureau.name}</h3>
            {bureau.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary-500" />
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Building2 className="h-3 w-3" />
            {bureau.municipality}
            {bureau.distanceKm != null && (
              <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <Navigation className="h-2.5 w-2.5" />
                {formatDistance(bureau.distanceKm)}
              </span>
            )}
          </p>
        </div>

        {/* Verification badge */}
        {latest && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isVerified
                ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
          >
            {isVerified ? 'Vérifié' : 'Non vérifié'}
          </span>
        )}
      </div>

      {/* Rates */}
      {latest ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Achat</span>
              <TrendIcon trend={buyTrend} />
            </div>
            <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
              {formatCDF(latest.usd_buy)} <span className="text-[10px] font-normal text-slate-400">FC</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">Vente</span>
              <TrendIcon trend={sellTrend} />
            </div>
            <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
              {formatCDF(latest.usd_sell)} <span className="text-[10px] font-normal text-slate-400">FC</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-400 dark:bg-slate-900/40">
          Aucun taux publié
        </div>
      )}

      {/* Footer */}
      {variant === 'list' && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/50">
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            {latest && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(latest.updated_at)}
              </span>
            )}
            {bureau.phone && (
              <a
                href={`tel:${bureau.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 transition-colors hover:text-primary-500"
              >
                <Phone className="h-3 w-3" />
                Appeler
              </a>
            )}
          </div>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-950/60"
            >
              <Navigation className="h-3 w-3" />
              Itinéraire
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function UnverifiedReportCard({ bureau }: { bureau: BureauWithRate }) {
  const latest = bureau.latest;
  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Signalé par la communauté, non vérifié</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{bureau.name} · {bureau.municipality}</span>
        {latest && (
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {formatCDF(latest.usd_buy)} / {formatCDF(latest.usd_sell)} FC
          </span>
        )}
      </div>
    </div>
  );
}

export { Star };
