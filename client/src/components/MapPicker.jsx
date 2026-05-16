import { useEffect, useRef } from 'react';

export default function MapPicker({ center, onSelect, markers = [], readonly = false }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let map = null;

    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || instanceRef.current) return;

      const defaultCenter = center || { lat: 12.9716, lng: 77.5946 };
      map = L.map(mapRef.current).setView([defaultCenter.lat, defaultCenter.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      instanceRef.current = map;

      // Green marker icon
      const greenIcon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const redIcon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#ef4444;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      // Show read-only markers
      markers.forEach((m) => {
        const icon = m.type === 'high' ? redIcon : greenIcon;
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${m.label}</b><br>${m.sub || ''}`);
      });

      // Allow clicking to place marker (donor form)
      if (!readonly && onSelect) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) markerRef.current.remove();
          markerRef.current = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
          onSelect({ lat, lng });
        });
      }

      // If a center marker provided (edit mode)
      if (center?.lat && center?.lng) {
        markerRef.current = L.marker([center.lat, center.lng], { icon: greenIcon }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (e) {}
        markerRef.current = null;
      }

      // Only remove the authoritative instanceRef map. Protect against
      // race conditions where multiple async imports try to create/remove
      // maps on the same container by using try/catch and ownership checks.
      if (instanceRef.current) {
        try {
          instanceRef.current.off();
          instanceRef.current.remove();
        } catch (e) {}
        instanceRef.current = null;
      } else if (map) {
        // If a local map was created but not stored, remove it safely.
        try {
          map.off();
          map.remove();
        } catch (e) {}
        map = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="map-container" style={{ height: '100%', width: '100%' }} />;
}
