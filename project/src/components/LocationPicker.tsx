import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
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
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Position (carte / distance)</span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60 dark:bg-primary-950/40 dark:text-primary-300"
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
      {error && <p className="text-[11px] text-error-500">{error}</p>}
    </div>
  );
}
