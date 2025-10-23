// src/components/Shared/LocationStep.jsx
// CHANGES: usar un ref hacia MapCanvas y llamar ref.current.flyTo(...) en los dos botones
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import MapCanvas from "../map/ProfessionalRequest/MapCanvas";

const fmt = (n) => Number(n).toFixed(5);
const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

// CHANGES: util distancia y umbral “lejos”
const FAR_KM = 10; // consideramos “lejano” si supera este valor (km)
const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

export default function LocationStep({ value, onChange, onConfirm }) {
  const { user } = useAuth();
  const [query, setQuery] = useState(value?.label || "");
  const [suggests, setSuggests] = useState([]);
  const [loading, setLoading] = useState(false);
  const geoTimer = useRef(0);

  const [center, setCenter] = useState(() => ({
    lat: value?.lat ?? -31.5375,
    lng: value?.lng ?? -68.5257,
  }));
  const [radiusKm, setRadiusKm] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [hideGpsWarn, setHideGpsWarn] = useState(false);
  const [originSource, setOriginSource] = useState(null);
  const [zoom, setZoom] = useState(13);

  const mapIsMovingRef = useRef(false);
  const ignoreNextSync = useRef(false);
  const reverseControllerRef = useRef(null);
  const [isReversing, setIsReversing] = useState(false);

  // CHANGES: ref al MapCanvas para poder llamar flyTo animado
  const mapRef = useRef(null);

  // CHANGES: recordamos último GPS y bandera por “lejanía”
  const lastGpsRef = useRef(null);
  const [farWarn, setFarWarn] = useState(false);
  const [farDistKm, setFarDistKm] = useState(null);

  // CHANGES [WARN-STICKY 1/3]: control explícito de visibilidad y dismiss manual
  const [warnDismissed, setWarnDismissed] = useState(false);
  const reviveWarn = () => setWarnDismissed(false); // para “revivir” si vuelve a aplicar la lógica

  // CHANGES [ANTI-DRAG-FLYTO]: bandera para ignorar drag mientras dura flyTo
  const suppressDragRef = useRef(false);
  const FLY_MS = 1200; // duración estimada de la animación del flyTo

  // CHANGES: helper para asegurar baseline de GPS 1 sola vez si hace falta
  const ensureLastGpsThen = (nextCoords /* {lat,lng} */, afterEnsure /* fn */) => {
    if (lastGpsRef.current) {
      const d = haversineKm(lastGpsRef.current, nextCoords);
      setFarWarn(Number.isFinite(d) && d > FAR_KM);
      setFarDistKm(Number.isFinite(d) ? d : null);
      // CHANGES [WARN-STICKY 2/3]: si se activa condición otra vez, des-dismisseamos
      if (Number.isFinite(d) && d > FAR_KM) reviveWarn();
      afterEnsure?.();
      return;
    }
    if (!navigator.geolocation) {
      setFarWarn(false);
      setFarDistKm(null);
      afterEnsure?.();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        lastGpsRef.current = g;
        const d = haversineKm(g, nextCoords);
        const isFar = Number.isFinite(d) && d > FAR_KM;
        setFarWarn(isFar);
        setFarDistKm(Number.isFinite(d) ? d : null);
        if (isFar) reviveWarn(); // CHANGES [WARN-STICKY 2/3]
        afterEnsure?.();
      },
      () => {
        setFarWarn(false);
        setFarDistKm(null);
        afterEnsure?.();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  async function geocode(q) {
    if (!MAP_KEY || !q?.trim()) return [];
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
      q
    )}.json?key=${MAP_KEY}&language=es`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const feats = data?.features || [];
    return feats.map((f) => ({
      id: f.id,
      name: f.place_name || f.text,
      lat: f.center?.[1],
      lng: f.center?.[0],
    }));
  }

  async function reverseGeocode(lat, lng) {
    try {
      if (reverseControllerRef.current) reverseControllerRef.current.abort();
      const controller = new AbortController();
      reverseControllerRef.current = controller;

      setIsReversing(true);

      const res = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAP_KEY}&language=es`,
        { signal: controller.signal }
      );
      const data = await res.json();
      const feat = data?.features?.[0];
      return feat?.place_name || `${fmt(lat)}, ${fmt(lng)}`;
    } catch (err) {
      if (err.name === "AbortError") return null;
      return `${fmt(lat)}, ${fmt(lng)}`;
    } finally {
      setIsReversing(false);
    }
  }

  useEffect(() => {
    clearTimeout(geoTimer.current);
    if (!query || query.length < 2) {
      setSuggests([]);
      return;
    }
    geoTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const s = await geocode(query);
        setSuggests(s.slice(0, 6));
      } catch {
        setSuggests([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleUseProfile = () => {
    const loc = user?.address?.location;
    if (loc?.lat && loc?.lng) {
      const label =
        user?.address?.label ||
        [
          user?.address?.street &&
            `${user.address.street} ${user?.address?.number || ""}`,
          user?.address?.city,
          user?.address?.state,
          user?.address?.country,
        ]
          .filter(Boolean)
          .join(", ") ||
        `${fmt(loc.lat)}, ${fmt(loc.lng)}`;

      ignoreNextSync.current = true;
      onChange?.({ lat: loc.lat, lng: loc.lng, label });
      setQuery(label);
      setCenter({ lat: loc.lat, lng: loc.lng });
      setZoom(15);
      setHideGpsWarn(false);
      setGpsAccuracy(null);
      setOriginSource("profile");

      // CHANGES: evaluar distancia vs GPS (si no hay baseline, lo obtenemos al toque)
      ensureLastGpsThen({ lat: loc.lat, lng: loc.lng }, () => {
        // CHANGES [ANTI-DRAG-FLYTO]: bloquear drag handlers durante flyTo
        suppressDragRef.current = true;
        mapRef.current?.flyTo({ lat: loc.lat, lng: loc.lng, zoom: 15 });
        setTimeout(() => (suppressDragRef.current = false), FLY_MS);
      });
    } else {
      alert("No encontramos una dirección guardada en tu perfil.");
    }
  };

  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      alert("GPS no disponible en este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const label = await reverseGeocode(c.lat, c.lng);
        ignoreNextSync.current = true;
        onChange?.({ lat: c.lat, lng: c.lng, label });
        setCenter(c);
        setQuery(label);
        setZoom(15);
        setHideGpsWarn(false);
        setGpsAccuracy(
          Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null
        );
        setOriginSource("gps");

        // CHANGES: guardar último GPS y apagar advertencia de distancia
        lastGpsRef.current = c;
        setFarWarn(false);
        setFarDistKm(null);
        reviveWarn(); // CHANGES [WARN-STICKY 2/3]: mostramos si corresponde

        // CHANGES [ANTI-DRAG-FLYTO]: bloquear drag handlers durante flyTo
        suppressDragRef.current = true;
        mapRef.current?.flyTo({ lat: c.lat, lng: c.lng, zoom: 15 });
        setTimeout(() => (suppressDragRef.current = false), FLY_MS);
      },
      () => alert("No pudimos obtener tu ubicación.")
    );
  };

useEffect(() => {
  if (!value?.lat || !value?.lng) return;
  if (mapIsMovingRef.current || originSource === "map-drag") return;
  if (ignoreNextSync.current) {
    ignoreNextSync.current = false;
    return;
  }
  setCenter({ lat: value.lat, lng: value.lng });
}, [value?.lat, value?.lng, originSource]);


  const canConfirm = !!value?.lat && !!value?.lng;

  // CHANGES: mostrar bandera si GPS impreciso (tengamos o no originSource="gps") O si está “lejos”
  // - Caso 1 (impreciso): si tenemos una lectura de gpsAccuracy mala y NO se ocultó manualmente.
  // - Caso 2 (lejano): farWarn activado por comparación con último GPS.
  const hasBadGps =
    !hideGpsWarn &&
    Number.isFinite(gpsAccuracy) &&
    gpsAccuracy > 150;

  // base lógico original
  const baseWarning =
    hasBadGps ||
    (originSource === "gps" &&
      !hideGpsWarn &&
      (!Number.isFinite(gpsAccuracy) || gpsAccuracy > 150)) ||
    farWarn;

  // CHANGES [WARN-STICKY 3/3]: persistencia sin auto-timeout; solo se oculta si NO aplica la lógica o si el usuario lo cierra
  const showGpsWarning = baseWarning && !warnDismissed;

  return (
    <div className="w-full">
      <div className="bg-white/95 text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-xl relative">
        <h2 className="text-xl font-semibold mb-3">
          ¿Dónde necesitás el servicio?
        </h2>

        <input
          type="text"
          value={isReversing ? "Obteniendo dirección…" : query}
          readOnly={isReversing}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Calle y número, barrio o ciudad"
          className={`w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 ${
            isReversing
              ? "bg-slate-50 text-slate-400 italic"
              : "focus:ring-emerald-500 bg-white text-slate-900"
          }`}
        />

        <div className="mt-2 mb-4">
          {Boolean(suggests.length) && (
            <div
              className="w-full max-h-48 overflow-y-scroll rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
              }}
            >
              {suggests.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    ignoreNextSync.current = true;
                    onChange?.({ lat: s.lat, lng: s.lng, label: s.name });
                    setQuery(s.name);
                    setCenter({ lat: s.lat, lng: s.lng });
                    setZoom(15);
                    setSuggests([]);
                    setOriginSource("search");

                    // CHANGES: evaluar distancia vs GPS (si no hay baseline, lo obtenemos al toque)
                    ensureLastGpsThen({ lat: s.lat, lng: s.lng }, () => {
                      // CHANGES [ANTI-DRAG-FLYTO]: bloquear drag handlers durante flyTo
                      suppressDragRef.current = true;
                      mapRef.current?.flyTo({ lat: s.lat, lng: s.lng, zoom: 15 });
                      setTimeout(() => (suppressDragRef.current = false), FLY_MS);
                    });
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 cursor-pointer"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          {loading && !suggests.length && (
            <div className="text-sm text-slate-500 bg-white/90 px-3 py-1 rounded-lg shadow-sm inline-block mt-1">
              Buscando ubicaciones…
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="min-w-0 w-full overflow-hidden rounded-xl border border-slate-300 mb-6 relative">
          <MapCanvas
            ref={mapRef}           // CHANGES: pasamos el ref para poder llamar flyTo
            center={center}
            zoom={zoom}
            markers={[]}
            radiusKm={radiusKm}
            draggableOrigin
            onOriginDrag={() => {
              // CHANGES [ANTI-DRAG-FLYTO]: ignorar eventos si provienen de flyTo
              if (suppressDragRef.current) return;
              mapIsMovingRef.current = true;
              setOriginSource("map-drag");
              if (reverseControllerRef.current)
                reverseControllerRef.current.abort();
            }}
            onOriginDragEnd={async ({ lat, lng }) => {
              // CHANGES [ANTI-DRAG-FLYTO]: ignorar eventos si provienen de flyTo
              if (suppressDragRef.current) return;
              mapIsMovingRef.current = true;
              const nice = await reverseGeocode(lat, lng);
              if (!nice) return;
              setQuery(nice);
              onChange?.({ lat, lng, label: nice });
              setOriginSource("map-drag");
              setHideGpsWarn(false);
              setGpsAccuracy(null);

              // CHANGES: si el usuario ajusta manualmente, ocultamos advertencia de lejanía
              setFarWarn(false);
              setFarDistKm(null);
              reviveWarn(); // por si vuelve a aplicar en otro momento
            }}
          />

          {isReversing && (
            <div className="absolute inset-x-0 bottom-0 bg-white/80 backdrop-blur-sm text-slate-600 text-sm text-center py-2 animate-pulse">
              Obteniendo dirección…
            </div>
          )}
        </div>

        {showGpsWarning && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 relative">
            {/* CHANGES: botón de cierre para mantener control manual */}
            <button
              onClick={() => {
                setWarnDismissed(true);
                // si el motivo era precisión de GPS, respetamos la bandera existente
                setHideGpsWarn(true);
              }}
              title="Ocultar aviso"
              className="absolute right-2 top-2 px-2 py-1 text-amber-900/70 hover:text-amber-900"
            >
              ×
            </button>

            <p className="text-sm mb-2 pr-6">
              {/* CHANGES: mensaje según motivo */}
              {farWarn ? (
                <>
                  La ubicación elegida está
                  {Number.isFinite(farDistKm) ? ` a ~${Math.round(farDistKm)} km ` : " lejos "}
                  de tu posición actual. Confirmá que sea correcto o{" "}
                  <b>arrastrá el pin</b> para ajustar.
                </>
              ) : (
                <>
                  El GPS del navegador puede ser impreciso
                  {Number.isFinite(gpsAccuracy)
                    ? ` (±${Math.round(gpsAccuracy)} m)`
                    : ""}.
                  <b> Arrastrá el pin</b> o <b>usá tu dirección de perfil</b>.
                </>
              )}
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleUseProfile}
                className="px-3 py-1.5 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer mx-auto"
              >
                Usar dirección configurada de mi perfil
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleUseProfile}
            className="flex-1 px-4 py-2 rounded-xl border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
          >
            Usar mi ubicación (perfil)
          </button>
          <button
            onClick={handleUseCurrent}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            Usar mi ubicación actual
          </button>
        </div>

        <button
          onClick={() => canConfirm && onConfirm?.()}
          disabled={!canConfirm}
          className={`mt-5 w-full rounded-xl py-3 cursor-pointer ${
            canConfirm
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-emerald-200 text-white cursor-not-allowed"
          }`}
        >
          Confirmar ubicación
        </button>
      </div>
    </div>
  );
}
