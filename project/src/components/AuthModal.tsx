import { useState } from 'react';
import { Loader2, Lock, LogIn, Phone, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup' | 'phone' | 'phone-verify';

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed'))
    return 'Confirmez votre email (lien reçu par courriel) avant de vous connecter.';
  if (message.includes('User already registered'))
    return 'Un compte existe déjà avec cet email — connectez-vous plutôt.';
  if (message.includes('Password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (message.toLowerCase().includes('sms') || message.toLowerCase().includes('phone provider'))
    return "L'envoi de SMS n'est pas encore configuré pour ce site (fournisseur SMS à activer côté Supabase).";
  return message;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!open) return null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setInfo('');

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(friendlyError(err.message));
        return;
      }
      onClose();
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(friendlyError(err.message));
        return;
      }
      if (data.session) {
        onClose();
      } else {
        setInfo('Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.');
        setMode('signin');
      }
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    if (!supabase) return;
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(friendlyError(err.message));
  }

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (err) {
      setError(friendlyError(err.message));
      return;
    }
    setMode('phone-verify');
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms',
    });
    setLoading(false);
    if (err) {
      setError(friendlyError(err.message));
      return;
    }
    onClose();
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
              <LogIn className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Mon compte</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>
              {error && (
                <div className="rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/30 dark:text-error-300">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-xl bg-success-50 p-3 text-sm text-success-700 dark:bg-success-950/30 dark:text-success-300">
                  {info}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
              </button>
            </form>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">ou</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Continuer avec Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1567d3]"
              >
                Continuer avec Facebook
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('phone');
                  setError('');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Phone className="h-4 w-4" />
                Continuer avec mon téléphone
              </button>
            </div>

            <button
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setError('');
                setInfo('');
              }}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
            >
              {mode === 'signin' ? 'Pas encore de compte ? En créer un' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        )}

        {mode === 'phone' && (
          <form onSubmit={handlePhoneSend} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Format international, ex. +243900000000. Un code vous sera envoyé par SMS.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243..."
              required
              className={inputClass}
            />
            {error && (
              <div className="rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/30 dark:text-error-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recevoir le code'}
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400"
            >
              ← Retour
            </button>
          </form>
        )}

        {mode === 'phone-verify' && (
          <form onSubmit={handlePhoneVerify} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Code envoyé au {phone}.
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Code reçu par SMS"
              inputMode="numeric"
              required
              className={inputClass}
            />
            {error && (
              <div className="rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/30 dark:text-error-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider le code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
