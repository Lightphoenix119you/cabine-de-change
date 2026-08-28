import { supabase } from '@/lib/supabase';

const NAME_KEY = 'cdc_client_name';

/**
 * Returns the current user id, signing in anonymously first if there is no
 * session yet. This id is what RLS checks against `conversations.client_id`,
 * so it must be a real Supabase Auth uid — not a self-declared string.
 *
 * Requires "Anonymous sign-ins" to be enabled in the Supabase project's
 * Auth settings. Throws if that's not the case, so callers can show a
 * clear message instead of a silently broken chat.
 */
export async function ensureClientAuth(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user.id;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw error ?? new Error('Anonymous sign-in failed');
  }
  return data.session.user.id;
}

export function getClientName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export function setClientName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}
