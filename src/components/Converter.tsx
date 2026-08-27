import { useMemo, useState } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import type { Cabin } from '@/types';

interface Props {
  cabin: Cabin;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function Converter({ cabin }: Props) {
  const [usdInput, setUsdInput] = useState('');
  const [localInput, setLocalInput] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');

  const rate = direction === 'buy' ? cabin.buy_rate : cabin.sell_rate;

  const usd = useMemo(() => parseFloat(usdInput) || 0, [usdInput]);
  const local = useMemo(() => parseFloat(localInput) || 0, [localInput]);

  function handleUsdChange(value: string) {
    setUsdInput(value);
    const n = parseFloat(value);
    if (!isNaN(n)) {
      setLocalInput((n * rate).toFixed(0));
    } else {
      setLocalInput('');
    }
  }

  function handleLocalChange(value: string) {
    setLocalInput(value);
    const n = parseFloat(value);
    if (!isNaN(n)) {
      setUsdInput((n / rate).toFixed(2));
    } else {
      setUsdInput('');
    }
  }

  function toggleDirection() {
    setDirection((d) => (d === 'buy' ? 'sell' : 'buy'));
    setUsdInput('');
    setLocalInput('');
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 p-5 space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide">
          Convertisseur
        </h2>
        <button
          onClick={toggleDirection}
          className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900 active:scale-95"
        >
          {direction === 'buy' ? (
            <>
              <TrendingUp size={14} /> Achat
            </>
          ) : (
            <>
              <TrendingDown size={14} /> Vente
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center justify-between">
          <span>{cabin.base_currency} — Vous donnez</span>
          <span className="text-stone-400 dark:text-stone-500">1 = {formatNumber(rate)} {cabin.local_currency}</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-400 dark:text-stone-500">
            {cabin.base_symbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={usdInput}
            onChange={(e) => handleUsdChange(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 pl-9 pr-4 py-3.5 text-lg font-semibold text-stone-800 dark:text-stone-100 outline-none transition-all focus:border-amber-400 focus:bg-white dark:focus:bg-stone-800 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="rounded-full bg-amber-100 dark:bg-amber-950 p-2 text-amber-600 dark:text-amber-400">
          <ArrowRightLeft size={18} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400">
          {cabin.local_currency} — Vous recevez
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 dark:text-stone-500">
            {cabin.local_symbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={localInput}
            onChange={(e) => handleLocalChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 pl-11 pr-4 py-3.5 text-lg font-semibold text-stone-800 dark:text-stone-100 outline-none transition-all focus:border-amber-400 focus:bg-white dark:focus:bg-stone-800 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </div>
      </div>

      {usd > 0 && (
        <p className="text-center text-xs text-stone-500 dark:text-stone-400">
          {formatNumber(usd)} {cabin.base_currency} ={' '}
          <span className="font-semibold text-amber-700">
            {formatNumber(local)} {cabin.local_currency}
          </span>
        </p>
      )}
    </div>
  );
}
