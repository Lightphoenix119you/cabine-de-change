import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LocalVendor } from '@/lib/types';
import { LocationPicker } from './LocationPicker';

interface LocalVendorFormProps {
  bureauId: string;
  bureauLatitude: number | null;
  bureauLongitude: number | null;
  existing: LocalVendor | null;
  onDone: () => void;
  onCancel: () => void;
}

export function LocalVendorForm({
  bureauId,
  bureauLatitude,
  bureauLongitude,
  existing,
  onDone,
  onCancel,
}: LocalVendorFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [productsSummary, setProductsSummary] = useState(existing?.products_summary ?? '');
  const [photoUrl, setPhotoUrl] = useState(existing?.photo_url ?? '');
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [latitude, setLatitude] = useState(
    existing?.latitude != null
      ? String(existing.latitude)
      : bureauLatitude != null
        ? String(bureauLatitude)
        : ''
  );
  const [longitude, setLongitude] = useState(
    existing?.longitude != null
      ? String(existing.longitude)
      : bureauLongitude != null
        ? String(bureauLongitude)
        : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!supabase || !name.trim() || !category.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      category: category.trim(),
      products_summary: productsSummary.trim() || null,
      photo_url: photoUrl.trim() || null,
      is_active: isActive,
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
    };

    const { error: err } = existing
      ? await supabase.from('local_vendors').update(payload).eq('id', existing.id)
      : await supabase.from('local_vendors').insert({ ...payload, bureau_id: bureauId });

    setSaving(false);
    if (err) {
      setError('Enregistrement impossible — reconnectez-vous et réessayez.');
      return;
    }
    onDone();
  }

  async function handleDelete() {
    if (!supabase || !existing) return;
    if (!confirm('Retirer ce commerce ?')) return;
    setSaving(true);
    await supabase.from('local_vendors').delete().eq('id', existing.id);
    setSaving(false);
    onDone();
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          {existing ? 'Modifier le commerce' : 'Ajouter une boutique / un vendeur'}
        </h4>
        {existing && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs font-medium text-error-500 hover:text-error-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Retirer
          </button>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom du marchand *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maman Beignets" className={inputClass} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type d'activité *</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Beignets, Alimentation, Recharge crédit…"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Produits / prix indicatifs</span>
        <input
          value={productsSummary}
          onChange={(e) => setProductsSummary(e.target.value)}
          placeholder="5 beignets pour 500 FC"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Photo (URL)</span>
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" className={inputClass} />
      </label>

      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          Pré-rempli avec la position de la cabine — ajustez si le commerce est ailleurs.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsActive(true)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            isActive
              ? 'bg-success-100 text-success-700 ring-1 ring-success-300 dark:bg-success-950/40 dark:text-success-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          Disponible
        </button>
        <button
          onClick={() => setIsActive(false)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            !isActive
              ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-400 dark:bg-slate-600 dark:text-slate-100'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          Indisponible
        </button>
      </div>

      {error && <p className="text-xs text-error-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !category.trim()}
          className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? '…' : existing ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
}
