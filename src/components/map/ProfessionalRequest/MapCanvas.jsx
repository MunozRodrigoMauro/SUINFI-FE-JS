// src/components/map/ProfessionalRequest/MapCanvas.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;
const isFiniteCoord = (n) => Number.isFinite(n);

export default function MapCanvas({
  center = { lat: -34.6037, lng: -58.3816 },
  zoom = 12,
  markers = [],
  radiusKm = null,
  draggableOrigin = false,
  onOriginDrag,
  onOriginDragEnd,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const otherMarkersRef = useRef([]);
  const circleSourceId = "radius-source";
  const circleLayerId = "radius-circle";
  const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${MAP_KEY}`;

  // ⬇️ Config mínima para auto-pan al borde
  const EDGE = 64;          // píxeles desde cada borde
  const STEP = 18;          // desplazamiento por tick
  const rafId = useRef(0);  // rAF para throttling

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom,
      cooperativeGestures: true,
      // 👉 dejamos la atribución siempre compacta (solo “i”)
      attributionControl: false,
    });

    // barra compacta con “i”
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.dragPan.enable();
    map.touchZoomRotate.enable();

    mapRef.current = map;

    return () => {
      cancelAnimationFrame(rafId.current);
      otherMarkersRef.current.forEach((m) => m.remove());
      otherMarkersRef.current = [];
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // origin marker (MISMO flujo, solo cambio el ícono y agrego auto-pan)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCenter = isFiniteCoord(center?.lat) && isFiniteCoord(center?.lng);

    if (!originMarkerRef.current && hasCenter) {
      // 👇 Ícono de ubicación con borde blanco (stroke)
      const el = document.createElement("div");
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path
            d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 10
               a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
            fill="#ef4444"            /* cuerpo rojo */
            stroke="#ffffff"          /* borde blanco pedido */
            stroke-width="1"
          />
        </svg>
      `;
      el.style.cursor = draggableOrigin ? "grab" : "default";

      const mk = new maplibregl.Marker({ element: el, draggable: !!draggableOrigin })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      // helpers de evento
      const emit = (fn) => {
        if (!fn) return;
        const { lng, lat } = mk.getLngLat();
        fn({ lat: +lat, lng: +lng });
      };

      // ⬇️ Auto-pan solo durante drag y solo si toca el borde
      const autoPanTick = () => {
        const { lng, lat } = mk.getLngLat();
        const p = map.project([lng, lat]);
        const w = map.getContainer().clientWidth;
        const h = map.getContainer().clientHeight;

        let dx = 0, dy = 0;
        if (p.x < EDGE) dx = -STEP;
        else if (p.x > w - EDGE) dx = STEP;
        if (p.y < EDGE) dy = -STEP;
        else if (p.y > h - EDGE) dy = STEP;

        if (dx || dy) {
          map.panBy([dx, dy], { animate: false }); // pan suave, sin saltos
          rafId.current = requestAnimationFrame(autoPanTick);
        } else {
          rafId.current = 0;
        }
      };

      if (draggableOrigin) {
        mk.on("dragstart", () => {
          el.style.cursor = "grabbing";
          emit(onOriginDrag);
        });
        mk.on("drag", () => {
          emit(onOriginDrag);
          if (!rafId.current) {
            rafId.current = requestAnimationFrame(autoPanTick);
          }
        });
        mk.on("dragend", () => {
          el.style.cursor = "grab";
          if (rafId.current) cancelAnimationFrame(rafId.current);
          rafId.current = 0;
          emit(onOriginDragEnd);
        });
      }

      originMarkerRef.current = mk;
    }

    // mantener el comportamiento original de sincronía:
    if (originMarkerRef.current && hasCenter) {
      originMarkerRef.current.setLngLat([center.lng, center.lat]);
    }

    if (hasCenter && !map.isMoving() && !map.isZooming() && !map.isRotating()) {
      map.setCenter([center.lng, center.lat]);
      if (zoom) map.setZoom(zoom);
    }
  }, [center?.lat, center?.lng, zoom, draggableOrigin, onOriginDrag, onOriginDragEnd]);

  // círculo (igual que estaba)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCenter = isFiniteCoord(center?.lat) && isFiniteCoord(center?.lng);

    const apply = () => {
      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
      if (map.getSource(circleSourceId)) map.removeSource(circleSourceId);

      if (!(hasCenter && radiusKm && radiusKm > 0)) return;

      map.addSource(circleSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: [center.lng, center.lat] } }],
        },
      });

      map.addLayer({
        id: circleLayerId,
        type: "circle",
        source: circleSourceId,
        paint: {
          "circle-radius": { stops: [[0, 0], [20, (radiusKm * 1000) / 0.075]], base: 2 },
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

  // markers secundarios (igual que estaba)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    otherMarkersRef.current.forEach((m) => m.remove());
    otherMarkersRef.current = [];

    (markers || [])
      .filter((m) => isFiniteCoord(m?.lat) && isFiniteCoord(m?.lng))
      .forEach((m) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width:14px;height:14px;border-radius:14px;
          background:${m.color || "#10b981"};
          border:2px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.15);
          cursor:pointer;
        `;
        const mk = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(m.title ? new maplibregl.Popup().setText(m.title) : undefined)
          .addTo(map);
        otherMarkersRef.current.push(mk);
      });
  }, [markers]);

  // zoom handlers
  const zoomIn = () => mapRef.current && mapRef.current.zoomIn();
  const zoomOut = () => mapRef.current && mapRef.current.zoomOut();

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-xl border"
        style={{ height: 420, overflow: "hidden" }}
      />

      {/* Controles + y − pequeños y estéticos */}
      <div className="pointer-events-none absolute top-2 right-2 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Acercar"
          onClick={zoomIn}
          className="pointer-events-auto w-9 h-9 md:w-8 md:h-8 rounded-lg bg-white/95 backdrop-blur border shadow hover:bg-white active:scale-95 text-base font-semibold"
          title="Acercar"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Alejar"
          onClick={zoomOut}
          className="pointer-events-auto w-9 h-9 md:w-8 md:h-8 rounded-lg bg-white/95 backdrop-blur border shadow hover:bg-white active:scale-95 text-base font-semibold"
          title="Alejar"
        >
          −
        </button>
      </div>
    </div>
  );
}
