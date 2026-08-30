import { useState } from 'react';
import { Loader2, Plus, Save, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MUNICIPALITIES } from '@/lib/constants';
import { LocationPicker } from './LocationPicker';
import { LocalVendorForm } from './LocalVendorForm';
import { LocalVendorCard } from './LocalVendorCard';
import { useLocalVendors } from '@/hooks/useLocalVendors';
import type { BureauWithRate } from '@/lib/types';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

interface CreateBureauFormProps {
  userId: string;
  onCreated: () => void;
}

function CreateBureauForm({ userId, onCreated }: CreateBureauFormProps) {
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [address, setAddress] = useState('');
  const [addressDescription, setAddressDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!supabase || !name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('bureaus').insert({
      name: name.trim(),
      municipality,
      address: address.trim() || null,
      address_description: addressDescription.trim() || null,
      phone: phone.trim() || null,
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
      user_id: userId,
      verified: false,
    });
    setSaving(false);
    if (err) {
      setError('Création impossible — reconnectez-vous et réessayez.');
      return;
    }
    onCreated();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Créer ma cabine de change</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Votre cabine sera visible immédiatement, marquée "non vérifiée" jusqu'à validation par un
        administrateur.
      </p>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom de la cabine *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cabine Centrale" className={inputClass} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Commune *</span>
        <select value={municipality} onChange={(e) => setMunicipality(e.target.value)} className={inputClass}>
          {MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Adresse</span>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Avenue du Marché" className={inputClass} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Repère / description du lieu</span>
        <input
          value={addressDescription}
          onChange={(e) => setAddressDescription(e.target.value)}
          placeholder="En face de la pharmacie, à côté du rond-point"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Téléphone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243…" className={inputClass} />
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
      </div>

      {error && <p className="text-xs text-error-500">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={saving || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Créer ma cabine
      </button>
    </div>
  );
}

function RatesEditor({ bureau, onSaved }: { bureau: BureauWithRate; onSaved: () => void }) {
  const [buy, setBuy] = useState(bureau.latest?.usd_buy != null ? String(bureau.latest.usd_buy) : '');
  const [sell, setSell] = useState(bureau.latest?.usd_sell != null ? String(bureau.latest.usd_sell) : '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSave() {
    if (!supabase) return;
    const b = parseFloat(buy);
    const s = parseFloat(sell);
    if (isNaN(b) || isNaN(s)) return;
    setSaving(true);
    await supabase.from('exchange_rates').insert({
      bureau_id: bureau.id,
      usd_buy: b,
      usd_sell: s,
      status: 'verified',
    });
    setSaving(false);
    setDone(true);
    onSaved();
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mettre à jour mes taux</h4>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Achat (FC)</span>
          <input value={buy} onChange={(e) => setBuy(e.target.value)} inputMode="decimal" className={inputClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vente (FC)</span>
          <input value={sell} onChange={(e) => setSell(e.target.value)} inputMode="decimal" className={inputClass} />
        </label>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !buy.trim() || !sell.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {done ? 'Enregistré ✓' : saving ? '…' : 'Publier mes taux'}
      </button>
    </div>
  );
}

function BureauManager({ bureau, onChanged }: { bureau: BureauWithRate; onChanged: () => void }) {
  const { vendors, loading, refetch } = useLocalVendors(bureau.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const editingVendor = vendors.find((v) => v.id === editing) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            bureau.verified
              ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {bureau.verified ? 'Vérifiée' : 'En attente de vérification'}
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{bureau.name}</span>
      </div>

      <RatesEditor bureau={bureau} onSaved={onChanged} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            <Store className="h-4 w-4" /> Boutiques du quartier ({vendors.length})
          </h4>
          {!formOpen && (
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          )}
        </div>

        {formOpen && (
          <LocalVendorForm
            bureauId={bureau.id}
            bureauLatitude={bureau.latitude}
            bureauLongitude={bureau.longitude}
            existing={editingVendor}
            onDone={() => {
              setFormOpen(false);
              setEditing(null);
              refetch();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}

        {!formOpen && (
          <div className="space-y-2">
            {loading ? (
              <p className="py-4 text-center text-xs text-slate-400">Chargement…</p>
            ) : vendors.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                Aucun commerce affilié pour l'instant.
              </p>
            ) : (
              vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setEditing(v.id);
                    setFormOpen(true);
                  }}
                  className="block w-full text-left"
                >
                  <LocalVendorCard vendor={v} />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface BureauOwnerDashboardProps {
  userId: string;
  ownedBureaus: BureauWithRate[];
  onChanged: () => void;
}

export function BureauOwnerDashboard({ userId, ownedBureaus, onChanged }: BureauOwnerDashboardProps) {
  const [activeId, setActiveId] = useState<string | null>(ownedBureaus[0]?.id ?? null);
  const [creating, setCreating] = useState(ownedBureaus.length === 0);

  const active = ownedBureaus.find((b) => b.id === activeId) ?? ownedBureaus[0] ?? null;

  return (
    <div className="space-y-4">
      {ownedBureaus.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ownedBureaus.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setActiveId(b.id);
                setCreating(false);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active?.id === b.id && !creating
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              creating ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            <Plus className="h-3 w-3" /> Nouvelle
          </button>
        </div>
      )}

      {creating || !active ? (
        <CreateBureauForm
          userId={userId}
          onCreated={() => {
            setCreating(false);
            onChanged();
          }}
        />
      ) : (
        <BureauManager bureau={active} onChanged={onChanged} />
      )}
    </div>
  );
}
