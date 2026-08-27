import { useMemo } from 'react';
import { ShoppingBasket, LocateFixed } from 'lucide-react';
import type { Vendor } from '@/types';
import { VendorCard } from './VendorCard';
import { distanceInMeters, type Coords } from '@/lib/geo';

interface Props {
  vendors: Vendor[];
  availableCount: number;
  onSelectVendor: (vendor: Vendor) => void;
  userCoords: Coords | null;
  geoLoading: boolean;
}

export function VendorsSection({
  vendors,
  availableCount,
  onSelectVendor,
  userCoords,
  geoLoading,
}: Props) {
  const sorted = useMemo(() => {
    if (!userCoords) return vendors;
    const withDistance = vendors.map((v) => ({
      vendor: v,
      distance:
        v.latitude != null && v.longitude != null
          ? distanceInMeters(userCoords, { latitude: v.latitude, longitude: v.longitude })
          : null,
    }));
    withDistance.sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
    return withDistance.map((w) => w.vendor);
  }, [vendors, userCoords]);

  if (vendors.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-8 text-center">
        <ShoppingBasket className="mx-auto text-stone-300 dark:text-stone-600" size={36} />
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          Aucun vendeur enregistré pour le moment.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-stone-700 dark:text-stone-200 uppercase tracking-wide">
            Marché du quartier
          </h2>
          {userCoords ? (
            <p className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
              <LocateFixed size={10} /> Trié par proximité
            </p>
          ) : geoLoading ? (
            <p className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
              <LocateFixed size={10} className="animate-pulse" /> Localisation en cours...
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-green-50 dark:bg-green-950 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 shrink-0">
          {availableCount} disponible{availableCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sorted.map((v) => (
          <VendorCard
            key={v.id}
            vendor={v}
            onSelect={onSelectVendor}
            distanceMeters={
              userCoords && v.latitude != null && v.longitude != null
                ? distanceInMeters(userCoords, { latitude: v.latitude, longitude: v.longitude })
                : null
            }
          />
        ))}
      </div>
    </section>
  );
}
