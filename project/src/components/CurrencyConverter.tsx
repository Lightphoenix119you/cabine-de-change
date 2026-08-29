import { useMemo, useState } from 'react';
import { ArrowLeftRight, Calculator, Info, TrendingUp } from 'lucide-react';
import { CURRENCIES, STATIC_RATES } from '@/lib/constants';
import type { BureauWithRate, Currency, RateMode } from '@/lib/types';
import { formatCDF, formatNumber } from '@/lib/format';

interface CurrencyConverterProps {
  bureaus: BureauWithRate[];
}

export function CurrencyConverter({ bureaus }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('CDF');
  const [amount, setAmount] = useState<string>('100');
  const [mode, setMode] = useState<RateMode>('sell');

  // Best USD/CDF rate from verified bureaus (fallback to all if none verified)
  const bestRate = useMemo(() => {
    const verified = bureaus.filter(
      (b) => b.latest?.status === 'verified' && b.latest.usd_sell != null
    );
    const pool = verified.length > 0 ? verified : bureaus.filter((b) => b.latest?.usd_sell != null);
    if (pool.length === 0) return null;
    const rates = pool.map((b) => ({
      bureau: b.name,
      rate: mode === 'buy' ? b.latest!.usd_buy : b.latest!.usd_sell,
      verified: b.latest!.status === 'verified',
    })).filter((r) => r.rate != null) as { bureau: string; rate: number; verified: boolean }[];
    if (rates.length === 0) return null;
    rates.sort((a, b) => (mode === 'buy' ? b.rate - a.rate : a.rate - b.rate));
    return rates[0];
  }, [bureaus, mode]);

  // Conversion logic: convert via USD as intermediate
  const result = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return null;

    const liveCDF = bestRate?.rate ?? STATIC_RATES.CDF;
    const rateMap: Record<Currency, number> = {
      ...STATIC_RATES,
      CDF: liveCDF,
    };

    // Convert from -> USD -> to
    const inUSD = numAmount / rateMap[fromCurrency];
    const converted = inUSD * rateMap[toCurrency];
    return converted;
  }, [amount, fromCurrency, toCurrency, bestRate]);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/60">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Convertisseur</h2>
      </div>

      {/* Buy / Sell toggle */}
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900/60">
        {(['sell', 'buy'] as RateMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === m
                ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-primary-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {m === 'sell' ? "J'achète USD" : 'Je vends USD'}
          </button>
        ))}
      </div>

      {/* From */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Montant</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-lg font-bold text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">De</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value as Currency)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap button */}
      <div className="my-2 flex justify-center">
        <button
          onClick={swap}
          aria-label="Inverser"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:hover:bg-primary-900/60"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>

      {/* To */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Résultat</label>
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-lg font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white">
            {result != null ? formatNumber(result, toCurrency === 'CDF' ? 0 : 2) : '—'}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Vers</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value as Currency)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Best rate info */}
      {fromCurrency === 'USD' && toCurrency === 'CDF' && bestRate && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-50 p-3 dark:bg-primary-950/30">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
          <div className="text-xs">
            <p className="font-semibold text-primary-800 dark:text-primary-200">
              Meilleur taux {mode === 'sell' ? 'vente' : 'achat'} : {formatCDF(bestRate.rate)} FC
            </p>
            <p className="text-primary-600/80 dark:text-primary-400/80">
              chez {bestRate.bureau}
              {!bestRate.verified && ' · non vérifié'}
            </p>
          </div>
        </div>
      )}

      {fromCurrency === 'USD' && toCurrency === 'CDF' && !bestRate && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Aucun taux de bureau disponible. Le convertisseur utilise un taux indicatif de référence.
          </p>
        </div>
      )}
    </div>
  );
}
