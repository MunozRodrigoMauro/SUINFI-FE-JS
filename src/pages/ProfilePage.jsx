// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import { getMyProfile, updateMyProfile } from "../api/userService";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import MapCanvas from "../components/map/ProfessionalRequest/MapCanvas";
import {
  updateAvailabilitySchedule,
  setAvailabilityMode,
  updateMyProfessional,
  updateMyLocation,
  getMyProfessional,
} from "../api/professionalService";

const MAP_KEY = import.meta.env.VITE_MAP_API_KEY;

const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miércoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sábado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const buildAddressLabel = (a) =>
  [a.street && `${a.street} ${a.number}`, a.city, a.state, a.postalCode, a.country]
    .filter(Boolean)
    .join(", ");

function Chevron({ open }) {
  return (
    <svg className={`h-5 w-5 transition-transform ${open ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

async function geocode(q) {
  if (!q?.trim()) return [];
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.features || []).map((f) => ({
    id: f.id,
    label: f.place_name || f.text,
    lat: f.center?.[1],
    lng: f.center?.[0],
  }));
}

async function reverseGeocode(lat, lng) {
  const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAP_KEY}&language=es`;
  const res = await fetch(url);
  const data = await res.json();
  const f = (data?.features || [])[0];
  return f ? f.place_name || f.text : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // si existe Professional para este user
  const [hasProfessional, setHasProfessional] = useState(false);

  // cuenta
  const [form, setForm] = useState({ name: "", email: "", role: "", password: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  // dropdowns
  const [openAccount, setOpenAccount] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);

  // address “humano”
  const [addr, setAddr] = useState({
    country: "",
    state: "",
    city: "",
    street: "",
    number: "",
    unit: "",
    postalCode: "",
  });

  // buscador
  const [query, setQuery] = useState("");
  const [suggests, setSuggests] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [allowSuggests, setAllowSuggests] = useState(false);
  const debounceId = useRef(0);

  // coords + etiqueta
  const [coords, setCoords] = useState(null);
  const [label, setLabel] = useState("");

  // agenda
  const [rows, setRows] = useState(() =>
    DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" }))
  );
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaMsg, setAgendaMsg] = useState("");

  // cargar perfil + professional
  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        setForm({ name: me.name || "", email: me.email || "", role: me.role || "", password: "" });
        setAddr((prev) => ({
          ...prev,
          country: me?.address?.country || "",
          state: me?.address?.state || "",
          city: me?.address?.city || "",
          street: me?.address?.street || "",
          number: me?.address?.number || "",
          unit: me?.address?.unit || "",
          postalCode: me?.address?.postalCode || "",
        }));
        const loc = me?.address?.location;
        if (loc?.lat != null && loc?.lng != null) {
          setCoords({ lat: loc.lat, lng: loc.lng });
          const lbl = me?.address?.label || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
          setLabel(lbl);
          setQuery(lbl);
        } else {
          const line = buildAddressLabel(me?.address || {});
          if (line) setQuery(line);
        }
      } catch {
        setMsgType("error");
        setMsg("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    })();

    (async () => {
      try {
        const mine = await getMyProfessional();
        const exists = !!mine?._id;
        setHasProfessional(exists);

        // Prefill agenda si existe
        if (mine?.availabilitySchedule) {
          const map = mine.availabilitySchedule;
          setRows((prev) =>
            prev.map((r) => {
              const v = map[r.key];
              if (!v) return { ...r, active: false };
              return { ...r, active: true, from: v.from || "09:00", to: v.to || "18:00" };
            })
          );
        }
      } catch {
        setHasProfessional(false);
      } finally {
        setLoadingAgenda(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    if (!agendaMsg) return;
    const t = setTimeout(() => setAgendaMsg(""), 2500);
    return () => clearTimeout(t);
  }, [agendaMsg]);

  const onChangeQuery = (e) => {
    setAllowSuggests(true);
    setQuery(e.target.value);
  };

  // autocomplete
  useEffect(() => {
    window.clearTimeout(debounceId.current);
    if (!isFocused || !allowSuggests || !query?.trim()) {
      setSuggests([]);
      return;
    }
    debounceId.current = window.setTimeout(async () => {
      try {
        const list = await geocode(query);
        setSuggests(list.slice(0, 8));
      } catch {
        setSuggests([]);
      }
    }, 300);
  }, [query, isFocused, allowSuggests]);

  const pickSuggestion = (s) => {
    setQuery(s.label);
    setLabel(s.label);
    setCoords({ lat: s.lat, lng: s.lng });
    setSuggests([]);
    setAllowSuggests(false);
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onChangeAddr = (e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }));

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const q = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
        setQuery(q);
        setLabel(q);
        setSuggests([]);
        setAllowSuggests(false);
      },
      () => {}
    );
  };

  // Guardado + sync User + (si existe) Professional (address + GeoJSON)
  const saveCommon = async () => {
    const clean = {
      country: addr.country.trim(),
      state: addr.state.trim(),
      city: addr.city.trim(),
      street: addr.street.trim(),
      number: addr.number.trim(),
      unit: addr.unit.trim(),
      postalCode: addr.postalCode.trim(),
    };
    const payload = {
      name: form.name.trim() || undefined,
      password: form.password.trim() || undefined,
      address: {
        ...clean,
        ...(coords
          ? { label: label || buildAddressLabel(clean), location: { lat: coords.lat, lng: coords.lng } }
          : {}),
      },
    };

    // 1) User
    const res = await updateMyProfile(payload);
    const updated = res?.user || res; // soporta ambas formas de respuesta
    setUser((p) => ({ ...p, ...updated }));

    // 2) Professional (si existe)
    if (hasProfessional) {
      try {
        await updateMyProfessional({
          address: {
            ...clean,
            label: label || buildAddressLabel(clean),
            ...(coords ? { location: { lat: coords.lat, lng: coords.lng } } : {}),
          },
        });
        if (coords) {
          // clave para /nearby (GeoJSON Point [lng, lat])
          await updateMyLocation(coords.lat, coords.lng);
        }
      } catch (e) {
        console.error("sync Professional addr/loc error", e);
      }
    }

    setMsgType("success");
    setMsg("✅ Cambios guardados");
  };

  // agenda helpers
  const onToggle = (i, v) => setRows((a) => a.map((r, idx) => (idx === i ? { ...r, active: v } : r)));
  const onChangeFrom = (i, v) => setRows((a) => a.map((r, idx) => (idx === i ? { ...r, from: v } : r)));
  const onChangeTo = (i, v) => setRows((a) => a.map((r, idx) => (idx === i ? { ...r, to: v } : r)));

  const invalids = useMemo(() => {
    const bad = [];
    rows.forEach((r) => {
      if (!r.active) return;
      if (!r.from || !r.to || r.from >= r.to) bad.push(r.key);
    });
    return bad;
  }, [rows]);

  const onSaveAgenda = async () => {
    if (invalids.length) {
      setAgendaMsg("Revisá los horarios: inicio < fin.");
      return;
    }
    setSavingAgenda(true);
    try {
      await updateAvailabilitySchedule(
        rows.reduce((acc, r) => {
          if (r.active) acc[r.key] = { from: r.from, to: r.to };
          return acc;
        }, {})
      );
      await setAvailabilityMode("schedule");
      setAgendaMsg("✅ Agenda guardada y modo horario activo.");
    } catch {
      setAgendaMsg("No se pudo guardar la agenda.");
    } finally {
      setSavingAgenda(false);
    }
  };

  const essentialsOk = useMemo(() => {
    const nameOk = form.name.trim().length >= 2;
    const addrOk = addr.country && addr.state && addr.city && addr.street && addr.number && addr.postalCode;
    return Boolean(nameOk && addrOk);
  }, [form.name, addr]);

  if (loadingProfile) return <p className="text-center mt-28">Cargando tu perfil...</p>;

  return (
    <>
      <Navbar />
      <BackBar
        title="Mi perfil"
        subtitle={hasProfessional ? "Editá tu cuenta, ubicación y disponibilidad" : "Editá tu cuenta y ubicación"}
      />
      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">👤 Mi perfil</h1>

          {msg && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                msgType === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {msg}
            </div>
          )}

          {/* CUENTA */}
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button onClick={() => setOpenAccount((o) => !o)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold">Cuenta</h2>
                <p className="text-sm text-gray-500">Nombre, email, rol</p>
              </div>
              <Chevron open={openAccount} />
            </button>
            {openAccount && (
              <div className="px-5 pb-5">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input value={form.email} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Rol</label>
                      <input value={form.role} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 capitalize" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        setSavingProfile(true);
                        try {
                          await saveCommon();
                        } finally {
                          setSavingProfile(false);
                        }
                      }}
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60"
                    >
                      {savingProfile ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* UBICACIÓN */}
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button onClick={() => setOpenAddress((o) => !o)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold pr-40">Buscar dirección</h2>
                <p className="text-sm text-gray-500">Ingresá una dirección, usá GPS o mové el punto en mapa</p>
              </div>
              <Chevron open={openAddress} />
            </button>

            {openAddress && (
              <div className="px-5 pb-5">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Buscar dirección</label>
                  <input
                    value={query}
                    onChange={onChangeQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      setTimeout(() => setSuggests([]), 100);
                    }}
                    placeholder="Ej.: Av. Siempre Viva 742, Springfield"
                    className="w-full border rounded-lg px-4 py-2"
                  />
                  {isFocused && allowSuggests && suggests.length > 0 && (
                    <div className="mt-2 rounded-lg border bg-white shadow-sm overflow-hidden max-h-64 overflow-y-auto">
                      {suggests.map((s) => (
                        <button key={s.id} type="button" onMouseDown={() => pickSuggestion(s)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={useGPS} className="px-3 py-2 rounded bg-[#111827] text-white hover:bg-black">
                    Usar GPS
                  </button>
                  <button
                    onClick={() => {
                      const line = buildAddressLabel(addr);
                      if (!line) return;
                      setAllowSuggests(true);
                      setQuery(line);
                    }}
                    className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                  >
                    Geocodificar campos
                  </button>
                </div>

                {/* Campos humanos */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">País *</label>
                    <input name="country" value={addr.country} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Provincia / Estado *</label>
                    <input name="state" value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text sm mb-1">Ciudad *</label>
                    <input name="city" value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text sm mb-1">Código Postal *</label>
                    <input name="postalCode" value={addr.postalCode} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">Calle *</label>
                      <input name="street" value={addr.street} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Número *</label>
                      <input name="number" value={addr.number} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Depto / Piso / Unidad</label>
                    <input name="unit" value={addr.unit} onChange={(e) => setAddr((a) => ({ ...a, [e.target.name]: e.target.value }))} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                </div>

                {/* Mapa con arrastre */}
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {coords ? (
                      <>
                        Coordenadas: <b>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</b>
                        {label ? <> · {label}</> : null}
                      </>
                    ) : (
                      <>Elegí una sugerencia, usá GPS o arrastrá el punto.</>
                    )}
                  </div>
                  <div className="rounded-xl overflow-hidden border">
                    <MapCanvas
                      center={coords || { lat: -34.6037, lng: -58.3816 }}
                      markers={[]}
                      radiusKm={null}
                      zoom={coords ? 15 : 12}
                      draggableOrigin
                      onOriginDragEnd={async ({ lat, lng }) => {
                        setCoords({ lat, lng });
                        const nice = await reverseGeocode(lat, lng);
                        setLabel(nice);
                        setQuery(nice);
                        setAllowSuggests(false);
                        setSuggests([]);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={async () => {
                      setSavingProfile(true);
                      try {
                        await saveCommon();
                      } finally {
                        setSavingProfile(false);
                      }
                    }}
                    disabled={savingProfile}
                    className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white"
                  >
                    {savingProfile ? "Guardando..." : "Guardar ubicación"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DISPONIBILIDAD (solo si existe Professional) */}
          {hasProfessional && (
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setOpenAvailability((o) => !o)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h2 className="text-lg font-semibold">Disponibilidad</h2>
                  <p className="text-sm text-gray-500">Agenda semanal y horarios</p>
                </div>
                <Chevron open={openAvailability} />
              </button>

              {openAvailability && (
                <div className="px-5 pb-5">
                  <h2 className="sr-only">Disponibilidad</h2>
                  {loadingAgenda ? (
                    <p className="text-gray-600 mt-2">Cargando…</p>
                  ) : (
                    <>
                      {agendaMsg && <div className="mt-2 text-sm">{agendaMsg}</div>}
                      <div className="mt-3 space-y-3">
                        {DAYS.map((d, idx) => (
                          <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-xl bg-white">
                            <div className="flex items-center gap-3 min-w-[130px]">
                              <input
                                type="checkbox"
                                checked={rows[idx].active}
                                onChange={(e) =>
                                  setRows((a) => a.map((r, i) => (i === idx ? { ...r, active: e.target.checked } : r)))
                                }
                              />
                              <span>{d.label}</span>
                            </div>
                            <div className="flex items-center gap-3 sm:ml-auto">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">De</span>
                                <input
                                  type="time"
                                  step="900"
                                  value={rows[idx].from}
                                  disabled={!rows[idx].active}
                                  onChange={(e) => setRows((a) => a.map((r, i) => (i === idx ? { ...r, from: e.target.value } : r)))}
                                  className="border rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">a</span>
                                <input
                                  type="time"
                                  step="900"
                                  value={rows[idx].to}
                                  disabled={!rows[idx].active}
                                  onChange={(e) => setRows((a) => a.map((r, i) => (i === idx ? { ...r, to: e.target.value } : r)))}
                                  className="border rounded-lg px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          onClick={() => setRows(DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" })))}
                          className="px-4 py-2 rounded border"
                        >
                          Restablecer
                        </button>
                        <button onClick={onSaveAgenda} disabled={savingAgenda} className="px-4 py-2 rounded bg-[#0a0e17] text-white">
                          {savingAgenda ? "Guardando…" : "Guardar agenda"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate("/dashboard/professional")}
              disabled={!essentialsOk}
              className={`px-5 py-2 rounded-lg ${essentialsOk ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      </section>
    </>
  );
}