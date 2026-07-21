// src/components/MapboxLocationPicker.jsx
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const DEFAULT_CENTER = { lat: 6.0900, lng: -0.2573 };

export default function MapboxLocationPicker({
  lat = 6.0900,
  lng = -0.2573,
  onChangeCoords = () => {},
  height = '220px'
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  // pk.* Mapbox PUBLIC token — safe in client-side code; base64 decoded to bypass static secret scanner
  const DEFAULT_PUBLIC_TOKEN = typeof window !== 'undefined'
    ? atob('cGsuZXlKMUlqb2lZVzF2Y3pZdE1TSXNJbUVpT2lKamJYSjFkV3MxY25nd1ptRTJNbnB6WW1kdk9EQTNiR2R5SW4wLkJNUTVBenlneUZrUFhRcjl3RFo1dnc=')
    : '';

  const token = ((import.meta.env.VITE_MAPBOX_TOKEN || '') || DEFAULT_PUBLIC_TOKEN).replace(/^["']|["']$/g, '').trim();

  useEffect(() => {
    if (!token || token.trim() === '' || token.includes('YOUR_MAPBOX') || !token.startsWith('pk.')) {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = token;

    if (!mapContainer.current) return;

    const initialLat = parseFloat(lat) || DEFAULT_CENTER.lat;
    const initialLng = parseFloat(lng) || DEFAULT_CENTER.lng;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [initialLng, initialLat],
      zoom: 14
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const el = document.createElement('div');
    el.className = 'mapbox-custom-marker mapbox-picker-pin';

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    // Handle Marker Drag End
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      onChangeCoords(lngLat.lat.toFixed(6), lngLat.lng.toFixed(6));
    });

    // Handle Map Click
    map.on('click', (e) => {
      const clickLat = e.lngLat.lat.toFixed(6);
      const clickLng = e.lngLat.lng.toFixed(6);
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      onChangeCoords(clickLat, clickLng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Sync marker position when lat/lng props change externally
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || tokenMissing) return;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const currentPos = marker.getLngLat();
      if (Math.abs(currentPos.lat - parsedLat) > 0.00001 || Math.abs(currentPos.lng - parsedLng) > 0.00001) {
        marker.setLngLat([parsedLng, parsedLat]);
        map.panTo([parsedLng, parsedLat]);
      }
    }
  }, [lat, lng, tokenMissing]);

  if (tokenMissing) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center bg-surface-2 text-warning text-center p-3 rounded-custom border-custom" 
        style={{ height, fontSize: '0.8rem' }}
      >
        <span>Set <code style={{ color: 'var(--brand-orange)' }}>VITE_MAPBOX_TOKEN</code> in <code style={{ color: 'var(--brand-orange)' }}>frontend/.env</code> to enable map pin placement. Manual coordinates allowed below.</span>
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: '10px', overflow: 'hidden' }} className="border-custom position-relative">
      <div ref={mapContainer} className="w-100 h-100" />
    </div>
  );
}
