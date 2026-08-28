import { useEffect, useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureClientAuth, getClientName, setClientName } from '@/lib/chatIdentity';
import { ChatThread } from './ChatThread';
import type { Cabin, Vendor } from '@/types';

interface Props {
  cabin: Cabin;
  vendor?: Vendor;
  onClose: () => void;
}

export function ClientChatModal({ cabin, vendor, onClose }: Props) {
  const [nameInput, setNameInput] = useState(getClientName() ?? '');
  const [needsName, setNeedsName] = useState(!getClientName());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  const targetLabel = vendor ? vendor.name : cabin.name;

  async function findConversation(clientId: string): Promise<string | null> {
    let q = supabase
      .from('conversations')
      .select('id')
      .eq('cabin_id', cabin.id)
      .eq('client_id', clientId);
    q = vendor ? q.eq('vendor_id', vendor.id) : q.is('vendor_id', null);
    const { data } = await q.maybeSingle();
    return data?.id ?? null;
  }

  async function startConversation() {
    setLoading(true);
    setAuthError(false);

    let clientId: string;
    try {
      clientId = await ensureClientAuth();
    } catch {
      setAuthError(true);
      setLoading(false);
      return;
    }

    const existingId = await findConversation(clientId);
    if (existingId) {
      setConversationId(existingId);
      setLoading(false);
      return;
    }

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        cabin_id: cabin.id,
        vendor_id: vendor?.id ?? null,
        client_id: clientId,
        client_name: getClientName(),
      })
      .select('id')
      .single();

    if (error) {
      // another tab/request may have created it first — the unique index
      // rejects the duplicate, so just look it up again
      setConversationId(await findConversation(clientId));
    } else {
      setConversationId(created?.id ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!needsName) startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsName]);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setClientName(nameInput.trim());
    setNeedsName(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900 shadow-xl flex flex-col modal-sheet">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 rounded-t-3xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 rounded-lg bg-amber-50 dark:bg-amber-950 p-1.5 text-amber-600 dark:text-amber-400">
              <MessageSquare size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-stone-800 dark:text-stone-100 leading-tight">
                {targetLabel}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                {vendor ? 'Vendeur du quartier' : 'Cabine de change'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {needsName ? (
            <form onSubmit={handleNameSubmit} className="space-y-3 py-4">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Votre nom, pour que {vendor ? 'le vendeur' : "l'opérateur"} sache qui lui écrit :
              </p>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Votre nom"
                autoFocus
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
              />
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
              >
                Continuer
              </button>
            </form>
          ) : authError ? (
            <p className="py-10 text-center text-xs text-stone-400 dark:text-stone-500">
              La messagerie est momentanément indisponible. Réessayez plus tard.
            </p>
          ) : loading || !conversationId ? (
            <p className="py-10 text-center text-xs text-stone-400 dark:text-stone-500">Connexion...</p>
          ) : (
            <ChatThread conversationId={conversationId} role="client" />
          )}
        </div>
      </div>
    </div>
  );
}
