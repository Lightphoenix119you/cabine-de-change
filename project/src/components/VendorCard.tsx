import { Phone, Tag, ChevronRight, MapPin } from 'lucide-react';
import type { Vendor } from '@/types';
import { formatDistance } from '@/lib/geo';

interface Props {
  vendor: Vendor;
  onSelect?: (vendor: Vendor) => void;
  distanceMeters?: number | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  available: {
    label: 'Disponible',
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  out_of_stock: {
    label: 'En rupture',
    bg: 'bg-stone-100 dark:bg-stone-700',
    text: 'text-stone-500 dark:text-stone-300',
    dot: 'bg-stone-400',
  },
};

export function VendorCard({ vendor, onSelect, distanceMeters }: Props) {
  const status = STATUS_CONFIG[vendor.status] ?? STATUS_CONFIG.available;

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(vendor)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(vendor);
        }
      }}
      className="overflow-hidden rounded-2xl bg-white dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 transition-all hover:shadow-md dark:hover:border-stone-600 active:scale-[0.98] cursor-pointer"
    >
      <div className="relative aspect-square bg-stone-100 dark:bg-stone-700">
        {vendor.photo_url ? (
          <img
            src={vendor.photo_url}
            alt={vendor.name}
            loading="lazy"
            className={`h-full w-full object-cover ${
              vendor.status === 'out_of_stock' ? 'grayscale opacity-70' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300 dark:text-stone-500">
            <Tag size={32} />
          </div>
        )}
        <div
          className={`absolute top-2 right-2 flex items-center gap-1.5 rounded-full ${status.bg} ${status.text} px-2 py-1 text-[10px] font-semibold backdrop-blur-sm`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>
        {distanceMeters != null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            <MapPin size={10} />
            {formatDistance(distanceMeters)}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 leading-tight truncate">
            {vendor.name}
          </h3>
          {onSelect && <ChevronRight size={14} className="shrink-0 text-stone-300 dark:text-stone-600" />}
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{vendor.business_type}</p>
        {vendor.price_info && (
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-snug">
            {vendor.price_info}
          </p>
        )}
        {vendor.phone && (
          <a
            href={`tel:${vendor.phone.replace(/\s/g, '')}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 transition-colors hover:text-amber-600 dark:hover:text-amber-400"
          >
            <Phone size={12} />
            {vendor.phone}
          </a>
        )}
      </div>
    </div>
  );
}
