import { useState } from 'react';
import { LogOut, ShieldCheck, Store, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BureauWithRate, Profile } from '@/lib/types';
import { AdminModeration } from './AdminModeration';
import { BureauOwnerDashboard } from './BureauOwnerDashboard';

interface AccountPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  profile: Profile | null;
  isAdmin: boolean;
  ownedBureaus: BureauWithRate[];
  onChanged: () => void;
}

type Tab = 'bureau' | 'admin';

export function AccountPanel({
  open,
  onClose,
  userId,
  profile,
  isAdmin,
  ownedBureaus,
  onChanged,
}: AccountPanelProps) {
  const [tab, setTab] = useState<Tab>('bureau');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Mon espace</h2>
            {profile?.full_name && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{profile.full_name}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => supabase?.auth.signOut()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-error-500 dark:hover:bg-slate-800"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-1 p-4 pb-0">
            <button
              onClick={() => setTab('bureau')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition ${
                tab === 'bureau'
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Store className="h-4 w-4" /> Ma cabine
            </button>
            <button
              onClick={() => setTab('admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition ${
                tab === 'admin'
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Modération
            </button>
          </div>
        )}

        <div className="p-4">
          {tab === 'admin' && isAdmin ? (
            <AdminModeration />
          ) : (
            <BureauOwnerDashboard userId={userId} ownedBureaus={ownedBureaus} onChanged={onChanged} />
          )}
        </div>
      </div>
    </div>
  );
}
