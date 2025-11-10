// src/components/map/ProfessionalRequest/MapCanvas.jsx
// CHANGES: agrego useImperativeHandle y forwardRef para exponer flyTo sin tocar el resto
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;
const isFiniteCoord = (n) => Number.isFinite(n);

/*
  [CHANGES – NOTA DE MANTENIMIENTO]
  1) Anti-flicker/“parpadeo”:
     - No recentrar si el delta es mínimo (ε=~1m). Se compara contra el último centro aplicado.
     - Se evita recrear la capa/ fuente del círculo en cada cambio; ahora se actualiza in-place.
  2) Marcadores (pros) SIN borrar/crear todos cada vez:
     - Diff incremental con un mapa de marcadores: agrega/actualiza/borra sólo lo necesario.
     - Se actualiza posición y color si cambian, sin reconstruir el mapa.
  3) Eventos de movimiento:
     - Mantuvimos el pin centrado y el “drag the map to move the pin”.
     - Se actualiza el centro del círculo mientras se mueve el mapa.
  4) Robustez de carga de estilo:
     - Todas las operaciones que requieren el estilo esperan a `map.isStyleLoaded()` y usan `map.once("load", ...)` de ser necesario.
*/

// CHANGES: envuelvo el componente con forwardRef (solo firma/export; el resto igual)
const MapCanvas = forwardRef(function MapCanvas({
  center = { lat: -34.6037, lng: -58.3816 },
  zoom = 12,
  markers = [],
  radiusKm = null,
  draggableOrigin = false,
  onOriginDrag,
  onOriginDragEnd,
  onReady,  
}, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // [CHANGE] Registro incremental de marcadores para evitar parpadeos
  const markerMapRef = useRef(new Map()); // key -> { marker, color, lat, lng, title }
  const markersRafRef = useRef(0);

  const movingByUserRef = useRef(false); // evita rebotes centro/zoom
  const lastCenterRef = useRef({ lat: null, lng: null }); // [CHANGE] anti-flicker
  const circleSourceId = "radius-source";
  const circleLayerId = "radius-circle";
  const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${MAP_KEY}`;

  // ====== INIT MAP ======
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const lngNum = Number(center?.lng);
    const latNum = Number(center?.lat);
    const centerInit =
      Number.isFinite(lngNum) && Number.isFinite(latNum)
        ? [lngNum, latNum]
        : [-58.3816, -34.6037];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: centerInit,
      zoom,
      attributionControl: false,
      cooperativeGestures: false,
    });


    map.dragPan.enable();
    map.scrollZoom.enable({ around: "center" });
    map.touchZoomRotate.enable({ around: "center" });
    map.keyboard.enable();
    map.boxZoom.enable();

     // 👇 2) silenciamos ese error molesto
    map.on("error", (e) => {
      const msg = e?.error?.message || "";
      if (msg.includes("signal is aborted")) return;
      console.error("map error:", e.error);
    });

    mapRef.current = map;
    lastCenterRef.current = { lat: centerInit[1], lng: centerInit[0] };

    // 👇 3) avisamos al padre que el mapa ya está listo
    if (map.isStyleLoaded()) {
      onReady?.();
    } else {
      map.once("load", () => {
        onReady?.();
      });
    }

    // Pin HTML fijo centrado
    const pin = document.createElement("div");
    pin.setAttribute("aria-hidden", "true");
    pin.style.position = "absolute";
    pin.style.left = "50%";
    pin.style.top = "50%";
    pin.style.transform = "translate(-50%, -100%)";
    pin.style.zIndex = "2";
    pin.style.pointerEvents = "none";

    const head = document.createElement("div");
    head.style.width = "18px";
    head.style.height = "18px";
    head.style.borderRadius = "18px";
    head.style.background = "#0a0a0a";
    head.style.boxShadow = "0 2px 4px rgba(0,0,0,.25)";
    head.style.position = "relative";
    head.style.margin = "0 auto";

    const dot = document.createElement("div");
    dot.style.width = "6px";
    dot.style.height = "6px";
    dot.style.borderRadius = "6px";
    dot.style.background = "#ffffff";
    dot.style.position = "absolute";
    dot.style.left = "50%";
    dot.style.top = "50%";
    dot.style.transform = "translate(-50%, -50%)";
    head.appendChild(dot);

    const stem = document.createElement("div");
    stem.style.width = "3px";
    stem.style.height = "16px";
    stem.style.background = "#0a0a0a";
    stem.style.margin = "0 auto";
    stem.style.borderRadius = "2px";
    stem.style.transform = "translateY(-2px)";
    pin.appendChild(head);
    pin.appendChild(stem);

    containerRef.current.appendChild(pin);

    const ensureCircle = () => {
      if (!(radiusKm && radiusKm > 0)) return;

      if (!map.getSource(circleSourceId)) {
        map.addSource(circleSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: map.getCenter().toArray() },
              },
            ],
          },
        });
      }
      if (!map.getLayer(circleLayerId)) {
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
      }
    };

    if (map.isStyleLoaded()) ensureCircle();
    else map.once("load", ensureCircle);

    // Eventos de movimiento
    const onMoveStart = () => {
      movingByUserRef.current = true;
      if (draggableOrigin && typeof onOriginDrag === "function") {
        const c = map.getCenter();
        onOriginDrag({ lat: +c.lat, lng: +c.lng });
      }
    };

    const onMove = () => {
      if (!draggableOrigin) return;
      if (typeof onOriginDrag === "function") {
        const c = map.getCenter();
        onOriginDrag({ lat: +c.lat, lng: +c.lng });
      }
      const src = map.getSource(circleSourceId);
      if (src && typeof src.setData === "function") {
        const c = map.getCenter();
        src.setData({
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] } }],
        });
      }
    };

    const onMoveEnd = () => {
      const c = map.getCenter();
      if (draggableOrigin && typeof onOriginDragEnd === "function") {
        onOriginDragEnd({ lat: +c.lat, lng: +c.lng });
      }
      // sincronizar lastCenter con lo que quedó en mapa para que el siguiente prop-update no recientre
      lastCenterRef.current = { lat: +c.lat, lng: +c.lng };
      setTimeout(() => (movingByUserRef.current = false), 120);
    };

    map.on("movestart", onMoveStart);
    map.on("move", onMove);
    map.on("moveend", onMoveEnd);

    return () => {
      map.off("movestart", onMoveStart);
      map.off("move", onMove);
      map.off("moveend", onMoveEnd);

      // limpiar marcadores incrementales
      markerMapRef.current.forEach((entry) => entry.marker.remove());
      markerMapRef.current.clear();

      if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
      if (map.getSource(circleSourceId)) map.removeSource(circleSourceId);

      pin.remove();

      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init

  // ===== Sincronía de center/zoom desde props (anti-flicker) =====
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (movingByUserRef.current) return;

    const hasCenter = isFiniteCoord(center?.lat) && isFiniteCoord(center?.lng);
    if (hasCenter) {
      const prev = lastCenterRef.current || { lat: null, lng: null };
      // [CHANGE] ε ~ 1 metro: si no cambió “realmente” el centro, no recientres (evita parpadeo)
      const dLat = Math.abs((center.lat ?? 0) - (prev.lat ?? 0));
      const dLng = Math.abs((center.lng ?? 0) - (prev.lng ?? 0));
      const epsilon = 1e-5; // ~1.1m en lat, similar en lng cerca del ecuador

      if (dLat > epsilon || dLng > epsilon) {
        map.setCenter([center.lng, center.lat]);
        lastCenterRef.current = { lat: center.lat, lng: center.lng };
        // Si existe el círculo, sincronizá su centro
        const src = map.getSource(circleSourceId);
        if (src && typeof src.setData === "function") {
          src.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: [center.lng, center.lat] } }],
          });
        }
      }
    }

    // Si quisieras permitir actualizar zoom externo de forma segura:
    // if (zoom != null && Number.isFinite(zoom)) map.zoomTo(zoom, { duration: 0 });

  }, [center?.lat, center?.lng, zoom]);

  // ===== Radio: crear/actualizar/eliminar al cambiar radiusKm =====
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyOrUpdate = () => {
      if (!(radiusKm && radiusKm > 0)) {
        if (map.getLayer(circleLayerId)) map.removeLayer(circleLayerId);
        if (map.getSource(circleSourceId)) map.removeSource(circleSourceId);
        return;
      }

      if (!map.getSource(circleSourceId)) {
        map.addSource(circleSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: map.getCenter().toArray() },
              },
            ],
          },
        });
      }
      if (!map.getLayer(circleLayerId)) {
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
      } else {
        map.setPaintProperty(circleLayerId, "circle-radius", {
          stops: [[0, 0], [20, (radiusKm * 1000) / 0.075]],
          base: 2,
        });
        // center ya se mantiene en el effect de center, pero si cambiara el zoom manualmente,
        // volvemos a setear el data al centro actual del mapa:
        const c = map.getCenter();
        const src = map.getSource(circleSourceId);
        if (src && typeof src.setData === "function") {
          src.setData({
            type: "FeatureCollection",
            features: [{ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] } }],
          });
        }
      }
    };

    if (map.isStyleLoaded()) applyOrUpdate();
    else map.once("load", applyOrUpdate);
  }, [radiusKm]);

  // ===== Markers secundarios (profes) — diff incremental (anti-flicker) =====
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cancelar un frame pendiente (si lo hubiera) y encolar uno nuevo
    if (markersRafRef.current) cancelAnimationFrame(markersRafRef.current);
    markersRafRef.current = requestAnimationFrame(() => {
      const next = Array.isArray(markers) ? markers : [];
      const nextKeys = new Set();

      // Construcción de claves estables (lat/lng redondeadas + título). Incluye color para forzar updates si cambia.
      const keyOf = (m) =>
        `${(m.lat ?? 0).toFixed(6)},${(m.lng ?? 0).toFixed(6)}|${m.title || ""}`;

      // 1) Agregar/actualizar
      next
        .filter((m) => isFiniteCoord(m?.lat) && isFiniteCoord(m?.lng))
        .forEach((m) => {
          const key = keyOf(m);
          nextKeys.add(key);

          const existing = markerMapRef.current.get(key);

          // Si no existe -> crear
          if (!existing) {
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

            markerMapRef.current.set(key, { marker: mk, color: m.color || "#10b981", lat: m.lat, lng: m.lng, title: m.title || "" });
          } else {
            // Existe: verificar cambios de posición o color (o popup title)
            const { marker } = existing;

            // Posición
            const prevLat = existing.lat;
            const prevLng = existing.lng;
            if (Math.abs(prevLat - m.lat) > 1e-6 || Math.abs(prevLng - m.lng) > 1e-6) {
              marker.setLngLat([m.lng, m.lat]);
              existing.lat = m.lat;
              existing.lng = m.lng;
            }

            // Color
            const newColor = m.color || "#10b981";
            if (existing.color !== newColor) {
              const el = marker.getElement();
              el.style.background = newColor;
              existing.color = newColor;
            }

            // Título / popup
            const newTitle = m.title || "";
            if (existing.title !== newTitle) {
              if (newTitle) {
                marker.setPopup(new maplibregl.Popup().setText(newTitle));
              } else {
                // remover popup
                marker.setPopup(undefined);
              }
              existing.title = newTitle;
            }
          }
        });

      // 2) Remover los que ya no están
      markerMapRef.current.forEach((entry, key) => {
        if (!nextKeys.has(key)) {
          entry.marker.remove();
          markerMapRef.current.delete(key);
        }
      });
    });

    return () => {
      if (markersRafRef.current) cancelAnimationFrame(markersRafRef.current);
    };
  }, [markers]);

  // ===== Controles de zoom (+/-) =====
  const zoomIn = () => {
    const map = mapRef.current;
    if (map) map.zoomTo(map.getZoom() + 1, { duration: 200 });
  };
  const zoomOut = () => {
    const map = mapRef.current;
    if (map) map.zoomTo(map.getZoom() - 1, { duration: 200 });
  };

  // Centrar en mi ubicación
  const centerOnMe = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      alert("GPS no disponible en este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15) });
      },
      () => alert("No pudimos obtener tu ubicación.")
    );
  };

  // CHANGES: expongo un método imperativo para que el padre pueda animar igual que el botón del mapa
  useImperativeHandle(ref, () => ({
    flyTo: ({ lat, lng, zoom: z = 15, pitch = 0, bearing = 0, speed = 1.2, curve = 1.6 }) => {
      const map = mapRef.current;
      if (!map || !isFiniteCoord(lat) || !isFiniteCoord(lng)) return;
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), z),
        pitch,
        bearing,
        speed,
        curve,
      });
    },
    centerOnMe, // por si lo quieres usar desde afuera
  }));

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-xl border"
        style={{
          height: 420,
          overflow: "hidden",
          position: "relative",
          overscrollBehavior: "contain",
          touchAction: "manipulation",
        }}
      />

      {/* Controles + / − y centrar */}
      <div
        className="
          pointer-events-none absolute right-2 bottom-2
          sm:top-2 sm:bottom-auto
          flex flex-col gap-2 z-[1]
        "
      >
        <button
          type="button"
          aria-label="Centrar en mi ubicación"
          onClick={centerOnMe}
          title="Centrar en mi ubicación"
          className="
            pointer-events-auto
            w-14 h-14 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur border border-slate-300
            shadow-md hover:bg-white active:scale-95
            flex items-center justify-center
            touch-manipulation
          "
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v2m0 14v2M3 12h2m14 0h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Acercar"
          onClick={zoomIn}
          title="Acercar"
          className="
            pointer-events-auto
            w-14 h-14 sm:w-12 sm:h-12
            rounded-2xl bg-white/95 backdrop-blur border border-slate-300
            shadow-md hover:bg-white active:scale-95
            text-[28px] leading-none font-semibold
            flex items-center justify-center
            touch-manipulation
          "
        >
          +
        </button>
        <button
          type="button"
          aria-label="Alejar"
          onClick={zoomOut}
          title="Alejar"
          className="
            pointer-events-auto
            w-14 h-14 sm:w-12 sm:h-12
            rounded-2xl bg-white/95 backdrop-blur border border-slate-300
            shadow-md hover:bg-white active:scale-95
            text-[28px] leading-none font-semibold
            flex items-center justify-center
            touch-manipulation
          "
        >
          −
        </button>
      </div>
    </div>
  );
});

// CHANGES: export default del componente envuelto
export default MapCanvas;
