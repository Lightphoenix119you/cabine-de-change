import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url) {
  console.error(
    "[Supabase] VITE_SUPABASE_URL est undefined. En local : vérifiez le fichier .env. Sur Vercel : Project Settings → Environment Variables, puis redéployez (les variables ne sont pas reprises automatiquement d'un déploiement à l'autre)."
  );
}
if (!anonKey) {
  console.error(
    "[Supabase] VITE_SUPABASE_ANON_KEY est undefined. Même vérification : .env en local, Environment Variables sur Vercel, puis redéployez."
  );
}
if (url && anonKey) {
  console.log('[Supabase] Client initialisé — URL et clé anon détectées.');
}

// Exposed so the UI can show a precise diagnostic on screen (useful on
// mobile, where the console isn't reachable) instead of a generic error.
export const supabaseEnvStatus = {
  url: Boolean(url),
  anonKey: Boolean(anonKey),
};

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: true },
});
