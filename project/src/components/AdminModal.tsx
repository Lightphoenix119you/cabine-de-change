import { useCallback, useEffect, useState } from 'react';
import { X, Save, Plus, Pencil, Trash2, Check, ChevronLeft, ChevronRight, MessageSquare, LogOut } from 'lucide-react';
import type { Cabin, Conversation, Vendor, VendorProduct, VendorStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { ChatThread } from './ChatThread';
import { OperatorAuthGate } from './OperatorAuthGate';
import { LocationPicker } from './LocationPicker';
import type { Session } from '@supabase/supabase-js';

interface Props {
  open: boolean;
  cabin: Cabin;
  vendors: Vendor[];
  vendorProducts: VendorProduct[];
  session: Session | null;
  checkedAuth: boolean;
  onSessionChange: (session: Session) => void;
  onClose: () => void;
  onRatesUpdated: () => void;
  onVendorsChanged: () => void;
  onMessagesChanged: () => void;
}

type Tab = 'rates' | 'vendors' | 'messages';

export function AdminModal({
  open,
  cabin,
  vendors,
  vendorProducts,
  session,
  checkedAuth,
  onSessionChange,
  onClose,
  onRatesUpdated,
  onVendorsChanged,
  onMessagesChanged,
}: Props) {
  const [tab, setTab] = useState<Tab>('rates');

  useEffect(() => {
    if (open) setTab('rates');
  }, [open]);

  if (!open) return null;

  const isOperator = !!session && session.user.id === cabin.operator_id;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-backdrop"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900 shadow-xl modal-sheet">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-5 py-4">
          <h2 className="font-bold text-stone-800 dark:text-stone-100">Tableau de bord</h2>
          <div className="flex items-center gap-1">
            {isOperator && (
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-red-500"
                aria-label="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!checkedAuth ? (
          <div className="p-4" />
        ) : !isOperator ? (
          <div className="p-4">
            <OperatorAuthGate
              onAuthenticated={onSessionChange}
              subtitle="Connectez-vous avec le compte opérateur de cette cabine."
            />
          </div>
        ) : (
          <>
            <div className="flex gap-1 p-4 pb-0">
              <button
                onClick={() => setTab('rates')}
                className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === 'rates'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Taux
              </button>
              <button
                onClick={() => setTab('vendors')}
                className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === 'vendors'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Vendeurs
              </button>
              <button
                onClick={() => setTab('messages')}
                className={`flex-1 rounded-xl py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === 'messages'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Messages
              </button>
            </div>

            <div key={tab} className="p-4 tab-fade">
              {tab === 'rates' ? (
                <RatesForm cabin={cabin} onSaved={onRatesUpdated} />
              ) : tab === 'vendors' ? (
                <VendorsManager
                  cabin={cabin}
                  vendors={vendors}
                  vendorProducts={vendorProducts}
                  onChanged={onVendorsChanged}
                />
              ) : (
                <MessagesManager cabin={cabin} vendors={vendors} onChanged={onMessagesChanged} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RatesForm({
  cabin,
  onSaved,
}: {
  cabin: Cabin;
  onSaved: () => void;
}) {
  const [buy, setBuy] = useState(String(cabin.buy_rate));
  const [sell, setSell] = useState(String(cabin.sell_rate));
  const [latitude, setLatitude] = useState(cabin.latitude != null ? String(cabin.latitude) : '');
  const [longitude, setLongitude] = useState(cabin.longitude != null ? String(cabin.longitude) : '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBuy(String(cabin.buy_rate));
    setSell(String(cabin.sell_rate));
    setLatitude(cabin.latitude != null ? String(cabin.latitude) : '');
    setLongitude(cabin.longitude != null ? String(cabin.longitude) : '');
  }, [cabin]);

  async function handleSave() {
    const b = parseFloat(buy);
    const s = parseFloat(sell);
    if (isNaN(b) || isNaN(s) || b <= 0 || s <= 0) return;
    setSaving(true);
    setDone(false);
    setError(null);
    const { error } = await supabase
      .from('cabins')
      .update({
        buy_rate: b,
        sell_rate: s,
        rates_updated_at: new Date().toISOString(),
        latitude: latitude.trim() ? parseFloat(latitude) : null,
        longitude: longitude.trim() ? parseFloat(longitude) : null,
      })
      .eq('id', cabin.id);
    setSaving(false);
    if (error) {
      setError('Enregistrement impossible — reconnectez-vous et réessayez.');
      return;
    }
    setDone(true);
    onSaved();
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4 space-y-3">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Mettez à jour les taux d'achat et de vente pour {cabin.base_currency}/{cabin.local_currency}.
          La date « dernière mise à jour » se règle automatiquement.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
            Taux d'achat ({cabin.local_symbol}/{cabin.base_currency})
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={buy}
            onChange={(e) => setBuy(e.target.value)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 font-semibold text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
            Taux de vente ({cabin.local_symbol}/{cabin.base_currency})
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 font-semibold text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900"
          />
        </label>
      </div>

      <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4">
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-semibold text-white transition-all hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
      >
        {done ? (
          <>
            <Check size={18} /> Enregistré
          </>
        ) : (
          <>
            <Save size={18} /> {saving ? 'Enregistrement...' : 'Mettre à jour en 1 clic'}
          </>
        )}
      </button>
    </div>
  );
}

function VendorsManager({
  cabin,
  vendors,
  vendorProducts,
  onChanged,
}: {
  cabin: Cabin;
  vendors: Vendor[];
  vendorProducts: VendorProduct[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function handleEdit(v: Vendor) {
    setEditing(v);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="space-y-3">
      {!showForm && (
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 py-3 font-semibold text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <Plus size={18} /> Ajouter un vendeur
        </button>
      )}

      {showForm && (
        <VendorForm
          cabinId={cabin.id}
          cabin={cabin}
          existing={editing}
          existingProducts={
            editing ? vendorProducts.filter((p) => p.vendor_id === editing.id) : []
          }
          onDone={() => {
            handleCloseForm();
            onChanged();
          }}
          onCancel={handleCloseForm}
        />
      )}

      <div className="space-y-2">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-700">
              {v.photo_url && (
                <img src={v.photo_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{v.name}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {v.business_type} ·{' '}
                <span
                  className={
                    v.status === 'available' ? 'text-green-600 dark:text-green-400' : 'text-stone-400 dark:text-stone-500'
                  }
                >
                  {v.status === 'available' ? 'Disponible' : 'En rupture'}
                </span>
              </p>
            </div>
            <button
              onClick={() => handleEdit(v)}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-amber-600 dark:hover:text-amber-400"
            >
              <Pencil size={16} />
            </button>
          </div>
        ))}
        {vendors.length === 0 && !showForm && (
          <p className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">
            Aucun vendeur. Ajoutez-en un ci-dessus.
          </p>
        )}
      </div>
    </div>
  );
}

function MessagesManager({
  cabin,
  vendors,
  onChanged,
}: {
  cabin: Cabin;
  vendors: Vendor[];
  onChanged: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConversation, setOpenConversation] = useState<Conversation | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('cabin_id', cabin.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    setConversations((data ?? []) as Conversation[]);
    setLoading(false);
  }, [cabin.id]);

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel(`conversations-admin-${cabin.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `cabin_id=eq.${cabin.id}` },
        () => loadConversations()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cabin.id, loadConversations]);

  function isUnread(conv: Conversation) {
    if (!conv.last_message_at) return false;
    if (!conv.operator_last_read_at) return true;
    return new Date(conv.last_message_at) > new Date(conv.operator_last_read_at);
  }

  function labelFor(conv: Conversation) {
    if (!conv.vendor_id) return cabin.name;
    return vendors.find((v) => v.id === conv.vendor_id)?.name ?? 'Vendeur';
  }

  async function openThread(conv: Conversation) {
    setOpenConversation(conv);
    if (isUnread(conv)) {
      await supabase
        .from('conversations')
        .update({ operator_last_read_at: new Date().toISOString() })
        .eq('id', conv.id);
      onChanged();
    }
  }

  if (openConversation) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenConversation(null)}
          className="flex items-center gap-1 text-xs font-medium text-stone-500 dark:text-stone-400 transition-colors hover:text-amber-600 dark:hover:text-amber-400"
        >
          <ChevronLeft size={14} /> Retour aux messages
        </button>
        <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {openConversation.client_name || 'Client'}{' '}
            <span className="font-normal text-stone-400 dark:text-stone-500">→ {labelFor(openConversation)}</span>
          </p>
          <div className="mt-2">
            <ChatThread conversationId={openConversation.id} role="operator" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">Chargement...</p>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-8 text-center">
          <MessageSquare className="mx-auto text-stone-300 dark:text-stone-600" size={28} />
          <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">Aucune conversation pour l'instant.</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => openThread(conv)}
            className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-700"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                {conv.client_name || 'Client'}
              </p>
              <p className="truncate text-xs text-stone-500 dark:text-stone-400">→ {labelFor(conv)}</p>
            </div>
            {isUnread(conv) && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
            <ChevronRight size={16} className="shrink-0 text-stone-300 dark:text-stone-600" />
          </button>
        ))
      )}
    </div>
  );
}

interface ProductRow {
  id?: string;
  name: string;
  price: string;
  unit: string;
}

function VendorForm({
  cabinId,
  cabin,
  existing,
  existingProducts,
  onDone,
  onCancel,
}: {
  cabinId: string;
  cabin: Cabin;
  existing: Vendor | null;
  existingProducts: VendorProduct[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [businessType, setBusinessType] = useState(existing?.business_type ?? '');
  const [photoUrl, setPhotoUrl] = useState(existing?.photo_url ?? '');
  const [status, setStatus] = useState<VendorStatus>(existing?.status ?? 'available');
  const [priceInfo, setPriceInfo] = useState(existing?.price_info ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [latitude, setLatitude] = useState(
    existing?.latitude != null ? String(existing.latitude) : cabin.latitude != null ? String(cabin.latitude) : ''
  );
  const [longitude, setLongitude] = useState(
    existing?.longitude != null ? String(existing.longitude) : cabin.longitude != null ? String(cabin.longitude) : ''
  );
  const [products, setProducts] = useState<ProductRow[]>(
    existingProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: String(p.price),
      unit: p.unit ?? '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateProduct(idx: number, field: keyof ProductRow, value: string) {
    setProducts((list) => list.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  function addProduct() {
    setProducts((list) => [...list, { name: '', price: '', unit: '' }]);
  }

  function removeProduct(idx: number) {
    setProducts((list) => list.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!name.trim() || !businessType.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      business_type: businessType.trim(),
      photo_url: photoUrl.trim() || null,
      status,
      price_info: priceInfo.trim() || null,
      phone: phone.trim() || null,
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
    };

    let vendorId = existing?.id ?? null;
    if (existing) {
      const { error } = await supabase.from('vendors').update(payload).eq('id', existing.id);
      if (error) {
        setSaving(false);
        setError('Enregistrement impossible — reconnectez-vous et réessayez.');
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('vendors')
        .insert({ ...payload, cabin_id: cabinId })
        .select('id')
        .single();
      if (error || !data) {
        setSaving(false);
        setError('Création impossible — reconnectez-vous et réessayez.');
        return;
      }
      vendorId = data.id;
    }

    if (vendorId) {
      // simplest correct approach for a short per-vendor list: replace the set
      await supabase.from('vendor_products').delete().eq('vendor_id', vendorId);
      const rows = products
        .filter((p) => p.name.trim() && p.price.trim())
        .map((p) => ({
          vendor_id: vendorId,
          name: p.name.trim(),
          price: parseFloat(p.price) || 0,
          unit: p.unit.trim() || null,
        }));
      if (rows.length > 0) {
        await supabase.from('vendor_products').insert(rows);
      }
    }

    setSaving(false);
    onDone();
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm('Supprimer ce vendeur ?')) return;
    setSaving(true);
    await supabase.from('vendors').delete().eq('id', existing.id);
    setSaving(false);
    onDone();
  }

  const inputClass =
    'w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900';

  return (
    <div className="space-y-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">
          {existing ? 'Modifier le vendeur' : 'Nouveau vendeur'}
        </h3>
        {existing && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Nom *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mama Bijoux"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Type d'activité *</span>
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Beignets, Fruits, Food..."
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Photo (URL)</span>
        <input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Résumé rapide (affiché sur la carte)</span>
        <input
          value={priceInfo}
          onChange={(e) => setPriceInfo(e.target.value)}
          placeholder="5 pièces pour 500 FC"
          className={inputClass}
        />
      </label>

      <div className="space-y-2 rounded-lg border border-stone-200 dark:border-stone-700 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
            Produits (affichés sur la fiche du vendeur)
          </span>
        </div>
        {products.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <input
              value={p.name}
              onChange={(e) => updateProduct(idx, 'name', e.target.value)}
              placeholder="Beignets"
              className={`${inputClass} flex-[2]`}
            />
            <input
              type="number"
              inputMode="decimal"
              value={p.price}
              onChange={(e) => updateProduct(idx, 'price', e.target.value)}
              placeholder="500"
              className={`${inputClass} flex-1`}
            />
            <input
              value={p.unit}
              onChange={(e) => updateProduct(idx, 'unit', e.target.value)}
              placeholder="pièce"
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => removeProduct(idx)}
              className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500"
              aria-label="Supprimer ce produit"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          onClick={addProduct}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 py-2 text-xs font-semibold text-stone-500 dark:text-stone-400 transition-colors hover:bg-stone-50 dark:hover:bg-stone-700"
        >
          <Plus size={14} /> Ajouter un produit
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Téléphone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+243 ..."
          className={inputClass}
        />
      </label>

      <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-3">
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        <p className="mt-1.5 text-[11px] text-stone-400 dark:text-stone-500">
          Pré-rempli avec la position de la cabine — ajustez si le vendeur est ailleurs.
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Statut</span>
        <div className="flex gap-2">
          <button
            onClick={() => setStatus('available')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              status === 'available'
                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-800'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
            }`}
          >
            Disponible
          </button>
          <button
            onClick={() => setStatus('out_of_stock')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              status === 'out_of_stock'
                ? 'bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-200 ring-1 ring-stone-400 dark:ring-stone-500'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
            }`}
          >
            En rupture
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-stone-200 dark:border-stone-700 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !businessType.trim()}
          className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? '...' : existing ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </div>
  );
}
