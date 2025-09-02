import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProfessionalById, getProfessionalDocsMeta } from "../api/professionalService";
import { createBooking } from "../api/bookingService";
import axiosUser from "../api/axiosUser";

// ✅ Visual
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API.replace(/\/api\/?$/, "");

const absUrl = (u) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`;

const fetchAllServices = async () => {
  const { data } = await axiosUser.get(`${API}/services`);
  return Array.isArray(data) ? data : [];
};

// ======= helpers para "reserva inmediata" (modal y header) =======
const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const hhmmToMin = (hhmm = "00:00") => {
  const [h = "0", m = "0"] = String(hhmm).split(":");
  return Number(h) * 60 + Number(m);
};
const minToHHMM = (m) => {
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
};
const roundUp = (value, step) => Math.ceil(value / step) * step;

/** Devuelve {dateStr:"YYYY-MM-DD", timeStr:"HH:mm"} o null */
function findNextAvailableSlot(professional, stepMin = 30, horizonDays = 14) {
  const now = new Date();
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    const key = DAYS_ES[dow];

    const sch =
      professional?.availabilitySchedule?.[key] ||
      (i === 0 ? { from: "09:00", to: "18:00" } : null);

    if (!sch || !sch.from || !sch.to) continue;

    const fromMin = hhmmToMin(sch.from);
    const toMin = hhmmToMin(sch.to);

    const startMinToday = roundUp(d.getHours() * 60 + d.getMinutes(), stepMin);
    const startMin = i === 0 ? Math.max(fromMin, startMinToday) : fromMin;

    if (startMin <= toMin) {
      return { dateStr, timeStr: minToHHMM(startMin) };
    }
  }
  return null;
}

function ReserveModal({ open, onClose, professional, onCreated, services = [], returnFocusRef }) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [savingInstant, setSavingInstant] = useState(false);

  const hasServices = (services || []).length > 0;

  const selectRef = useRef(null);
  const handleClose = useCallback(() => {
    try {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    } catch {}
    onClose?.();
  }, [onClose, returnFocusRef]);

  const DAYS_ES_LOCAL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  const nextDays = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const value = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
      arr.push({ value, label });
    }
    return arr;
  }, []);

  const genTimeSlots = (start = "09:00", end = "18:00", stepMin = 30) => {
    const [sh, sm] = String(start).split(":").map(Number);
    const [eh, em] = String(end).split(":").map(Number);
    let t = sh * 60 + sm;
    const endT = eh * 60 + em;
    const out = [];
    while (t <= endT) {
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      out.push(`${h}:${m}`);
      t += stepMin;
    }
    return out;
  };

  const scheduleForDay = useMemo(() => {
    if (!date) return null;
    const dow = new Date(date).getDay();
    const key = DAYS_ES_LOCAL[dow];
    return professional?.availabilitySchedule?.[key] || null;
  }, [date, professional?.availabilitySchedule]);

  const timeOptions = useMemo(() => {
    const from = scheduleForDay?.from || "09:00";
    const to = scheduleForDay?.to || "18:00";
    return genTimeSlots(from, to, 30);
  }, [scheduleForDay]);

  const rawWa =
    professional?.whatsapp?.number ||
    professional?.user?.phone ||
    professional?.user?.contactPhone ||
    "";
  const waDigitsDetail = (rawWa || "").replace(/\D/g, "");
  const canShowWa = !!professional?.whatsapp?.visible && !!waDigitsDetail;

  const nextSlot = useMemo(() => findNextAvailableSlot(professional), [professional]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDate("");
    setTime("");
    setNote("");
    setMsg("");
    setSavingInstant(false);
    setServiceId(hasServices ? services[0]._id : "");
    setTimeout(() => selectRef.current?.focus(), 0);
  }, [open, services, hasServices]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!hasServices) {
      setMsg("Este profesional no tiene servicios cargados.");
      return;
    }
    if (!serviceId || !date || !time) {
      setMsg("Completá servicio, fecha y hora.");
      return;
    }
    try {
      setSaving(true);
      const payload = { professionalId: professional._id, serviceId, date, time, note: note?.trim() || "" };
      const res = await createBooking(payload);
      onCreated?.(res?.booking);
      handleClose();
    } catch (e) {
      setMsg(e?.message || "No se pudo crear la reserva. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const submitInstant = async () => {
    setMsg("");
    if (!hasServices) {
      setMsg("Este profesional no tiene servicios cargados.");
      return;
    }
    try {
      setSavingInstant(true);
      const selected = serviceId || services[0]?._id;
      if (!selected) {
        setMsg("Seleccioná un servicio para continuar.");
        setSavingInstant(false);
        return;
      }
      const slot = findNextAvailableSlot(professional);
      if (!slot) {
        setMsg("No hay disponibilidad inmediata. Probá eligiendo fecha y hora.");
        setSavingInstant(false);
        return;
      }
      const payload = {
        professionalId: professional._id,
        serviceId: selected,
        date: slot.dateStr,
        time: slot.timeStr,
        note: note?.trim() || "Reserva inmediata desde modal",
      };
      const res = await createBooking(payload);
      onCreated?.(res?.booking);
      handleClose();
    } catch (e) {
      setMsg(e?.message || "No se pudo crear la reserva inmediata. Probá de nuevo.");
    } finally {
      setSavingInstant(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Reservar">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reservar</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-black" aria-label="Cerrar modal">✕</button>
        </div>

        {/* Barra superior: Reservar ahora */}
        <div className="px-5 pt-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={submitInstant}
              disabled={savingInstant || !hasServices}
              className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-3 py-2 rounded-lg text-white whitespace-nowrap ${
                savingInstant || !hasServices ? "bg-emerald-400/60 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              title="Crear reserva con el próximo turno disponible"
            >
              <span>⚡</span>
              <span>{savingInstant ? "Reservando…" : "Reservar ahora"}</span>
            </button>
            <div className="text-xs text-emerald-800">
              Próximo turno: {nextSlot ? <b>{new Date(nextSlot.dateStr + "T00:00:00").toLocaleDateString()} {nextSlot.timeStr}hs</b> : <span>No disponible</span>}
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {msg && <div className="text-sm bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg">{msg}</div>}

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium mb-1">Servicio</label>
            {hasServices ? (
              <select ref={selectRef} value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                {(services || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.price ? ` — $${s.price}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full border rounded-lg px-3 py-2 bg-amber-50 border-amber-200 text-amber-800 text-sm">
                Este profesional aún no cargó servicios.
              </div>
            )}
          </div>

          {/* Fecha */}
          <DateTimePicker
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            professional={professional}
          />

          {/* Nota */}
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

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !hasServices || !serviceId || !date || !time}
              className={`px-4 py-2 rounded-lg text-white whitespace-nowrap ${
                saving || !hasServices || !serviceId || !date || !time ? "bg-gray-400 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black/80"
              }`}
            >
              {saving ? "Creando…" : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Un sub-componente chiquito para no repetir lógica de fecha/hora
function DateTimePicker({ date, setDate, time, setTime, professional }) {
  const DAYS_ES_LOCAL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  const nextDays = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const value = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
      arr.push({ value, label });
    }
    return arr;
  }, []);

  const genTimeSlots = (start = "09:00", end = "18:00", stepMin = 30) => {
    const [sh, sm] = String(start).split(":").map(Number);
    const [eh, em] = String(end).split(":").map(Number);
    let t = sh * 60 + sm;
    const endT = eh * 60 + em;
    const out = [];
    while (t <= endT) {
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      out.push(`${h}:${m}`);
      t += stepMin;
    }
    return out;
  };

  const scheduleForDay = useMemo(() => {
    if (!date) return null;
    const dow = new Date(date).getDay();
    const key = DAYS_ES_LOCAL[dow];
    return professional?.availabilitySchedule?.[key] || null;
  }, [date, professional?.availabilitySchedule]);

  const timeOptions = useMemo(() => {
    const from = scheduleForDay?.from || "09:00";
    const to = scheduleForDay?.to || "18:00";
    return genTimeSlots(from, to, 30);
  }, [scheduleForDay]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2">Fecha</label>
        <div className="flex gap-2 overflow-x-auto py-1">
          {nextDays.map((d) => (
            <button
              type="button"
              key={d.value}
              onClick={() => {
                setDate(d.value);
                setTime("");
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-sm ${
                date === d.value ? "bg-[#0a0e17] text-white border-[#0a0e17]" : "bg-white hover:bg-gray-50"
              }`}
              title={new Date(d.value).toLocaleDateString()}
            >
              {d.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Hora</label>
        {!date ? (
          <div className="text-sm text-gray-500">Elegí primero una fecha.</div>
        ) : (
          <>
            {scheduleForDay && (
              <div className="text-xs text-gray-600 mb-1">
                Atiende de {scheduleForDay.from} a {scheduleForDay.to}.
              </div>
            )}
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg">
              {timeOptions.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTime(t)}
                  className={`px-2.5 py-1.5 rounded-md text-sm border ${
                    time === t ? "bg-[#0a0e17] text-white border-[#0a0e17]" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="sr-only" aria-hidden tabIndex={-1} />
      </div>
    </>
  );
}

function Stars({ value = 0, size = "text-xs" }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={`${size} text-amber-600`} title={`${v.toFixed(1)} / 5`}>
      {"⭐".repeat(Math.round(v))}
      <span className="text-gray-400">{"⭐".repeat(5 - Math.round(v))}</span>
    </span>
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

  const [docsMeta, setDocsMeta] = useState(null);
  const [pdfOpen, setPdfOpen] = useState({ url: "", open: false });

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [revPage, setRevPage] = useState(1);
  const REV_LIMIT = 5;
  const [revHasMore, setRevHasMore] = useState(false);

  const [revSort, setRevSort] = useState("recent");
  const [revOnlyPhotos, setRevOnlyPhotos] = useState(false);
  const [revOnlyComment, setRevOnlyComment] = useState(false);
  const [revMinStars, setRevMinStars] = useState(0);

  const [photoViewer, setPhotoViewer] = useState({ open: false, urls: [], index: 0 });

  const [instantSaving, setInstantSaving] = useState(false);
  const [instantMsg, setInstantMsg] = useState("");

  const openModalBtnRef = useRef(null);

  const fetchReviews = async (page = 1) => {
    setLoadingReviews(true);
    try {
      const { data } = await axiosUser.get(`${API}/reviews/professional/${id}`, {
        params: { page, limit: REV_LIMIT },
      });
      const arrRaw = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      const arr = arrRaw.map((r) => ({
        ...r,
        photos: Array.isArray(r?.photos) ? r.photos.map((p) => ({ ...p, url: absUrl(p.url) })) : [],
      }));
      setReviews(arr);
      const hasMore =
        typeof data?.total === "number" && typeof data?.pages === "number" ? page < data.pages : arrRaw.length === REV_LIMIT;
      setRevHasMore(hasMore);
      setRevPage(page);
    } catch {
      setReviews([]);
      setRevHasMore(false);
    } finally {
      setLoadingReviews(false);
    }
  };

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

        try {
          const meta = await getProfessionalDocsMeta(id);
          const cr = meta?.criminalRecord || null;
          const lic = meta?.license || null;
          const now = Date.now();
          setDocsMeta({
            criminalRecord: cr
              ? {
                  ...cr,
                  url: absUrl(cr.url),
                  expired: typeof cr.expired === "boolean" ? cr.expired : cr.expiresAt ? new Date(cr.expiresAt).getTime() < now : false,
                }
              : null,
            license: lic ? { ...lic, url: absUrl(lic.url) } : null,
          });
        } catch {
          const d = data?.documents || {};
          const now = Date.now();
          const cr = d?.criminalRecord || null;
          const lic = d?.license || null;
          if (cr || lic) {
            setDocsMeta({
              criminalRecord: cr
                ? { ...cr, url: absUrl(cr.url), expired: cr.expiresAt ? new Date(cr.expiresAt).getTime() < now : false }
                : null,
              license: lic ? { ...lic, url: absUrl(lic.url) } : null,
            });
          }
        }

        setLoadingServices(false);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (search.get("reserve") === "1") setOpenModal(true);
  }, [search]);

  const servicesNames = useMemo(() => (servicesResolved || []).map((s) => s?.name).filter(Boolean), [servicesResolved]);

  const filteredReviews = useMemo(() => {
    let arr = [...reviews];
    if (revOnlyPhotos) arr = arr.filter((r) => (r.photos || []).length > 0);
    if (revOnlyComment) arr = arr.filter((r) => (r.comment || "").trim().length > 0);
    if (revMinStars > 0) arr = arr.filter((r) => Number(r.rating || 0) >= revMinStars);

    switch (revSort) {
      case "oldest":
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "best":
        arr.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "worst":
        arr.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0) || new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "recent":
      default:
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return arr;
  }, [reviews, revOnlyPhotos, revOnlyComment, revMinStars, revSort]);

  const resetFilters = () => {
    setRevSort("recent");
    setRevOnlyPhotos(false);
    setRevOnlyComment(false);
    setRevMinStars(0);
  };

  const openViewer = useCallback((urls, index) => {
    if (!urls?.length) return;
    setPhotoViewer({ open: true, urls, index });
  }, []);
  const closeViewer = useCallback(() => setPhotoViewer({ open: false, urls: [], index: 0 }), []);
  const nextPhoto = useCallback(() => setPhotoViewer((v) => ({ ...v, index: (v.index + 1) % v.urls.length })), []);
  const prevPhoto = useCallback(() => setPhotoViewer((v) => ({ ...v, index: (v.index - 1 + v.urls.length) % v.urls.length })), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (photoViewer.open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = prev || "";
    return () => (document.body.style.overflow = prev || "");
  }, [photoViewer.open]);

  const canInstant =
    Boolean(pro?.isAvailableNow) && (servicesResolved || []).length > 0 && !loadingServices && !loading;

  const doInstantBooking = async () => {
    setInstantMsg("");
    if (!canInstant) {
      setOpenModal(true);
      return;
    }
    try {
      setInstantSaving(true);
      const svc = servicesResolved[0];
      const slot = findNextAvailableSlot(pro);
      if (!svc || !slot) {
        setOpenModal(true);
        return;
      }
      const payload = {
        professionalId: pro._id,
        serviceId: svc._id,
        date: slot.dateStr,
        time: slot.timeStr,
        note: "Reserva inmediata desde perfil",
      };
      await createBooking(payload);
      setInstantMsg("✅ Reserva creada");
      navigate("/bookings");
    } catch (e) {
      setInstantMsg(e?.message || "No se pudo crear la reserva inmediata. Probá manualmente.");
      setOpenModal(true);
    } finally {
      setInstantSaving(false);
      setTimeout(() => setInstantMsg(""), 3000);
    }
  };

  if (loading) return <div className="pt-28 text-center">Cargando…</div>;
  if (!pro) return <div className="pt-28 text-center text-gray-600">Profesional no encontrado.</div>;

  const name = pro?.user?.name || "Profesional";
  const email = pro?.user?.email || "";
  const avatar = pro?.user?.avatarUrl ? absUrl(pro.user.avatarUrl) : "";
  const initial = (name?.[0] || "P").toUpperCase();

  const avg = Number(pro?.averageRating ?? pro?.rating ?? 0) || 0;
  const count = Number(pro?.reviews ?? pro?.reviewsCount ?? 0) || 0;

  // WhatsApp (visible + número)
  const rawWa = pro?.whatsapp?.number || pro?.user?.phone || pro?.user?.contactPhone || "";
  const waDigitsDetail = String(rawWa || "").replace(/\D/g, "");
  const canShowWa = Boolean(pro?.whatsapp?.visible && waDigitsDetail);

  return (
    <>
      <Navbar />
      <BackBar title={name} subtitle={email} />

      <section className="min-h-screen bg-white text-[#0a0e17] pb-16 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="relative h-40 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 mt-6">
            <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-full ring-4 ring-white bg-white overflow-hidden grid place-items-center text-slate-800 font-bold">
              {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : initial}
            </div>
          </div>

          <div className="pt-10 px-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{name}</h1>
                <p className="text-sm text-gray-600">{email}</p>

                <div className="mt-1 flex items-center gap-2">
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">⭐ {avg.toFixed(1)}</div>
                  <span className="text-xs text-gray-600">({count} reseña{count === 1 ? "" : "s"})</span>
                </div>

                <ServicesChips servicesNames={servicesNames} loadingServices={loadingServices} />
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {pro.isAvailableNow ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 border">Disponible ahora</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">Offline</span>
                )}

                <button
                  onClick={doInstantBooking}
                  disabled={!canInstant || instantSaving}
                  title={!canInstant ? "No disponible ahora o sin servicios." : "Hacé tu reserva inmediata en 1 clic"}
                  className={`ml-2 px-3 sm:px-4 py-2 rounded-lg text-white whitespace-nowrap ${
                    !canInstant || instantSaving ? "bg-emerald-400/60 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {instantSaving ? "Reservando…" : "⚡ Reservar ahora"}
                </button>

                {canShowWa && (
                  <a
                    href={`https://wa.me/${waDigitsDetail}?text=${encodeURIComponent("Hola, te contacto desde Suinfi 👋")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium bg-[#25D366] text-white hover:bg-[#1ebe57] px-4 py-2 rounded-md shadow-sm cursor-pointer"
                    title="Contactar por WhatsApp"
                  >
                    {/* WhatsApp icon (SVG) */}
                    <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true" focusable="false">
                      <path
                        fill="currentColor"
                        d="M19.11 17.23c-.29-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.29-.74.92-.91 1.11-.17.2-.34.22-.63.08-.29-.14-1.23-.45-2.35-1.44-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.12-.58.12-.12.29-.31.43-.46.14-.15.19-.26.29-.43.1-.17.05-.32-.02-.46-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.47-.64-.47h-.54c-.19 0-.49.07-.75.35-.26.29-.99.97-.99 2.36s1.02 2.74 1.16 2.93c.14.2 2 3.05 4.84 4.28.68.29 1.21.46 1.62.58.68.22 1.29.19 1.77.12.54-.08 1.68-.69 1.92-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33zM16.01 4.3c-6.42 0-11.63 5.21-11.63 11.63 0 2.05.54 4.05 1.57 5.81L4 28l6.43-1.89a11.57 11.57 0 0 0 5.58 1.46h.01c6.42 0 11.63-5.21 11.63-11.63 0-3.11-1.21-6.04-3.41-8.24a11.587 11.587 0 0 0-8.24-3.41zm0 21.17h-.01c-1.79 0-3.54-.48-5.06-1.38l-.36-.21-3.78 1.11 1.13-3.68-.23-.38a9.67 9.67 0 0 1-1.49-5.18c0-5.35 4.35-9.7 9.7-9.7 2.59 0 5.03 1.01 6.86 2.84a9.66 9.66 0 0 1 2.84 6.85c0 5.35-4.35 9.7-9.7 9.7z"
                      />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  ref={openModalBtnRef}
                  onClick={() => setOpenModal(true)}
                  disabled={servicesResolved.length === 0}
                  title={servicesResolved.length === 0 ? "Este profesional no cargó servicios" : "Reservar"}
                  className={`ml-2 px-3 sm:px-4 py-2 rounded-lg text-white whitespace-nowrap ${
                    servicesResolved.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black"
                  }`}
                >
                  Reservar
                </button>
              </div>
            </div>

            {instantMsg && (
              <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
                {instantMsg}
              </div>
            )}

            <Documents docsMeta={docsMeta} setPdfOpen={setPdfOpen} />

            <div className="mt-6">
              <h2 className="font-semibold mb-1">Descripción</h2>
              <p className="text-gray-700 text-sm">{pro?.bio || "Sin descripción"}</p>
            </div>

            <ReviewsBlock
              avg={avg}
              count={count}
              loadingReviews={loadingReviews}
              filteredReviews={filteredReviews}
              fetchReviews={fetchReviews}
              revPage={revPage}
              revHasMore={revHasMore}
              revSort={revSort}
              setRevSort={setRevSort}
              revMinStars={revMinStars}
              setRevMinStars={setRevMinStars}
              revOnlyPhotos={revOnlyPhotos}
              setRevOnlyPhotos={setRevOnlyPhotos}
              revOnlyComment={revOnlyComment}
              setRevOnlyComment={setRevOnlyComment}
              resetFilters={resetFilters}
              openViewer={openViewer}
            />
          </div>
        </div>

        <ReserveModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          professional={pro}
          services={servicesResolved}
          onCreated={() => navigate("/bookings")}
          returnFocusRef={openModalBtnRef}
        />
      </section>

      {pdfOpen.open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Documento">
          <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">Documento</div>
              <button onClick={() => setPdfOpen({ url: "", open: false })} className="text-gray-600 hover:text-black" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="h-[70vh]">
              <object data={pdfOpen.url} type="application/pdf" className="w-full h-full">
                <p className="p-4 text-sm">
                  No se pudo mostrar el PDF.{" "}
                  <a href={pdfOpen.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    Abrir en nueva pestaña
                  </a>
                </p>
              </object>
            </div>
          </div>
        </div>
      )}

      {photoViewer.open && (
        <div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Imágenes">
          <div className="relative w-full max-w-4xl">
            <button onClick={closeViewer} className="absolute -top-10 right-0 text-white/90 hover:text-white text-2xl" aria-label="Cerrar" title="Cerrar">✕</button>
            <div className="relative bg-black rounded-xl overflow-hidden">
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2" aria-label="Anterior" title="Anterior">←</button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2" aria-label="Siguiente" title="Siguiente">→</button>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={photoViewer.urls[photoViewer.index]} className="w-full max-h-[80vh] sm:max-h-[75vh] object-contain bg-black" />
            </div>
            {photoViewer.urls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {photoViewer.urls.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoViewer((v) => ({ ...v, index: i }))}
                    className={`w-20 h-20 rounded border overflow-hidden ${i === photoViewer.index ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"}`}
                    title={`Imagen ${i + 1}`}
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img src={u} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ServicesChips({ servicesNames, loadingServices }) {
  return (
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
  );
}

function Documents({ docsMeta, setPdfOpen }) {
  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Documentos</h2>

      <div className="flex items-center justify-between p-3 border rounded-xl mb-3">
        <div>
          <div className="font-medium">Certificado de antecedentes</div>
          <div className="text-sm text-gray-600">
            {docsMeta?.criminalRecord?.url ? (
              docsMeta.criminalRecord.expired ? (
                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-xs">Vencido</span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-xs">Vigente</span>
              )
            ) : (
              <span className="text-gray-700 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-xs">No cargado</span>
            )}
            {docsMeta?.criminalRecord?.expiresAt && (
              <span className="ml-2 text-xs text-gray-500">
                Vence: {new Date(docsMeta.criminalRecord.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {docsMeta?.criminalRecord?.url && (
          <button
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
            onClick={() => setPdfOpen({ url: docsMeta.criminalRecord.url, open: true })}
          >
            Ver documento
          </button>
        )}
      </div>

      <div className="flex items-center justify-between p-3 border rounded-xl">
        <div>
          <div className="font-medium">Matrícula / Credencial</div>
          <div className="text-sm text-gray-600">
            {docsMeta?.license?.url ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-xs">Cargada</span>
            ) : (
              <span className="text-gray-700 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-xs">No cargada</span>
            )}
          </div>
        </div>
        {docsMeta?.license?.url && (
          <button
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
            onClick={() => setPdfOpen({ url: docsMeta.license.url, open: true })}
          >
            Ver documento
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewsBlock(props) {
  const {
    avg, count, loadingReviews, filteredReviews, fetchReviews,
    revPage, revHasMore, revSort, setRevSort,
    revMinStars, setRevMinStars, revOnlyPhotos, setRevOnlyPhotos,
    revOnlyComment, setRevOnlyComment, resetFilters, openViewer
  } = props;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Reseñas de clientes</h2>
        <div className="text-xs text-gray-600">
          Promedio{" "}
          <span className="inline-flex items-center gap-1">
            <b>{avg.toFixed(1)}</b> <Stars value={avg} />
          </span>{" "}
          · {count} reseña{count === 1 ? "" : "s"}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select value={revSort} onChange={(e) => setRevSort(e.target.value)} className="px-2 py-1.5 rounded border bg-white text-sm" title="Ordenar">
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="best">Mejor calificación</option>
          <option value="worst">Peor calificación</option>
        </select>

        <select value={revMinStars} onChange={(e) => setRevMinStars(Number(e.target.value))} className="px-2 py-1.5 rounded border bg-white text-sm" title="Mínimo de estrellas">
          <option value={0}>Todas las calificaciones</option>
          <option value={4}>4★ y más</option>
          <option value={3}>3★ y más</option>
          <option value={2}>2★ y más</option>
          <option value={1}>1★ y más</option>
        </select>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={revOnlyPhotos} onChange={(e) => setRevOnlyPhotos(e.target.checked)} />
          <span>Con fotos</span>
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={revOnlyComment} onChange={(e) => setRevOnlyComment(e.target.checked)} />
          <span>Con comentario</span>
        </label>

        <button onClick={resetFilters} className="text-sm text-indigo-700 hover:underline ml-auto">Restablecer</button>
      </div>

      {loadingReviews ? (
        <div className="text-gray-600 text-sm">Cargando reseñas…</div>
      ) : filteredReviews.length === 0 ? (
        <div className="border rounded-xl p-4 bg-white text-sm text-gray-600">No hay reseñas que coincidan con el filtro actual.</div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((r) => {
            const photoUrls = (r.photos || []).map((p) => p.url).filter(Boolean);
            return (
              <div key={r._id || r.id} className="border rounded-xl p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{r?.user?.name || "Cliente"}</div>
                    <div className="text-xs text-gray-500">{r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                  </div>
                  <div className="shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      ⭐ {Number(r?.rating || 0).toFixed(1)}
                    </div>
                  </div>
                </div>

                {r?.comment && <p className="text-sm text-gray-700 mt-2">{r.comment}</p>}

                {photoUrls.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {photoUrls.slice(0, 6).map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openViewer(photoUrls, idx)}
                          className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 group"
                          title="Ver foto"
                        >
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={u} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10" />
                        </button>
                      ))}
                    </div>
                    {photoUrls.length > 6 && (
                      <button type="button" onClick={() => openViewer(photoUrls, 6)} className="mt-1 text-xs text-indigo-700 hover:underline">
                        Ver {photoUrls.length - 6} más
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => fetchReviews(Math.max(1, revPage - 1))}
              disabled={revPage <= 1}
              className={`px-3 py-1 rounded border ${revPage <= 1 ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"}`}
            >
              ←
            </button>
            <span className="text-sm text-gray-700">Página {revPage}</span>
            <button
              onClick={() => fetchReviews(revPage + 1)}
              disabled={!revHasMore}
              className={`px-3 py-1 rounded border ${!revHasMore ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"}`}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
