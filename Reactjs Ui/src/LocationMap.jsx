import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import marker2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
export default function LocationMap({ latitude, longitude, onChange }) {
  const element = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const initial = useRef([latitude, longitude]);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) initial.current = [latitude, longitude];
  useEffect(() => {
    let disposed = false;
    let observer;
    import('leaflet').then(({ default: L }) => {
      if (disposed) return;
      const map = L.map(element.current).setView(initial.current, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      const icon = L.icon({ iconUrl: markerUrl, iconRetinaUrl: marker2xUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41] });
      markerRef.current = L.marker(initial.current, { icon }).addTo(map);
      map.on('click', event => callback.current({ latitude: event.latlng.lat.toFixed(6), longitude: event.latlng.lng.toFixed(6) }));
      mapRef.current = map;
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(element.current);
      }
    });
    return () => { disposed = true; observer?.disconnect(); mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);
  useEffect(() => {
    if (mapRef.current && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      markerRef.current?.setLatLng([latitude, longitude]);
      mapRef.current.panTo([latitude, longitude], { animate: false });
    }
  }, [latitude, longitude]);
  return <div ref={element} className="location-map" role="region" aria-label="Location map. You can also enter coordinates in the fields above." />;
}
