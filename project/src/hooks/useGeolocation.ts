import { useCallback, useEffect, useState } from 'react';
import type { Coords } from '@/lib/geo';

interface GeoState {
  coords: Coords | null;
  loading: boolean;
  error: 'denied' | 'unavailable' | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ coords: null, loading: true, error: null });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ coords: null, loading: false, error: 'unavailable' });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          coords: null,
          loading: false,
          error: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { ...state, retry: request };
}
