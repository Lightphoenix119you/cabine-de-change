import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { KINSHASA_CENTER } from '@/lib/constants';
import type { BureauWithRate, LocalVendor } from '@/lib/types';
import { formatCDF } from '@/lib/format';

interface BureauMapProps {
  bureaus: BureauWithRate[];
  vendors?: LocalVendor[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectBureau?: (bureau: BureauWithRate) => void;
}

export function BureauMap({ bureaus, vendors = [], userCoords, onSelectBureau }: BureauMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelectBureau);
  onSelectRef.current = onSelectBureau;

  // Init map + cluster group once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: KINSHASA_CENTER,
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({ maxClusterRadius: 50 });
    map.addLayer(cluster);

    mapRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // Rebuild markers when bureaus/vendors change
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();

    const validBureaus = bureaus.filter(
      (b) => b.latitude != null && b.longitude != null
    ) as (BureauWithRate & { latitude: number; longitude: number })[];

    validBureaus.forEach((b) => {
      const isVerified = b.latest?.status === 'verified';
      const color = isVerified ? '#2563eb' : '#f59e0b';
      const rateLabel = b.latest?.usd_sell ? formatCDF(b.latest.usd_sell) : '';
      const icon = L.divIcon({
        className: 'cdc-marker',
        html: `<div style="display:flex;align-items:center;background:${color};color:white;font-size:10px;font-weight:700;padding:3px 7px;border-radius:12px 12px 12px 2px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;">${rateLabel || 'FC'}</div>`,
        iconSize: undefined,
        iconAnchor: [10, 24],
      });

      const marker = L.marker([b.latitude, b.longitude], { icon });
      const rateText = b.latest
        ? `<div style="font-size:11px;color:#666;margin-top:4px;">Achat: ${formatCDF(b.latest.usd_buy)} FC · Vente: ${formatCDF(b.latest.usd_sell)} FC</div>`
        : '';
      const verifiedText = isVerified
        ? '<span style="color:#2563eb;font-weight:600;">Vérifié</span>'
        : '<span style="color:#f59e0b;font-weight:600;">Non vérifié</span>';
      marker.bindPopup(
        `<div style="min-width:160px;">
          <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${b.name}</div>
          <div style="font-size:11px;color:#888;">${b.municipality} · ${verifiedText}</div>
          ${rateText}
          <a href="https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}" target="_blank" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563eb;font-weight:600;text-decoration:none;">Itinéraire &rarr;</a>
        </div>`
      );
      marker.on('click', () => onSelectRef.current?.(b));
      cluster.addLayer(marker);
    });

    const validVendors = vendors.filter((v) => v.latitude != null && v.longitude != null);
    validVendors.forEach((v) => {
      const icon = L.divIcon({
        className: 'cdc-vendor-marker',
        html: `<div style="background:#16a34a;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([v.latitude as number, v.longitude as number], { icon });
      marker.bindPopup(
        `<div style="min-width:140px;">
          <div style="font-weight:700;font-size:12px;">${v.name}</div>
          <div style="font-size:11px;color:#888;">${v.category}</div>
        </div>`
      );
      cluster.addLayer(marker);
    });

    const allPoints: [number, number][] = [
      ...validBureaus.map((b) => [b.latitude, b.longitude] as [number, number]),
      ...validVendors.map((v) => [v.latitude as number, v.longitude as number] as [number, number]),
    ];
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints).pad(0.2));
    }
  }, [bureaus, vendors]);

  // Update user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const icon = L.divIcon({
        className: 'cdc-user-marker',
        html: `<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon })
        .addTo(map)
        .bindPopup('<div style="font-size:12px;font-weight:600;">Vous êtes ici</div>');
    }
  }, [userCoords]);

  return (
    <div>
      <div ref={containerRef} className="h-[400px] w-full rounded-2xl" />
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary-600" /> Cabine vérifiée</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Cabine non vérifiée</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-600" /> Commerce du quartier</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Vous</span>
      </div>
    </div>
  );
}
