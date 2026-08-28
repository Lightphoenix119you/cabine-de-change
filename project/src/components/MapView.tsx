import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Cabin, Vendor } from '@/types';
import type { Coords } from '@/lib/geo';
import { useTheme } from '@/lib/theme';

const KINSHASA_FALLBACK: Coords = { latitude: -4.4419, longitude: 15.2663 };

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color}" class="h-4 w-4 rounded-full border-2 border-white shadow-md"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

const cabinIcon = pinIcon('#d97706');
const vendorAvailableIcon = pinIcon('#22c55e');
const vendorOutIcon = pinIcon('#a8a29e');
const userIcon = pinIcon('#2563eb');

function FitBounds({ points }: { points: Coords[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.latitude, p.longitude] as [number, number]),
      { padding: [40, 40] }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

interface Props {
  cabin: Cabin;
  vendors: Vendor[];
  userCoords: Coords | null;
  onSelectVendor: (vendor: Vendor) => void;
}

export function MapView({ cabin, vendors, userCoords, onSelectVendor }: Props) {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);

  const cabinCoords: Coords | null =
    cabin.latitude != null && cabin.longitude != null
      ? { latitude: cabin.latitude, longitude: cabin.longitude }
      : null;

  const vendorPoints = vendors.filter((v) => v.latitude != null && v.longitude != null);

  const allPoints = useMemo(() => {
    const pts: Coords[] = [];
    if (cabinCoords) pts.push(cabinCoords);
    vendorPoints.forEach((v) => pts.push({ latitude: v.latitude!, longitude: v.longitude! }));
    if (userCoords) pts.push(userCoords);
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabin.id, vendors, userCoords]);

  const center = cabinCoords ?? userCoords ?? KINSHASA_FALLBACK;

  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png';

  if (!cabinCoords && vendorPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 py-16 px-6 text-center">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
          Aucune position enregistrée pour le moment.
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          L'opérateur peut ajouter les coordonnées de la cabine et des vendeurs depuis le tableau
          de bord.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm">
      <MapContainer
        ref={mapRef}
        center={[center.latitude, center.longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '60vh', width: '100%' }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitBounds points={allPoints} />

        {cabinCoords && (
          <Marker position={[cabinCoords.latitude, cabinCoords.longitude]} icon={cabinIcon}>
            <Popup>
              <span className="font-semibold">{cabin.name}</span>
              <br />
              Cabine de change
            </Popup>
          </Marker>
        )}

        {vendorPoints.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude!, v.longitude!]}
            icon={v.status === 'available' ? vendorAvailableIcon : vendorOutIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs text-stone-500">{v.business_type}</p>
                <button
                  onClick={() => onSelectVendor(v)}
                  className="mt-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  Voir la fiche
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {userCoords && (
          <Marker position={[userCoords.latitude, userCoords.longitude]} icon={userIcon}>
            <Popup>Vous êtes ici</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
