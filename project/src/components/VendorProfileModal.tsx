import { useEffect, useState } from 'react';
import {
  X,
  Phone,
  Tag,
  TrendingUp,
  TrendingDown,
  Store,
  ChevronRight,
  MessageSquare,
  Navigation,
  MapPin,
} from 'lucide-react';
import type { Cabin, Vendor, VendorProduct } from '@/types';
import { ClientChatModal } from './ClientChatModal';
import { directionsUrl, distanceInMeters, formatDistance, type Coords } from '@/lib/geo';

interface Props {
  vendor: Vendor;
  vendors: Vendor[];
  products: VendorProduct[];
  cabin: Cabin;
  userCoords: Coords | null;
  onClose: () => void;
  onSelectVendor: (vendor: Vendor) => void;
}

type Tab = 'products' | 'nearby';

const STATUS_CONFIG: Record<string, { label: string; text: string; dot: string }> = {
  available: { label: 'Disponible', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  out_of_stock: { label: 'En rupture', text: 'text-stone-500 dark:text-stone-400', dot: 'bg-stone-400' },
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}

export function VendorProfileModal({
  vendor,
  vendors,
  products,
  cabin,
  userCoords,
  onClose,
  onSelectVendor,
}: Props) {
  const [tab, setTab] = useState<Tab>('products');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setTab('products');
  }, [vendor.id]);

  const status = STATUS_CONFIG[vendor.status] ?? STATUS_CONFIG.available;
  const nearby = vendors.filter((v) => v.id !== vendor.id);
  const hasCoords = vendor.latitude != null && vendor.longitude != null;
  const distanceMeters =
    userCoords && hasCoords
      ? distanceInMeters(userCoords, { latitude: vendor.latitude!, longitude: vendor.longitude! })
      : null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900 shadow-xl modal-sheet">
        {/* header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-start gap-3 p-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-700">
              {vendor.photo_url ? (
                <img src={vendor.photo_url} alt={vendor.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-500">
                  <Tag size={22} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-stone-800 dark:text-stone-100 leading-tight truncate">{vendor.name}</h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{vendor.business_type}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  <span className={`font-medium ${status.text}`}>{status.label}</span>
                </span>
                {distanceMeters != null && (
                  <span className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
                    <MapPin size={11} /> {formatDistance(distanceMeters)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X size={20} />
            </button>
          </div>

          <div
            className={`mx-4 mb-3 grid gap-2 ${
              vendor.phone && hasCoords
                ? 'grid-cols-3'
                : vendor.phone || hasCoords
                ? 'grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 transition-transform active:scale-[0.97]"
              >
                <Phone size={14} /> Appeler
              </a>
            )}
            {hasCoords && (
              <a
                href={directionsUrl({ latitude: vendor.latitude!, longitude: vendor.longitude! })}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 transition-transform active:scale-[0.97]"
              >
                <Navigation size={14} /> Itinéraire
              </a>
            )}
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-800 dark:bg-stone-700 py-2 text-sm font-semibold text-white transition-all hover:bg-stone-700 dark:hover:bg-stone-600 active:scale-[0.97]"
            >
              <MessageSquare size={14} /> Message
            </button>
          </div>

          <div className="flex gap-1 px-4 pb-3">
            <button
              onClick={() => setTab('products')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                tab === 'products'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
              }`}
            >
              Produits
            </button>
            <button
              onClick={() => setTab('nearby')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                tab === 'nearby'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
              }`}
            >
              Boutiques à proximité
            </button>
          </div>
        </div>

        <div key={tab} className="p-4 space-y-4 tab-fade">
          {tab === 'products' ? (
            <>
              {/* cabin rate context */}
              <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Taux de la cabine
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                    <TrendingUp size={12} /> {formatPrice(cabin.buy_rate)}
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                    <TrendingDown size={12} /> {formatPrice(cabin.sell_rate)}
                  </span>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3"
                    >
                      <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{p.name}</span>
                      <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        {formatPrice(p.price)} {cabin.local_symbol}
                        {p.unit && <span className="text-stone-400 dark:text-stone-500 font-normal"> / {p.unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              ) : vendor.price_info ? (
                <div className="rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3">
                  <p className="text-sm text-stone-600 dark:text-stone-300">{vendor.price_info}</p>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">
                  Aucun produit renseigné pour le moment.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {nearby.length > 0 ? (
                nearby.map((v) => {
                  const vStatus = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.available;
                  const vDistance =
                    userCoords && v.latitude != null && v.longitude != null
                      ? distanceInMeters(userCoords, { latitude: v.latitude, longitude: v.longitude })
                      : null;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelectVendor(v)}
                      className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-700 active:scale-[0.99]"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-700">
                        {v.photo_url ? (
                          <img src={v.photo_url} alt={v.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-500">
                            <Store size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{v.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          {v.business_type}
                          <span className={`h-1.5 w-1.5 rounded-full ${vStatus.dot}`} />
                          {vDistance != null && <span>· {formatDistance(vDistance)}</span>}
                        </p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-stone-300 dark:text-stone-600" />
                    </button>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">
                  Aucune autre boutique à proximité pour l'instant.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {chatOpen && (
      <ClientChatModal cabin={cabin} vendor={vendor} onClose={() => setChatOpen(false)} />
    )}
    </>
  );
}
