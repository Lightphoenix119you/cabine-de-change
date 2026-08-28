import { LocateFixed } from 'lucide-react';

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-700 ${className}`}
    />
  );
}

export function SkeletonVendorCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
      <div className="aspect-square animate-pulse bg-stone-200 dark:bg-stone-700" />
      <div className="p-3 space-y-2">
        <SkeletonLine className="h-3.5 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
        <SkeletonLine className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function GpsLocatingBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-[11px] font-medium text-stone-400 dark:text-stone-500">
      <LocateFixed size={12} className="animate-pulse" />
      Localisation...
    </div>
  );
}
