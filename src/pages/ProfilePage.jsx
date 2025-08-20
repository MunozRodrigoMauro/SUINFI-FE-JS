// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import { updateAvailabilitySchedule, getProfessionals } from "../api/professionalService";
import { getMyProfile, updateMyProfile } from "../api/userService";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miércoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sábado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DayRow({ label, active, from, to, onToggle, onChangeFrom, onChangeTo }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-xl bg-white">
      <div className="flex items-center gap-3 min-w-[130px]">
        <input
          id={`chk-${label}`}
          type="checkbox"
          checked={active}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-5 w-5"
        />
        <label htmlFor={`chk-${label}`} className="font-medium">
          {label}
        </label>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">De</span>
          <input
            type="time"
            step="900"
            value={from}
            disabled={!active}
            onChange={(e) => onChangeFrom(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm ${
              active ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">a</span>
          <input
            type="time"
            step="900"
            value={to}
            disabled={!active}
            onChange={(e) => onChangeTo(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm ${
              active ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.role === "professional";

  // Cuenta
  const [form, setForm] = useState({ name: "", email: "", role: "", password: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [dirty, setDirty] = useState(false);

  // Ubicación
  const [addr, setAddr] = useState({
    country: "",
    state: "",
    city: "",
    street: "",
    number: "",
    unit: "",
    postalCode: "",
  });

  // Disponibilidad
  const [rows, setRows] = useState(() =>
    DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" }))
  );
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [agendaMsg, setAgendaMsg] = useState("");

  // UI: secciones
  const [openAccount, setOpenAccount] = useState(false);
  const [openSecurity] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);

  // Cargar perfil
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (!mounted) return;
        setForm({
          name: me.name || "",
          email: me.email || "",
          role: me.role || "",
          password: "",
        });

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
      } catch {
        setMsgType("error");
        setMsg("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Prefill agenda desde profesionales
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await getProfessionals();
        const arr = Array.isArray(raw) ? raw : raw?.items || [];
        if (!mounted) return;

        const myId = user?.id || user?._id;
        const mine = arr.find((p) => p?.user?._id === myId) || null;

        if (mine?.availabilitySchedule && typeof mine.availabilitySchedule === "object") {
          const map = mine.availabilitySchedule;
          setRows((prev) =>
            prev.map((r) => {
              const val = map[r.key];
              if (!val) return { ...r, active: false };
              const from = typeof val.from === "string" ? val.from : "09:00";
              const to = typeof val.to === "string" ? val.to : "18:00";
              return { ...r, active: true, from, to };
            })
          );
        }

        if (mine?.address && typeof mine.address === "object") {
          setAddr((prev) => ({
            ...prev,
            country: mine.address.country || prev.country,
            state: mine.address.state || prev.state,
            city: mine.address.city || prev.city,
            street: mine.address.street || prev.street,
            number: mine.address.number || prev.number,
            unit: mine.address.unit || prev.unit,
            postalCode: mine.address.postalCode || prev.postalCode,
          }));
        }
      } catch {
        /* noop */
      } finally {
        setLoadingAgenda(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?._id]);

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

  const onChange = (e) => {
    setDirty(true);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const onChangeAddr = (e) => {
    const { name, value } = e.target;
    setAddr((a) => ({ ...a, [name]: value }));
  };

  const saveCommon = async () => {
    const payload = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.password.trim()) payload.password = form.password.trim();

    payload.address = {
      country: addr.country.trim(),
      state: addr.state.trim(),
      city: addr.city.trim(),
      street: addr.street.trim(),
      number: addr.number.trim(),
      unit: addr.unit.trim(),
      postalCode: addr.postalCode.trim(),
    };

    const res = await updateMyProfile(payload);
    setUser((prev) => ({ ...prev, ...res.user }));
    setForm((f) => ({ ...f, password: "" }));
    setDirty(false);
  };

  const onSubmitAccount = async (e) => {
    e.preventDefault();
    setMsg("");
    setSavingProfile(true);
    try {
      await saveCommon();
      setMsgType("success");
      setMsg("✅ Cambios guardados");
    } catch (e) {
      const apiMsg = e?.response?.data?.message;
      setMsgType("error");
      setMsg(apiMsg || "No se pudo guardar. Revisá los datos.");
    } finally {
      setSavingProfile(false);
    }
  };

  // agenda
  const onToggle = (idx, val) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, active: val } : r)));
  const onChangeFrom = (idx, value) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, from: value } : r)));
  const onChangeTo = (idx, value) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, to: value } : r)));

  const invalids = useMemo(() => {
    const bad = [];
    rows.forEach((r) => {
      if (!r.active) return;
      if (!r.from || !r.to) bad.push(r.key);
      else if (r.from >= r.to) bad.push(r.key);
    });
    return bad;
  }, [rows]);

  const onSaveAgenda = async () => {
    setAgendaMsg("");
    if (invalids.length > 0) {
      setAgendaMsg("Revisá los horarios: la hora de inicio debe ser menor que la de fin.");
      return;
    }
    const schedule = rows.reduce((acc, r) => {
      if (r.active) acc[r.key] = { from: r.from, to: r.to };
      return acc;
    }, {});
    try {
      setSavingAgenda(true);
      const res = await updateAvailabilitySchedule(schedule);
      if (res?.availabilitySchedule && typeof res.availabilitySchedule === "object") {
        const map = res.availabilitySchedule;
        setRows((prev) =>
          prev.map((r) => {
            const val = map[r.key];
            if (!val) return { ...r, active: false };
            const from = typeof val.from === "string" ? val.from : "09:00";
            const to = typeof val.to === "string" ? val.to : "18:00";
            return { ...r, active: true, from, to };
          })
        );
      }
      setAgendaMsg("✅ Agenda guardada correctamente.");
    } catch {
      setAgendaMsg("No se pudo guardar la agenda. Intentá nuevamente.");
    } finally {
      setSavingAgenda(false);
    }
  };

  const essentialsOk = useMemo(() => {
    const nameOk = form.name.trim().length >= 2;
    const addrOk =
      addr.country.trim() &&
      addr.state.trim() &&
      addr.city.trim() &&
      addr.street.trim() &&
      addr.number.trim() &&
      addr.postalCode.trim();
    return Boolean(nameOk && addrOk);
  }, [form.name, addr]);

  if (loadingProfile) return <p className="text-center mt-28">Cargando tu perfil...</p>;

  return (
    <>
      <Navbar />
      <BackBar
        title="Mi perfil"
        subtitle={isPro ? "Editá tu cuenta, ubicación y disponibilidad" : "Editá tu cuenta y ubicación"}
      />
      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">👤 Mi perfil</h1>
          <p className="text-gray-600 mb-6">Completá tus datos esenciales para poder usar la app.</p>

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

          {/* Cuenta */}
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenAccount((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold">Cuenta</h2>
                <p className="text-sm text-gray-500">Nombre, email y rol</p>
              </div>
              <Chevron open={openAccount} />
            </button>

            {openAccount && (
              <div className="px-5 pb-5">
                <form onSubmit={onSubmitAccount} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        value={form.email}
                        disabled
                        className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Rol</label>
                      <input
                        value={form.role}
                        disabled
                        className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-600 capitalize"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Mínimo 6 caracteres (opcional)"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 transition disabled:opacity-60"
                    >
                      {savingProfile ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="bg-white border rounded-2xl shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => setOpenLocation((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold">Ubicación</h2>
                <p className="text-sm text-gray-500">País, provincia/estado, ciudad, calle, número, CP.</p>
              </div>
              <Chevron open={openLocation} />
            </button>

            {openLocation && (
              <div className="px-5 pb-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">País *</label>
                    <input name="country" value={addr.country} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provincia / Estado *</label>
                    <input name="state" value={addr.state} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ciudad *</label>
                    <input name="city" value={addr.city} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Código Postal *</label>
                    <input name="postalCode" value={addr.postalCode} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Calle *</label>
                      <input name="street" value={addr.street} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Número *</label>
                      <input name="number" value={addr.number} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Depto / Piso / Unidad (opcional)</label>
                    <input name="unit" value={addr.unit} onChange={onChangeAddr} className="w-full border rounded-lg px-4 py-2" placeholder="Ej: Piso 3, Depto B" />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={onSubmitAccount}
                    disabled={savingProfile}
                    className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 transition disabled:opacity-60"
                  >
                    {savingProfile ? "Guardando..." : "Guardar ubicación"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Disponibilidad — SOLO profesionales */}
          {isPro && (
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenAvailability((o) => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="text-left">
                  <h2 className="text-lg font-semibold">Disponibilidad</h2>
                  <p className="text-sm text-gray-500">Configurá tus horarios (opcional)</p>
                </div>
                <Chevron open={openAvailability} />
              </button>

              {openAvailability && (
                <div className="px-5 pb-5">
                  {invalids.length > 0 && (
                    <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg">
                      Hay días con horario inválido (inicio debe ser menor que fin).
                    </div>
                  )}
                  {agendaMsg && (
                    <div
                      className={`mb-4 text-sm px-3 py-2 rounded-lg ${
                        agendaMsg.startsWith("✅")
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          : "bg-rose-50 border border-rose-200 text-rose-700"
                      }`}
                    >
                      {agendaMsg}
                    </div>
                  )}

                  {loadingAgenda ? (
                    <p className="text-gray-600">Cargando tu agenda…</p>
                  ) : (
                    <div className="space-y-3">
                      {DAYS.map((d, idx) => (
                        <DayRow
                          key={d.key}
                          label={d.label}
                          active={rows[idx].active}
                          from={rows[idx].from}
                          to={rows[idx].to}
                          onToggle={(val) => onToggle(idx, val)}
                          onChangeFrom={(val) => onChangeFrom(idx, val)}
                          onChangeTo={(val) => onChangeTo(idx, val)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setRows(DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" })))
                      }
                      className="text-sm bg-white border px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Restablecer
                    </button>
                    <button
                      type="button"
                      onClick={onSaveAgenda}
                      disabled={savingAgenda}
                      className="text-sm bg-[#0a0e17] text-white px-5 py-2 rounded-lg hover:bg-black/80 disabled:opacity-60"
                    >
                      {savingAgenda ? "Guardando…" : "Guardar agenda"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate("/dashboard/professional")}
              disabled={!essentialsOk}
              className={`px-5 py-2 rounded-lg ${
                essentialsOk
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              title={
                essentialsOk
                  ? "Ir al panel"
                  : "Completá nombre y ubicación (campos marcados con *)"
              }
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      </section>
    </>
  );
}