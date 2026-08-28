import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Message, SenderRole } from '@/types';

interface Props {
  conversationId: string;
  role: SenderRole;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatThread({ conversationId, role }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at')
      .then(({ data }) => {
        if (!active) return;
        setMessages((data ?? []) as Message[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_role: role, body })
      .select()
      .single();
    if (data) {
      const m = data as Message;
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[55vh]">
      <div className="flex-1 overflow-y-auto space-y-2 px-1 py-2">
        {loading ? (
          <p className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">
            Aucun message. Écrivez le premier !
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === role;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm transition-transform ${
                    mine
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 rounded-bl-sm'
                  }`}
                >
                  <p className="leading-snug whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-amber-100' : 'text-stone-400 dark:text-stone-500'}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-stone-200 dark:border-stone-700 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Écrire un message..."
          className="flex-1 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="shrink-0 rounded-full bg-amber-500 p-2.5 text-white transition-colors hover:bg-amber-600 active:scale-95 disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
