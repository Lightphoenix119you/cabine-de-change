import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface UseAuthResult {
  session: Session | null;
  profile: Profile | null;
  ownedBureauIds: string[];
  checkedAuth: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  refreshOwnedBureaus: () => void;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ownedBureauIds, setOwnedBureauIds] = useState<string[]>([]);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  const loadOwnedBureaus = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('bureaus').select('id').eq('user_id', userId);
    setOwnedBureauIds((data ?? []).map((b) => b.id as string));
  }, []);

  const refreshOwnedBureaus = useCallback(() => {
    if (session?.user) loadOwnedBureaus(session.user.id);
  }, [session, loadOwnedBureaus]);

  useEffect(() => {
    if (!supabase) {
      setCheckedAuth(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session?.user.is_anonymous ? null : data.session;
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id);
        loadOwnedBureaus(s.user.id);
      }
      setCheckedAuth(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const nonAnon = s?.user.is_anonymous ? null : s;
      setSession(nonAnon);
      if (nonAnon?.user) {
        loadProfile(nonAnon.user.id);
        loadOwnedBureaus(nonAnon.user.id);
      } else {
        setProfile(null);
        setOwnedBureauIds([]);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile, loadOwnedBureaus]);

  return {
    session,
    profile,
    ownedBureauIds,
    checkedAuth,
    isAdmin: profile?.role === 'admin',
    isAgent: ownedBureauIds.length > 0,
    refreshOwnedBureaus,
  };
}
