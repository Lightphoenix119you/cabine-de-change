import { MapPin, Phone, MessageCircle, MessageSquare, Clock, Navigation } from 'lucide-react';
import type { Cabin } from '@/types';
import { directionsUrl, formatDistance } from '@/lib/geo';
import { ThemeToggle } from './ThemeToggle';
import { GpsLocatingBadge } from './Skeleton';

interface Props {
  cabin: Cabin;
  onMessageClick: () => void;
  geoLoading: boolean;
  distanceMeters: number | null;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'Non renseigné';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Non renseigné';
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Aujourd'hui à ${time}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` à ${time}`;
}

export function CabinHeader({ cabin, onMessageClick, geoLoading, distanceMeters }: Props) {
  const whatsappLink = cabin.whatsapp
    ? `https://wa.me/${cabin.whatsapp.replace(/[^0-9]/g, '')}`
    : null;

  const hasCoords = cabin.latitude != null && cabin.longitude != null;

  return (
    <header className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-800 p-5 text-white shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-300" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-50">
              Ouvert
            </span>
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100/80">
            Singularité
          </p>
          <h1 className="text-xl font-bold leading-tight truncate">{cabin.name}</h1>
          {cabin.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-50">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{cabin.location}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <ThemeToggle />
          <button
            onClick={onMessageClick}
            className="rounded-xl bg-white/20 p-2.5 transition-colors hover:bg-white/30 active:scale-95"
            aria-label="Message"
          >
            <MessageSquare size={18} />
          </button>
          {cabin.phone && (
            <a
              href={`tel:${cabin.phone.replace(/\s/g, '')}`}
              className="rounded-xl bg-white/20 p-2.5 transition-colors hover:bg-white/30 active:scale-95"
              aria-label="Appeler"
            >
              <Phone size={18} />
            </a>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-white p-2.5 text-green-600 transition-colors hover:bg-green-50 active:scale-95"
              aria-label="WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-amber-50">
          <Clock size={13} />
          <span>Taux mis à jour {formatTimestamp(cabin.rates_updated_at)}</span>
        </div>

        {hasCoords && (
          <div className="flex items-center gap-2 shrink-0">
            {geoLoading ? (
              <GpsLocatingBadge />
            ) : distanceMeters != null ? (
              <span className="text-xs font-semibold text-amber-50">
                à {formatDistance(distanceMeters)}
              </span>
            ) : null}
            <a
              href={directionsUrl({ latitude: cabin.latitude!, longitude: cabin.longitude! })}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/30 active:scale-95"
            >
              <Navigation size={11} /> Itinéraire
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
