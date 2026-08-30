import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (!url || !anonKey) {
  console.error(
    '[Cabine de Change] Missing Supabase configuration. ' +
      'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.'
  );
} else {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export const supabase = client;
export const isSupabaseConfigured = Boolean(client);
