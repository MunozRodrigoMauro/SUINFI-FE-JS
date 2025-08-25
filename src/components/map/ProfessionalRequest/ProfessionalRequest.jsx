// src/components/map/ProfessionalRequest/MapCanvas.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

// util
const isFiniteCoord = (n) => Number.isFinite(n);

export default function MapCanvas({
  center = { lat: -34.6037, lng: -58.3816 },
  zoom = 12,
  markers = [],           // [{lat,lng,color,title}]
  radiusKm = null,        // number | null
  draggable = false,      // 👈 habilita arrastre del marker principal
  onDragStart,            // (pos) => void
  onDrag,                 // (pos) => void
  onDragEnd,              // (pos) => void
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mainMarkerRef = useRef(null);      // 👈 marker arrastrable (único)
  const otherMarkersRef = useRef([]);      // markers “de catálogo”
  const circleSourceId = "radius-source";
  const circleLayerId = "radius-circle";
  const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${MAP_KEY}`;

  // 1) init map (solo una vez)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom,
      cooperativeGestures: true, // mejor interacción trackpad + scroll
    });

    // micro-ajustes de interacción para drag preciso
    map.dragPan.enable();
    map.touchZoomRotate.enable();

    mapRef.current = map;

    return () => {
      // liberar recursos
      otherMarkersRef.current.forEach((m) => m.remove());
      otherMarkersRef.current = [];
      mainMarkerRef.current?.remove();
      mainMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) preparar/actualizar el marker principal (arrastrable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCenter = isFiniteCoord(center?.lat) && isFiniteCoord(center?.lng);

    // Crea el marker principal una sola vez
    if (!mainMarkerRef.current && hasCenter) {
      // elemento visual — importante: permitir pointer-events
      const el = document.createElement("div");
      el.style.cssText = `
        width:18px;height:18px;border-radius:18px;
        background:#0ea5e9;border:2px solid #fff;
        box-shadow:0 0 0 2px rgba(0,0,0,.2);
        cursor:grab;
      `;

      const mk = new maplibregl.Marker({ element: el, draggable }); // 👈 draggable aquí
      mk.setLngLat([center.lng, center.lat]).addTo(map);
      mainMarkerRef.current = mk;

      // listeners robustos
      const emit = (fn) => {
        if (!fn) return;
        const { lng, lat } = mk.getLngLat();
        fn({ lat: Number(lat), lng: Number(lng) });
      };
      mk.on("dragstart", () => {
        el.style.cursor = "grabbing";
        emit(onDragStart);
      });
      mk.on("drag", () => emit(onDrag));
      mk.on("dragend", () => {
        el.style.cursor = "grab";
        emit(onDragEnd);
      });
    }

    // si ya existe, solo movelo cuando cambie center “externo”
    if (mainMarkerRef.current && hasCenter) {
      const { lng, lat } = mainMarkerRef.current.getLngLat();
      // evitar “pelea” con el drag: solo set si cambió mucho (> ~3m)
      const delta =
        Math.hypot((lat - center.lat) * 111000, (lng - center.lng) * 111000 * Math.cos((lat * Math.PI) / 180));
      if (delta > 3) {
        mainMarkerRef.current.setLngLat([center.lng, center.lat]);
      }
    }

    // no recentres el mapa si el usuario está arrastrando
    if (hasCenter && !map.isMoving() && !map.isZooming() && !map.isRotating()) {
      map.setCenter([center.lng, center.lat]);
      if (zoom) map.setZoom(zoom);
    }
  }, [center?.lat, center?.lng, zoom, draggable, onDragStart, onDrag, onDragEnd]);

  // 3) pintar/actualizar círculo de radio sin tocar el marker principal
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCenter = isFiniteCoord(center?.lat) && isFiniteCoord(center?.lng);

    const apply = () => {
      // limpiar anteriores
      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
      if (map.getSource(circleSourceId)) map.removeSource(circleSourceId);

      if (!(hasCenter && radiusKm && radiusKm > 0)) return;

      map.addSource(circleSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [center.lng, center.lat] },
            },
          ],
        },
      });

      map.addLayer({
        id: circleLayerId,
        type: "circle",
        source: circleSourceId,
        paint: {
          "circle-radius": {
            // aproximación: escala la cantidad de metros con el zoom
            stops: [
              [0, 0],
              [20, (radiusKm * 1000) / 0.075],
            ],
            base: 2,
          },
          "circle-color": "#0ea5e9",
          "circle-opacity": 0.12,
          "circle-stroke-color": "#0ea5e9",
          "circle-stroke-opacity": 0.28,
          "circle-stroke-width": 1,
        },
      });
    };

    if (map.style && map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [center?.lat, center?.lng, radiusKm]);

  // 4) markers secundarios (profesionales)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // borrar anteriores
    otherMarkersRef.current.forEach((m) => m.remove());
    otherMarkersRef.current = [];

    (markers || [])
      .filter((m) => isFiniteCoord(m?.lat) && isFiniteCoord(m?.lng))
      .forEach((m) => {
        const d = document.createElement("div");
        d.style.cssText = `
          width:14px;height:14px;border-radius:14px;
          background:${m.color || "#10b981"};
          border:2px solid #fff;
          box-shadow:0 0 0 2px rgba(0,0,0,.15);
          cursor:pointer;
        `;
        const mk = new maplibregl.Marker({ element: d, draggable: false })
          .setLngLat([m.lng, m.lat])
          .setPopup(m.title ? new maplibregl.Popup().setText(m.title) : undefined)
          .addTo(map);
        otherMarkersRef.current.push(mk);
      });
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border"
      style={{ height: 420, overflow: "hidden" }}
    />
  );
}