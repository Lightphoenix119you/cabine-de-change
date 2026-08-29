import { Store } from 'lucide-react';
import type { LocalVendor } from '@/lib/types';

export function LocalVendorCard({ vendor }: { vendor: LocalVendor }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-800/60">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
        {vendor.photo_url ? (
          <img src={vendor.photo_url} alt={vendor.name} className="h-full w-full object-cover" />
        ) : (
          <Store className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{vendor.name}</h4>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              vendor.is_active ? 'bg-success-500' : 'bg-slate-300'
            }`}
          />
        </div>
        <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{vendor.category}</p>
        {vendor.products_summary && (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {vendor.products_summary}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          vendor.is_active
            ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
        }`}
      >
        {vendor.is_active ? 'Disponible' : 'Indisponible'}
      </span>
    </div>
  );
}
