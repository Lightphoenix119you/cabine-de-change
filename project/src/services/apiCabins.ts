import { supabase } from '@/lib/supabase';
import type { Cabin } from '@/types';

/**
 * Fetches every cabin row. Ordered by creation date so callers that only
 * need "the" cabin (this app is single-tenant per deployment) can
 * deterministically take the first one.
 *
 * Throws a plain Error with Supabase's own message on failure — callers
 * decide how to surface it (this app shows it verbatim on screen).
 */
export async function getCabins(): Promise<Cabin[]> {
  const { data, error } = await supabase.from('cabins').select('*').order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Cabin[];
}
