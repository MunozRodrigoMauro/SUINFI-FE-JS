import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProfessionalById } from "../api/professionalService";
import { createBooking } from "../api/bookingService";
import axiosUser from "../api/axiosUser";

// ✅ NUEVO: imports visuales (no tocan la lógica)
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const fetchAllServices = async () => {
  const { data } = await axiosUser.get(`${API}/services`);
  return Array.isArray(data) ? data : [];
};

function ReserveModal({ open, onClose, professional, onCreated, services = [] }) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    const first = services?.[0]?._id || "";
    setServiceId(first);
    setDate("");
    setTime("");
    setNote("");
    setMsg("");
  }, [open, services]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!serviceId || !date || !time) {
      setMsg("Completá servicio, fecha y hora.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        professionalId: professional._id,
        serviceId,
        date,
        time,
        note: note?.trim() || "",
      };
      const res = await createBooking(payload);
      onCreated?.(res?.booking);
      onClose();
    } catch (err) {
      setMsg("No se pudo crear la reserva. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reservar</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {msg && (
            <div className="text-sm bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg">
              {msg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Servicio</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {(services || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nota (opcional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              placeholder="Contanos brevemente qué necesitás…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60"
            >
              {saving ? "Creando…" : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfessionalDetailPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [servicesResolved, setServicesResolved] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getProfessionalById(id);
        if (!mounted) return;
        setPro(data);

        const raw = data?.services || [];
        const isPopulated = raw.some((s) => s && typeof s === "object" && s.name);

        if (isPopulated) {
          setServicesResolved(raw);
        } else if (raw.length) {
          const catalog = await fetchAllServices();
          const idSet = new Set(raw.map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean));
          setServicesResolved((catalog || []).filter((svc) => idSet.has(svc._id)));
        } else {
          setServicesResolved([]);
        }
        setLoadingServices(false);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (search.get("reserve") === "1") setOpenModal(true);
  }, [search]);

  const servicesNames = useMemo(
    () => (servicesResolved || []).map((s) => s?.name).filter(Boolean),
    [servicesResolved]
  );

  if (loading) return <div className="pt-28 text-center">Cargando…</div>;
  if (!pro) return <div className="pt-28 text-center text-gray-600">Profesional no encontrado.</div>;

  const name = pro?.user?.name || "Profesional";
  const email = pro?.user?.email || "";

  return (
    <>
      {/* ✅ Navbar + BackBar iguales al resto, sin tocar lógica */}
      <Navbar />
      <BackBar title={name} subtitle={email} />

      {/* Quitamos el pt-24 para evitar el hueco; dejamos el ancho controlado adentro */}
      <section className="min-h-screen bg-white text-[#0a0e17] pb-16 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="relative h-40 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 mt-6">
            <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-full ring-4 ring-white bg-white grid place-items-center text-slate-800 font-bold">
              {(name[0] || "P").toUpperCase()}
            </div>
          </div>

          <div className="pt-10 px-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{name}</h1>
                <p className="text-sm text-gray-600">{email}</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {loadingServices && (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      Cargando servicios…
                    </span>
                  )}
                  {!loadingServices &&
                    servicesNames.slice(0, 5).map((n, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {n}
                      </span>
                    ))}
                  {!loadingServices && servicesNames.length > 5 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                      +{servicesNames.length - 5} más
                    </span>
                  )}
                  {!loadingServices && servicesNames.length === 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                      Sin servicios cargados
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pro.isAvailableNow ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Disponible ahora
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                    Offline
                  </span>
                )}
                <button
                  onClick={() => setOpenModal(true)}
                  className="ml-2 px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black"
                >
                  Reservar
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold mb-1">Descripción</h2>
              <p className="text-gray-700 text-sm">{pro?.bio || "Sin descripción"}</p>
            </div>
          </div>
        </div>

        {/* Modal */}
        <ReserveModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          professional={pro}
          services={servicesResolved}
          onCreated={() => navigate("/bookings")}
        />
      </section>
    </>
  );
}