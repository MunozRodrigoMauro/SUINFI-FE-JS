// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatPreviewCard from "../components/chat/ChatPreviewCard";
import { getProfessionals, getAvailableNowProfessionals } from "../api/professionalService";
import { getMyBookings } from "../api/bookingService";
import BookingStatusBadge from "../components/booking/BookingStatusBadge";
import BookingActions from "../components/booking/BookingActions";
import { formatDateTime } from "../utils/datetime";
import axiosUser from "../api/axiosUser";
import { socket } from "../lib/socket";
import { fetchMyChats } from "../api/chatService";
import { haversineKm, fmtKm } from "../utils/geo";
import MapCanvas from "../components/map/ProfessionalRequest/MapCanvas";
import { getMyProfile } from "../api/userService";
import ChatDock from "../components/chat/ChatDock";
import useLiveProLocations from "../hooks/useLiveProLocations";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

// Absolutizar assets para avatares
const ASSET_BASE = API.replace(/\/api\/?$/, "");
const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`);

// Geocoder MapTiler
async function geocode(q) {
  if (!q?.trim()) return [];
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.features || []).map((f) => ({
    id: f.id,
    name: f.place_name || f.text,
    lat: f.center?.[1],
    lng: f.center?.[0],
  }));
}
async function reverseGeocode(lat, lng) {
  const url = `https://api/maptiler.com/geocoding/${lng},${lat}.json?key=${MAP_KEY}&language=es`.replace(
    "https://api/",
    "https://api."
  ); // small guard
  const res = await fetch(url);
  const data = await res.json();
  const f = (data?.features || [])[0];
  return f ? f.place_name || f.text : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

const LS_KEY = "suinfi:userdash:filters";
const RECENT_LIMIT = 2;
const PAGE_SIZE = 3;

function normalizeProLoc(p) {
  const g = p?.location?.coordinates;
  if (Array.isArray(g) && g.length === 2 && Number.isFinite(g[0]) && Number.isFinite(g[1])) {
    return { lat: g[1], lng: g[0] };
  }
  const a = p?.address?.location;
  if (a && Number.isFinite(a.lat) && Number.isFinite(a.lng)) return a;
  return null;
}

function UserDashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [query, setQuery] = useState("");
  const [suggests, setSuggests] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [allowSuggests, setAllowSuggests] = useState(false);
  const geoTimer = useRef(0);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // posiciones live
  const livePositions = useLiveProLocations({ ttlMs: 120000 });

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentChats, setRecentChats] = useState([]);

  // Disponibles ahora (paginado de a 3)
  const [onlinePros, setOnlinePros] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [onlinePage, setOnlinePage] = useState(1);
  const ONLINE_PER_PAGE = 3;
  const onlinePages = Math.max(1, Math.ceil((onlinePros?.length || 0) / ONLINE_PER_PAGE));
  const onlineSlice = useMemo(() => {
    const start = (onlinePage - 1) * ONLINE_PER_PAGE;
    return onlinePros.slice(start, start + ONLINE_PER_PAGE);
  }, [onlinePros, onlinePage]);

  // Persistencia filtros
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (saved && typeof saved === "object") {
        if (saved.categoryId) setCategoryId(saved.categoryId);
        if (saved.serviceId) setServiceId(saved.serviceId);
        if (typeof saved.availableNow === "boolean") setAvailableNow(saved.availableNow);
        if (typeof saved.radiusKm === "number") setRadiusKm(saved.radiusKm);
      }
    } catch {}
  }, []);
  useEffect(() => {
    const payload = { categoryId, serviceId, availableNow, radiusKm };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }, [categoryId, serviceId, availableNow, radiusKm]);

  // Combos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cats, servs] = await Promise.all([axiosUser.get(`${API}/categories`), axiosUser.get(`${API}/services`)]);
        if (!mounted) return;
        setCategories(cats.data || []);
        setServices(servs.data || []);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (!categoryId) return services;
    return (services || []).filter((s) => s?.category?._id === categoryId || s?.category === categoryId);
  }, [services, categoryId]);

  // Perfil + origen
  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        setUser((prev) => ({ ...prev, ...me }));
        const loc = me?.address?.location;
        if (loc?.lat != null && loc?.lng != null) {
          const c = { lat: loc.lat, lng: loc.lng };
          setOrigin(c);
          setQuery(me?.address?.label || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
          setAllowSuggests(false);
          setSuggests([]);
        }
      } catch {}
    })();
  }, [setUser]);

  useEffect(() => {
    const loc = user?.address?.location;
    if (loc?.lat != null && loc?.lng != null) {
      const c = { lat: loc.lat, lng: loc.lng };
      setOrigin(c);
      setQuery(user?.address?.label || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
      setAllowSuggests(false);
      setSuggests([]);
    }
  }, [user?.address?.location?.lat, user?.address?.location?.lng]);

  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const me = await getMyProfile();
        setUser((prev) => ({ ...prev, ...me }));
        const hasCoords = me?.address?.location?.lat != null && me?.address?.location?.lng != null;
        if (hasCoords) {
          const c = { lat: me.address.location.lat, lng: me.address.location.lng };
          setOrigin(c);
          setQuery(me?.address?.label || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
          setAllowSuggests(false);
          setSuggests([]);
          return;
        }
        const a = me?.address || {};
        const line = [a.street && `${a.street} ${a.number || ""}`, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ");
        if (line) {
          const [hit] = await geocode(line);
          if (hit?.lat != null && hit?.lng != null) {
            setOrigin({ lat: hit.lat, lng: hit.lng });
            setQuery(hit.name || line);
            setAllowSuggests(false);
            setSuggests([]);
          }
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [setUser]);

  // Autocomplete
  useEffect(() => {
    window.clearTimeout(geoTimer.current);
    if (!isFocused || !allowSuggests || !query) {
      setSuggests([]);
      return;
    }
    geoTimer.current = window.setTimeout(async () => {
      try {
        const s = await geocode(query);
        setSuggests(s.slice(0, 6));
      } catch {
        setSuggests([]);
      }
    }, 300);
  }, [query, isFocused, allowSuggests]);

  const useProfileAddress = async () => {
    let u = user;
    if (!u?.address) {
      try {
        const me = await getMyProfile();
        setUser((prev) => ({ ...prev, ...me }));
        u = me;
      } catch {}
    }
    const loc = u?.address?.location;
    if (loc?.lat != null && loc?.lng != null) {
      setOrigin({ lat: loc.lat, lng: loc.lng });
      setQuery(u?.address?.label || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
      setAllowSuggests(false);
      setSuggests([]);
      return;
    }
    const a = u?.address || {};
    const line = [a.street && `${a.street} ${a.number || ""}`, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ");
    if (!line) return alert("Tu perfil no tiene dirección suficiente. Completala en Mi Perfil o usá GPS.");
    try {
      const [hit] = await geocode(line);
      if (hit?.lat != null && hit?.lng != null) {
        setOrigin({ lat: hit.lat, lng: hit.lng });
        setQuery(hit.name || line);
        setAllowSuggests(false);
        setSuggests([]);
      } else {
        alert("No pudimos ubicar tu dirección. Revisá los datos o usá GPS.");
      }
    } catch {
      alert("No pudimos ubicar tu dirección. Probá nuevamente o usá GPS.");
    }
  };

  const useGPS = () => {
    if (!navigator.geolocation) return alert("GPS no disponible en este navegador.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(c);
        setQuery(`${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
        setAllowSuggests(false);
        setSuggests([]);
      },
      () => alert("No pudimos obtener tu ubicación.")
    );
  };

  // Socket refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      refetchCatalog();
      refetchOnline();
    };
    socket.on("availability:update", refresh);
    socket.on("availability:changed", refresh);
    socket.on("presence:online", refresh);
    socket.on("presence:offline", refresh);
    socket.on("connect", refresh);
    return () => {
      socket.off("availability:update", refresh);
      socket.off("availability:changed", refresh);
      socket.off("presence:online", refresh);
      socket.off("presence:offline", refresh);
      socket.off("connect", refresh);
    };
  }, []);

  // === Catálogo
  const refetchCatalog = async () => {
    setLoading(true);
    try {
      let list = [];
      if (origin?.lat != null && origin?.lng != null) {
        const params = { lat: origin.lat, lng: origin.lng, maxDistance: radiusKm * 1000 };
        if (availableNow) params.availableNow = true;
        if (categoryId) params.categoryId = categoryId;
        if (serviceId) params.serviceId = serviceId;
        const { data } = await axiosUser.get(`${API}/professionals/nearby`, { params });
        list = Array.isArray(data) ? data : [];
      } else {
        const params = {};
        if (availableNow) params.availableNow = true;
        if (categoryId) params.categoryId = categoryId;
        if (serviceId) params.serviceId = serviceId;
        const data = await getProfessionals(params);
        list = Array.isArray(data) ? data : data.items || [];
      }

      // anotación live + distancia
      const annotated = (list || []).map((p) => {
        const fallback = normalizeProLoc(p);
        const userId = p?.user?._id;
        const live = userId ? livePositions.get(userId) : null;
        const loc = live ? { lat: live.lat, lng: live.lng } : fallback;
        const d =
          origin?.lat != null && loc?.lat != null
            ? haversineKm(origin, { lat: loc.lat, lng: loc.lng })
            : null;
        const isOn = typeof live?.isAvailableNow === "boolean" ? live.isAvailableNow : !!p.isAvailableNow;
        return { ...p, _distanceKm: d, _plotLoc: loc, _isOn: isOn };
      });

      setAllResults(annotated);
      setTotal(annotated.length);
      const pgs = Math.max(1, Math.ceil(annotated.length / PAGE_SIZE));
      setPages(pgs);
      setPage(1);
      setItems(annotated.slice(0, PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, radiusKm, availableNow, categoryId, serviceId]);

  // Reanotar con livePositions
  useEffect(() => {
    if (!allResults.length) return;
    const next = allResults.map((p) => {
      const fallback = normalizeProLoc(p);
      const userId = p?.user?._id;
      const live = userId ? livePositions.get(userId) : null;
      const loc = live ? { lat: live.lat, lng: live.lng } : fallback;
      const d =
        origin?.lat != null && loc?.lat != null
          ? haversineKm(origin, { lat: loc.lat, lng: loc.lng })
          : p._distanceKm ?? null;
      const isOn = typeof live?.isAvailableNow === "boolean" ? live.isAvailableNow : !!p.isAvailableNow;
      return { ...p, _plotLoc: loc, _distanceKm: d, _isOn: isOn };
    });
    setAllResults(next);
    const start = (page - 1) * PAGE_SIZE;
    setItems(next.slice(start, start + PAGE_SIZE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePositions, origin?.lat, origin?.lng]);

  const goToPage = (n) => {
    const p = Math.min(Math.max(1, n), pages);
    const start = (p - 1) * PAGE_SIZE;
    setPage(p);
    setItems(allResults.slice(start, start + PAGE_SIZE));
  };

  useEffect(() => {
    setServiceId("");
  }, [categoryId]);

  // Reservas recientes
  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const list = await getMyBookings();
      const safe = Array.isArray(list) ? list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
      setRecent(safe.slice(0, RECENT_LIMIT));
    } finally {
      setLoadingRecent(false);
    }
  };
  useEffect(() => {
    fetchRecent();
  }, []);
  useEffect(() => {
    if (!socket) return;
    const onCreated = () => fetchRecent();
    const onUpdated = () => fetchRecent();
    socket.on("booking:created", onCreated);
    socket.on("booking:updated", onUpdated);
    return () => {
      socket.off("booking:created", onCreated);
      socket.off("booking:updated", onUpdated);
    };
  }, []);

  // Chats recientes
  useEffect(() => {
    (async () => setRecentChats(await fetchMyChats()))();
  }, []);

  // Disponibles ahora
  const refetchOnline = async () => {
    setLoadingOnline(true);
    try {
      const list = await getAvailableNowProfessionals();
      setOnlinePros(Array.isArray(list) ? list : []);
      setOnlinePage(1);
    } finally {
      setLoadingOnline(false);
    }
  };
  useEffect(() => {
    refetchOnline();
  }, []);

  const displayName = (u) => u?.name || u?.email?.split("@")[0] || "Usuario";

  // Marcadores
  const mapMarkers = useMemo(() => {
    return (allResults || [])
      .map((p) => ({ loc: p?._plotLoc, name: p?.user?.name || "Profesional", isOn: !!p?._isOn }))
      .filter((x) => x.loc && Number.isFinite(x.loc.lat) && Number.isFinite(x.loc.lng))
      .map((x) => ({ lat: x.loc.lat, lng: x.loc.lng, color: x.isOn ? "#10b981" : "#94a3b8", title: x.name }));
  }, [allResults]);

  // Seguir ubicación del usuario
  const [liveOrigin, setLiveOrigin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("suinfi:liveOrigin") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem("suinfi:liveOrigin", JSON.stringify(liveOrigin));
  }, [liveOrigin]);
  useEffect(() => {
    if (!liveOrigin || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [liveOrigin]);

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Solicitar servicio + mapa */}
        <div className="grid lg:grid-cols-[420px_minmax(0,1fr)] gap-4 mb-8">
          <div className="bg-white border rounded-2xl shadow-sm p-4 h-fit">
            <h2 className="text-xl font-semibold mb-3">Solicitá un servicio</h2>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Ingresá una ubicación</label>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAllowSuggests(true);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  setTimeout(() => setSuggests([]), 120);
                }}
                placeholder="Calle, número, ciudad…"
                className="w-full border rounded-lg px-3 py-2"
              />
              {isFocused && allowSuggests && suggests.length > 0 && (
                <div className="mt-2 rounded-lg border bg-white shadow-sm overflow-hidden">
                  {suggests.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onMouseDown={() => {
                        setOrigin({ lat: s.lat, lng: s.lng });
                        setQuery(s.name);
                        setAllowSuggests(false);
                        setSuggests([]);
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <button onClick={useProfileAddress} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">
                  Usar mi perfil
                </button>
                <button onClick={useGPS} className="px-3 py-2 rounded bg-[#111827] text-white hover:bg-black">
                  Usar GPS
                </button>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={liveOrigin} onChange={(e) => setLiveOrigin(e.target.checked)} />
                <span className="text-sm">Seguir mi ubicación (en vivo)</span>
              </label>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-gray-600">Radio</span>
              <input
                type="range"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(+e.target.value)}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{radiusKm} km</span>
            </div>

            <label className="inline-flex items-center gap-2 mb-3">
              <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
              <span className="text-sm">Mostrar solo “Disponibles ahora”</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded border bg-white"
                >
                  <option value="">Todas</option>
                  {(categories || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Servicio</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded border bg-white"
                >
                  <option value="">Todos</option>
                  {(filteredServices || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {origin?.lat != null ? (
                <>
                  Origen: <b>{origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}</b>
                </>
              ) : (
                <>Elegí una ubicación para ver profesionales cercanos.</>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <MapCanvas
              center={origin || { lat: -34.6037, lng: -58.3816 }}
              markers={mapMarkers}
              radiusKm={origin ? radiusKm : null}
              draggableOrigin
              onOriginDrag={() => {}}
              onOriginDragEnd={async ({ lat, lng }) => {
                setOrigin({ lat, lng });
                try {
                  const nice = await reverseGeocode(lat, lng);
                  if (nice) {
                    setQuery(nice);
                    setAllowSuggests(false);
                    setSuggests([]);
                  }
                } catch {}
              }}
            />
          </div>
        </div>

        {/* Resultados (catálogo) */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Profesionales</h2>
          <span className="text-sm text-gray-600">{total} resultados</span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-28 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-20 bg-gray-2 00 rounded-full" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : allResults.length === 0 ? (
          <p className="text-gray-600">No se encontraron profesionales con esos filtros.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {items.map((p) => {
              const name = p?.user?.name || "Profesional";
              const email = p?.user?.email || "";
              const servicesNames = (p.services || []).map((s) => s?.name).filter(Boolean);
              const firstService = servicesNames[0] || "Servicio";
              const restCount = Math.max(0, servicesNames.length - 1);
              const avatar = p?.user?.avatarUrl ? absUrl(p.user.avatarUrl) : "";
              const initial = (name[0] || "P").toUpperCase();

              return (
                <div
                  key={p._id}
                  className="group bg-white text-black rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  <div className="relative h-28 bg-gradient-to-r from-slate-800 to-slate-700">
                    <span
                      className={`absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded-full border ${
                        p._isOn
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {p._isOn ? "Disponible ahora" : "Offline"}
                    </span>
                    <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-full ring-4 ring-white bg-white overflow-hidden grid place-items-center text-slate-800 font-bold">
                      {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : initial}
                    </div>
                  </div>

                  <div className="pt-8 px-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-5 line-clamp-1">{name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{email}</p>
                      </div>
                      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        ⭐ {(p?.averageRating || 0).toFixed(1)}{typeof p?.reviews === "number" ? ` (${p.reviews})` : ""}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {firstService}
                      </span>
                      {restCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                          +{restCount} más
                        </span>
                      )}
                    </div>

                    {/* Documentos */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(() => {
                        const d = p.documents || {};
                        const cr = d.criminalRecord;
                        const lic = d.license;
                        const crExpired = cr?.expiresAt ? new Date(cr.expiresAt).getTime() < Date.now() : false;
                        return (
                          <>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                cr?.url
                                  ? crExpired
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              Antecedentes: {cr?.url ? (crExpired ? "vencido" : "vigente") : "pendiente"}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                lic?.url ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              Matrícula: {lic?.url ? "cargada" : "pendiente"}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {origin?.lat != null && p?._distanceKm != null && (
                      <div className="mt-2 text-xs text-gray-600">A {fmtKm(p._distanceKm)} de tu ubicación</div>
                    )}

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/chats/${p?.user?._id}`)}
                        className="text-sm font-medium bg:white bg-white text-[#111827] border px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        Chatear
                      </button>
                      <button
                        onClick={() => navigate(`/professional/${p._id}?reserve=1`)}
                        className="text-sm font-medium text:white text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md shadow-sm cursor-pointer"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-16">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className={`px-3 py-1 rounded border cursor-pointer ${
                page <= 1 ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
              }`}
            >
              ←
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => goToPage(page + 1)}
              className={`px-3 py-1 rounded border cursor-pointer ${
                page >= pages ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
              }`}
            >
              →
            </button>
          </div>
        )}

        {/* Reservas recientes */}
        <div className="text-left mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📋 Reservas recientes</h2>
            <button
              onClick={() => navigate("/bookings")}
              className="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-black cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {loadingRecent ? (
            <p className="text-gray-600">Cargando…</p>
          ) : recent.length === 0 ? (
            <div className="border rounded-xl p-6 bg-white">
              <p className="text-gray-600 mb-3">Aún no tenés reservas.</p>
              <button
                onClick={() => navigate("/dashboard/user")}
                className="text-sm px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600"
              >
                Buscar profesionales
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {recent.map((b) => {
                const name = b?.professional?.user?.name || b?.professional?.user?.email || "Profesional";
                const photo = b?.professional?.user?.avatarUrl ? absUrl(b.professional.user.avatarUrl) : "";
                const initial = (name?.[0] || "P").toUpperCase();

                return (
                  <div
                    key={b._id}
                    className="border rounded-xl p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={() => {
                      const peerId = b?.professional?.user?._id;
                      if (peerId) navigate(`/chats/${peerId}`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        const peerId = b?.professional?.user?._id;
                        if (peerId) navigate(`/chats/${peerId}`);
                      }
                    }}
                    title="Abrir chat con el profesional"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 grid place-items-center font-semibold">
                          {photo ? <img src={photo} alt="avatar" className="h-full w-full object-cover" /> : initial}
                        </div>
                        <div>
                          <div className="font-semibold leading-5">{name}</div>
                          <div className="text-sm text-gray-700">{b?.service?.name || "Servicio"}</div>
                          <div className="text-sm text-gray-600">{formatDateTime(b?.scheduledAt)}</div>
                        </div>
                        </div>
                        <div     className="flex items-center gap-2"
                          onClick={(e) => {
                            // ⬅️ MUY IMPORTANTE: evita que abrir/cerrar modal dispare el onClick del card (chat)
                            e.stopPropagation();
                          }}
                        >
                          <BookingStatusBadge status={b?.status} />
                          {/* Acciones para el cliente: cancelar si aplica */}
                          <BookingActions booking={b} role="client" onChanged={fetchRecent} />
                        </div>
                      </div>  
                    {b?.note && (
                      <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2 mt-3">
                        {b.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🟢 Disponibles ahora */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">🟢 Disponibles ahora</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {onlinePros.length}
              </span>
            </div>
            {onlinePages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlinePage((p) => Math.max(1, p - 1))}
                  disabled={onlinePage <= 1}
                  className={`px-2 py-1 rounded border cursor-pointer ${
                    onlinePage <= 1 ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                  }`}
                  title="Anterior"
                >
                  ←
                </button>
                <span className="text-sm text-gray-700">
                  Página {onlinePage} de {onlinePages}
                </span>
                <button
                  onClick={() => setOnlinePage((p) => Math.min(onlinePages, p + 1))}
                  disabled={onlinePage >= onlinePages}
                  className={`px-2 py-1 rounded border cursor-pointer ${
                    onlinePage >= onlinePages ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                  }`}
                  title="Siguiente"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {loadingOnline ? (
            <p className="text-gray-600">Cargando…</p>
          ) : onlinePros.length === 0 ? (
            <p className="text-gray-600">No hay profesionales en línea ahora.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {onlineSlice.map((p) => {
                const name = p?.user?.name || "Profesional";
                const email = p?.user?.email || "";
                const servicesNames = (p.services || []).map((s) => s?.name).filter(Boolean);
                const firstService = servicesNames[0] || "Servicio";
                const restCount = Math.max(0, servicesNames.length - 1);
                const avatar = p?.user?.avatarUrl ? absUrl(p.user.avatarUrl) : "";
                const initial = (name[0] || "P").toUpperCase();

                return (
                  <div
                    key={p._id}
                    className="group bg-white text-black rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="relative h-24 bg-gradient-to-r from-emerald-700 to-emerald-600">
                      <span className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Disponible ahora
                      </span>
                      <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-full ring-4 ring-white bg-white overflow-hidden grid place-items-center text-emerald-700 font-bold">
                        {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : initial}
                      </div>
                    </div>
                    <div className="pt-8 px-4 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold leading-5 line-clamp-1">{name}</h3>
                          <p className="text-xs text-gray-600 line-clamp-1">{email}</p>
                        </div>
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          ⭐ {p?.averageRating || 4.8}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {firstService}
                        </span>
                        {restCount > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                            +{restCount} más
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/chats/${p?.user?._id}`)}
                          className="text-sm font-medium bg-white text-[#111827] border px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          Chatear
                        </button>
                        <button
                          onClick={() => navigate(`/professional/${p._id}?reserve=1`)}
                          className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md shadow-sm cursor-pointer"
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dock de chat */}
      <ChatDock
        chats={recentChats}
        onOpenChat={(peerId) => navigate(`/chats/${peerId}`)}
      />
    </section>
  );
}

export default UserDashboard;