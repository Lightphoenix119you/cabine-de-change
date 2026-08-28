import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';

interface Props {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation indisponible sur cet appareil.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError('Position refusée ou indisponible.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const inputClass =
    'w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Position (carte / distance)</span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-60"
        >
          {locating ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
          Utiliser ma position
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={latitude}
          onChange={(e) => onChange(e.target.value, longitude)}
          placeholder="Latitude"
          inputMode="decimal"
          className={inputClass}
        />
        <input
          value={longitude}
          onChange={(e) => onChange(latitude, e.target.value)}
          placeholder="Longitude"
          inputMode="decimal"
          className={inputClass}
        />
      </div>
      {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
