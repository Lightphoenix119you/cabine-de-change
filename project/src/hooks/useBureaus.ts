import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bureau, BureauWithRate, ExchangeRate } from '@/lib/types';
import { haversineKm } from '@/lib/geo';

interface UseBureausResult {
  bureaus: BureauWithRate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function latestRate(rates: ExchangeRate[]): ExchangeRate | undefined {
  if (!rates.length) return undefined;
  return [...rates].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )[0];
}

export function useBureaus(
  options?: { userLat?: number | null; userLng?: number | null }
): UseBureausResult {
  const [bureaus, setBureaus] = useState<BureauWithRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase non configuré');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bureaus')
      .select('*, rates:exchange_rates(*)')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const { userLat, userLng } = optionsRef.current || {};
    const mapped: BureauWithRate[] = (data as unknown as BureauWithRate[]).map((b) => {
      const latest = latestRate(b.rates || []);
      let distanceKm: number | null = null;
      if (userLat != null && userLng != null && b.latitude != null && b.longitude != null) {
        distanceKm = haversineKm(userLat, userLng, b.latitude, b.longitude);
      }
      return { ...b, latest, distanceKm };
    });

    setError(null);
    setBureaus(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: refetch when exchange_rates change
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('exchange_rates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exchange_rates' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bureaus' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { bureaus, loading, error, refetch: fetchData };
}

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'requested' | 'granted' | 'denied'>('idle');

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    setStatus('requested');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return { coords, status, request };
}

export { supabase };
export type { Bureau, ExchangeRate };
