import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface Props {
  onAuthenticated: (session: Session) => void;
  title?: string;
  subtitle?: string;
}

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed'))
    return "Confirmez votre email (lien reçu par courriel) avant de vous connecter.";
  if (message.includes('User already registered'))
    return 'Un compte existe déjà avec cet email — connectez-vous plutôt.';
  if (message.includes('Password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  return message;
}

export function OperatorAuthGate({ onAuthenticated, title, subtitle }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(friendlyError(error.message));
      } else if (data.session) {
        onAuthenticated(data.session);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(friendlyError(error.message));
      } else if (data.session) {
        // best-effort safety net alongside the DB trigger that claims the
        // cabin on signup — harmless if the cabin is already claimed
        await supabase.from('cabins').update({ operator_id: data.session.user.id }).is('operator_id', null);
        onAuthenticated(data.session);
      } else {
        setInfo('Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.');
        setMode('signin');
      }
    }
    setLoading(false);
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    setError(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    // on success the browser navigates away to the provider — nothing more to do here
    if (error) setError(friendlyError(error.message));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950 p-2">
          <Lock size={20} />
        </div>
        <div>
          <h2 className="font-bold text-stone-800 dark:text-stone-100 leading-tight">
            {title ?? (mode === 'signin' ? 'Connexion opérateur' : 'Créer un compte opérateur')}
          </h2>
          {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </label>

        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        {info && <p className="text-xs text-green-600 dark:text-green-400">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : mode === 'signin' ? (
            'Se connecter'
          ) : (
            'Créer le compte'
          )}
        </button>
      </form>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">ou</span>
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 py-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200 transition-colors hover:bg-stone-50 dark:hover:bg-stone-700 active:scale-[0.98]"
        >
          Continuer avec Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('facebook')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1567d3] active:scale-[0.98]"
        >
          Continuer avec Facebook
        </button>
      </div>

      <button
        onClick={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
          setError(null);
          setInfo(null);
        }}
        className="w-full text-center text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
      >
        {mode === 'signin'
          ? "Première connexion ? Créer le compte opérateur"
          : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  );
}
