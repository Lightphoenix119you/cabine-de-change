import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Megaphone, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MUNICIPALITIES } from '@/lib/constants';
import type { Bureau } from '@/lib/types';

interface CommunityReportModalProps {
  open: boolean;
  onClose: () => void;
  bureaus: Bureau[];
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function CommunityReportModal({ open, onClose, bureaus }: CommunityReportModalProps) {
  const [existingBureau, setExistingBureau] = useState<string>('new');
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [address, setAddress] = useState('');
  const [usdBuy, setUsdBuy] = useState('');
  const [usdSell, setUsdSell] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setState('idle');
      setErrorMsg('');
      setExistingBureau('new');
      setName('');
      setMunicipality(MUNICIPALITIES[0]);
      setAddress('');
      setUsdBuy('');
      setUsdSell('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Supabase non configuré. Impossible d\'envoyer le signalement.');
      setState('error');
      return;
    }

    setState('submitting');
    setErrorMsg('');

    try {
      let bureauId: string;

      if (existingBureau === 'new') {
        if (!name.trim()) {
          throw new Error('Veuillez indiquer le nom du bureau.');
        }
        const { data: bureauData, error: bureauErr } = await supabase
          .from('bureaus')
          .insert({
            name: name.trim(),
            municipality,
            address: address.trim() || null,
            verified: false,
          })
          .select('id')
          .single();

        if (bureauErr) throw bureauErr;
        bureauId = (bureauData as Pick<Bureau, 'id'>).id;
      } else {
        bureauId = existingBureau;
      }

      const buyVal = usdBuy.trim() ? parseFloat(usdBuy) : null;
      const sellVal = usdSell.trim() ? parseFloat(usdSell) : null;

      if (buyVal === null && sellVal === null) {
        throw new Error('Veuillez indiquer au moins un taux (achat ou vente).');
      }

      const { error: rateErr } = await supabase.from('exchange_rates').insert({
        bureau_id: bureauId,
        usd_buy: buyVal,
        usd_sell: sellVal,
        status: 'pending',
      });

      if (rateErr) throw rateErr;

      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-slide-up dark:bg-slate-900 sm:rounded-3xl">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Signaler un taux</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state === 'success' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/40">
              <CheckCircle2 className="h-8 w-8 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Signalement envoyé</h3>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Merci ! Votre signalement est en attente de vérification. Il apparaîtra dans la section « non vérifié » après validation par un administrateur.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bureau selection */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bureau de change
              </label>
              {bureaus.length > 0 && (
                <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setExistingBureau('new')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      existingBureau === 'new' ? 'bg-white shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                    }`}
                  >
                    Nouveau bureau
                  </button>
                  <button
                    type="button"
                    onClick={() => setExistingBureau(bureaus[0].id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      existingBureau !== 'new' ? 'bg-white shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'
                    }`}
                  >
                    Bureau existant
                  </button>
                </div>
              )}

              {existingBureau === 'new' ? (
                <input
                  type="text"
                  placeholder="Nom du bureau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              ) : (
                <select
                  value={existingBureau}
                  onChange={(e) => setExistingBureau(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {bureaus.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} — {b.municipality}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Municipality (only for new bureaus) */}
            {existingBureau === 'new' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Commune</label>
                <select
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {MUNICIPALITIES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Address (only for new bureaus) */}
            {existingBureau === 'new' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Adresse (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Colonel Ebeya, près de…"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            {/* Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Taux d'achat (FC)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 2500"
                  value={usdBuy}
                  onChange={(e) => setUsdBuy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">Prix auquel le bureau achète USD</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Taux de vente (FC)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 2580"
                  value={usdSell}
                  onChange={(e) => setUsdSell(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">Prix auquel le bureau vend USD</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              Votre signalement sera publié comme « non vérifié » jusqu'à validation par un administrateur.
            </div>

            {state === 'error' && (
              <div className="rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/30 dark:text-error-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {state === 'submitting' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
              ) : (
                <><Send className="h-4 w-4" /> Envoyer le signalement</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
