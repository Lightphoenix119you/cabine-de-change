import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Bureau, ExchangeRate } from '@/lib/types';
import { formatCDF, timeAgo } from '@/lib/format';

interface PendingItem {
  rate: ExchangeRate;
  bureau: Bureau | null;
}

export function AdminModeration() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [unverifiedBureaus, setUnverifiedBureaus] = useState<Bureau[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: rates } = await supabase
      .from('exchange_rates')
      .select('*, bureau:bureaus(*)')
      .eq('status', 'pending')
      .order('updated_at', { ascending: false });

    if (rates) {
      const mapped: PendingItem[] = (rates as unknown as (ExchangeRate & { bureau: Bureau })[]).map(
        (r) => ({ rate: r, bureau: r.bureau })
      );
      setItems(mapped);
    }

    const { data: bureaus } = await supabase
      .from('bureaus')
      .select('*')
      .eq('verified', false)
      .order('created_at', { ascending: false });
    setUnverifiedBureaus((bureaus as Bureau[]) ?? []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (rateId: string) => {
    if (!supabase) return;
    setActionId(rateId);
    const { error } = await supabase
      .from('exchange_rates')
      .update({ status: 'verified' })
      .eq('id', rateId);
    setActionId(null);
    if (!error) fetchPending();
  };

  const handleDelete = async (rateId: string) => {
    if (!supabase) return;
    setActionId(rateId);
    const { error } = await supabase.from('exchange_rates').delete().eq('id', rateId);
    setActionId(null);
    if (!error) fetchPending();
  };

  const handleVerifyBureau = async (bureauId: string) => {
    if (!supabase) return;
    await supabase.from('bureaus').update({ verified: true }).eq('id', bureauId);
    fetchPending();
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-400">Chargement des signalements…</p>;
  }

  if (items.length === 0 && unverifiedBureaus.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success-500" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Rien en attente</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tout a été traité.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {unverifiedBureaus.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unverifiedBureaus.length} cabine{unverifiedBureaus.length > 1 ? 's' : ''} en attente de vérification
          </p>
          {unverifiedBureaus.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{b.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {b.municipality}{b.address ? ` · ${b.address}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleVerifyBureau(b.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Vérifier
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {items.length} signalement{items.length > 1 ? 's' : ''} de taux en attente
          </p>
          {items.map(({ rate, bureau }) => (
        <div
          key={rate.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {bureau?.name ?? 'Bureau inconnu'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bureau?.municipality}
                {bureau?.address ? ` · ${bureau.address}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(rate.updated_at)}</span>
          </div>

          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              Achat: <strong className="text-slate-900 dark:text-white">{formatCDF(rate.usd_buy)} FC</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              Vente: <strong className="text-slate-900 dark:text-white">{formatCDF(rate.usd_sell)} FC</strong>
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
            <button
              onClick={() => handleApprove(rate.id)}
              disabled={actionId === rate.id}
              className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700 transition hover:bg-success-100 dark:bg-success-950/40 dark:text-success-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Valider le taux
            </button>
            <button
              onClick={() => handleDelete(rate.id)}
              disabled={actionId === rate.id}
              className="flex items-center gap-1.5 rounded-lg bg-error-50 px-3 py-1.5 text-xs font-semibold text-error-700 transition hover:bg-error-100 dark:bg-error-950/40 dark:text-error-300"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeter
            </button>
            {bureau && !bureau.verified && (
              <button
                onClick={() => handleVerifyBureau(bureau.id)}
                className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Vérifier le bureau
              </button>
            )}
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}

export { Trash2 };
