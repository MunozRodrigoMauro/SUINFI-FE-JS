// src/pages/ProfessionalDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosUser from "../api/axiosUser";
import { createBooking } from "../api/bookingService";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function ProfessionalDetailPage() {
  const { id } = useParams(); // professionalId
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const openReserve = sp.get("reserve") === "1";

  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);

  // formulario de reserva
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");  // YYYY-MM-DD
  const [time, setTime] = useState("");  // HH:MM
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosUser.get(`${API}/professionals/${id}`);
        if (!mounted) return;
        setPro(data || null);
        // pick primer servicio por default
        const first = (data?.services || [])[0]?._id;
        if (first) setServiceId(first);
      } catch (e) {
        // si no existe, volver
        navigate("/dashboard/user");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate]);

  const name = useMemo(() => pro?.user?.name || "Profesional", [pro]);
  const email = useMemo(() => pro?.user?.email || "", [pro]);

  const onCreateBooking = async () => {
    if (!serviceId || !date || !time) {
      setMsg("Completá servicio, fecha y hora.");
      setTimeout(() => setMsg(""), 1800);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        professionalId: pro._id,
        serviceId,
        date, // YYYY-MM-DD
        time, // HH:MM
        note: note.trim(),
      };
      await createBooking(payload);
      setMsg("✅ Reserva creada");
      setTimeout(() => {
        // podés llevar al listado del usuario
        navigate("/dashboard/user");
      }, 900);
    } catch (e) {
      setMsg("No se pudo crear la reserva");
      setTimeout(() => setMsg(""), 1800);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-white text-[#0a0e17] pt-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse h-32 bg-gray-200 rounded-xl mb-4" />
          <div className="animate-pulse h-6 w-1/2 bg-gray-200 rounded mb-2" />
          <div className="animate-pulse h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      </section>
    );
  }

  if (!pro) return null;

  const services = pro.services || [];

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header visual */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-700" />
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 -mt-10">
                <div className="h-16 w-16 rounded-full ring-4 ring-white bg-white grid place-items-center text-slate-800 font-bold">
                  {(name[0] || "P").toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{name}</h1>
                  <p className="text-sm text-gray-600">{email}</p>
                </div>
              </div>
              <div className="mt-2">
                {pro.isAvailableNow ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Disponible ahora
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Servicios del profesional */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Servicios</h2>
          {services.length === 0 ? (
            <p className="text-gray-600">Este profesional aún no cargó servicios.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <label
                  key={s._id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    serviceId === s._id ? "border-slate-800 bg-slate-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.price != null && (
                      <div className="text-xs text-gray-600">Desde ${s.price}</div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="service"
                    checked={serviceId === s._id}
                    onChange={() => setServiceId(s._id)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Form reserva rápida */}
        <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Reservar</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded border bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded border bg-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: traer escalerita"
                className="w-full px-3 py-2 rounded border bg-white"
              />
            </div>
          </div>

          {msg && (
            <div className="mt-3 text-sm px-3 py-2 rounded border bg-amber-50 border-amber-200 text-amber-800">
              {msg}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={onCreateBooking}
              disabled={saving || services.length === 0}
              className={`px-4 py-2 rounded-lg text-white transition ${
                saving || services.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0a0e17] hover:bg-black"
              }`}
            >
              {saving ? "Reservando…" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfessionalDetailPage;