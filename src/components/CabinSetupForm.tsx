import { useState } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LocationPicker } from './LocationPicker';

interface Props {
  operatorId: string;
  onCreated: () => void;
}

export function CabinSetupForm({ operatorId, onCreated }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [buyRate, setBuyRate] = useState('2800');
  const [sellRate, setSellRate] = useState('2850');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('cabins').insert({
      name: name.trim(),
      location: location.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      buy_rate: parseFloat(buyRate) || 0,
      sell_rate: parseFloat(sellRate) || 0,
      rates_updated_at: new Date().toISOString(),
      operator_id: operatorId,
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
    });
    setSaving(false);
    if (error) {
      setError("Impossible de créer la cabine. Réessayez.");
      return;
    }
    onCreated();
  }

  const inputClass =
    'w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900';

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4 transition-colors">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950 p-2">
            <Store size={20} />
          </div>
          <div>
            <h1 className="font-bold text-stone-800 dark:text-stone-100 leading-tight">Configurer votre cabine</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">Quelques infos pour démarrer</p>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Nom de la cabine *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cabine Change Kongo"
            className={inputClass}
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Emplacement</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Avenue du Marché, Matadi"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Téléphone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 ..."
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">WhatsApp</span>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+243 ..."
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Taux d'achat</span>
            <input
              type="number"
              inputMode="decimal"
              value={buyRate}
              onChange={(e) => setBuyRate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Taux de vente</span>
            <input
              type="number"
              inputMode="decimal"
              value={sellRate}
              onChange={(e) => setSellRate(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />

        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-semibold text-white transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : 'Créer ma cabine'}
        </button>
      </form>
    </div>
  );
}
