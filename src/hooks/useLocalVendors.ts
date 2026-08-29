import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LocalVendor } from '@/lib/types';

export function useLocalVendors(bureauId: string | null) {
  const [vendors, setVendors] = useState<LocalVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    if (!supabase || !bureauId) {
      setVendors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('local_vendors')
      .select('*')
      .eq('bureau_id', bureauId)
      .order('created_at', { ascending: false });
    setVendors((data as LocalVendor[]) ?? []);
    setLoading(false);
  }, [bureauId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (!supabase || !bureauId) return;
    const channel = supabase
      .channel(`local_vendors_${bureauId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'local_vendors', filter: `bureau_id=eq.${bureauId}` },
        () => fetchVendors()
      )
      .subscribe();
    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [bureauId, fetchVendors]);

  return { vendors, loading, refetch: fetchVendors };
}

/** All local vendors across every bureau, for the map view. */
export function useAllLocalVendors() {
  const [vendors, setVendors] = useState<LocalVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('local_vendors').select('*').eq('is_active', true);
    setVendors((data as LocalVendor[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { vendors, loading, refetch: fetchAll };
}
