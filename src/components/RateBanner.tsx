import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Cabin } from '@/types';

interface Props {
  cabin: Cabin;
}

function formatRate(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}

export function RateBanner({ cabin }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 p-4 transition-colors">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-1.5">
            <TrendingUp size={16} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide">Achat</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-stone-800 dark:text-stone-100">
          {formatRate(cabin.buy_rate)}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {cabin.local_symbol} / 1 {cabin.base_currency}
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 p-4 transition-colors">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950 p-1.5">
            <TrendingDown size={16} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide">Vente</span>
        </div>
        <p className="mt-3 text-2xl font-bold text-stone-800 dark:text-stone-100">
          {formatRate(cabin.sell_rate)}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {cabin.local_symbol} / 1 {cabin.base_currency}
        </p>
      </div>
    </div>
  );
}
