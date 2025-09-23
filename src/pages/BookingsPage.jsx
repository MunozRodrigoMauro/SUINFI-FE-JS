// src/pages/BookingsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../auth/AuthContext";
import { getBookingsForMe, getMyBookings } from "../api/bookingService";
import BookingCard from "../components/booking/BookingCard";
import BookingActions from "../components/booking/BookingActions";
import { socket } from "../lib/socket";
import BackBar from "../components/layout/BackBar";
import { useNavigate } from "react-router-dom";

// ⬇️ Reseñas
import { getReviewForBooking } from "../api/reviewsService";
import ReviewModal from "../components/reviews/ReviewModal";

/* ───────── helpers de fecha/hora ───────── */
const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  let ms = Date.parse(v);
  if (Number.isFinite(ms)) return ms;
  if (typeof v === "string") {
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (m) {
      const [, d, M, y, h = "00", min = "00"] = m;
      ms = Date.parse(`${y}-${M}-${d}T${h}:${min}:00`);
      if (Number.isFinite(ms)) return ms;
    }
  }
  return 0;
};

const bookingCreatedMs = (b = {}) => toMs(b.createdAt) || toMs(b.updatedAt);
const bookingScheduledMs = (b = {}) => {
  const candidates = [
    b.scheduledAt,
    b.appointmentAt,
    b.dateTime || b.datetime,
    b.startAt || b.startsAt,
    (b.date && b.time) ? `${b.date}T${b.time}` : null,
    b.date,
  ];
  for (const c of candidates) {
    const ms = toMs(c);
    if (ms) return ms;
  }
  return 0;
};
/* ──────────────────────────────────────── */

export default function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("auto"); // auto: detecta por rol
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // orden general (afecta “Recientes” e “Historial”)
  const [sortDir, setSortDir] = useState("desc"); // desc = últimas arriba

  const [reviewMap, setReviewMap] = useState({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState({ bookingId: "", professionalId: "" });

  const role = useMemo(() => {
    if (tab !== "auto") return tab;
    const r = user?.role || user?.roles?.[0] || "client";
    return r.includes("pro") ? "pro" : r;
  }, [user, tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const data = role === "pro" ? await getBookingsForMe(params) : await getMyBookings(params);
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);

      if (role !== "pro") {
        const completed = arr.filter((b) => b?.status === "completed");
        const entries = await Promise.all(
          completed.map(async (b) => {
            try {
              const r = await getReviewForBooking(b._id);
              return [b._id, !!r?.exists];
            } catch {
              return [b._id, false];
            }
          })
        );
        setReviewMap(Object.fromEntries(entries));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  useEffect(() => {
    if (!socket) return;
    const onCreated = () => fetchData();
    const onUpdated = () => fetchData();
    socket.on("booking:created", onCreated);
    socket.on("booking:updated", onUpdated);
    return () => {
      socket.off("booking:created", onCreated);
      socket.off("booking:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────── agrupar para UX ─────────────────────────
  const grouped = useMemo(() => {
    const now = Date.now();
    const RECENT_MS = 24 * 60 * 60 * 1000; // últimas 24h

    // si hay filtro de estado, mostramos una sola lista ordenada
    if (status) {
      const only = items.slice();
      // si es algo "activo", ordenamos por próximo turno (asc)
      if (["pending", "accepted"].includes(status)) {
        only.sort((a, b) => (bookingScheduledMs(a) || Infinity) - (bookingScheduledMs(b) || Infinity));
      } else {
        // resto: orden por creación según preferencia
        only.sort((a, b) => bookingCreatedMs(b) - bookingCreatedMs(a));
        if (sortDir === "asc") only.reverse();
      }
      return { recent: [], upcoming: only, completed: [], other: [] };
    }

    // sin filtro: secciones
    const recent = [];
    const upcoming = [];
    const completed = [];
    const other = [];

    for (const b of items) {
      const created = bookingCreatedMs(b);
      const scheduled = bookingScheduledMs(b);
      const isFuture = scheduled ? scheduled >= now : true;
      const isRecent = created && now - created <= RECENT_MS;

      if (isRecent) {
        recent.push(b);
        continue; // ya está arriba; no duplicar
      }

      const st = String(b?.status || "").toLowerCase();
      if ((st === "pending" || st === "accepted") && isFuture) {
        upcoming.push(b);
      } else if (st === "completed") {
        completed.push(b);
      } else {
        other.push(b); // canceled, rejected, vencidas, etc
      }
    }

    // orden dentro de cada grupo
    recent.sort((a, b) => bookingCreatedMs(b) - bookingCreatedMs(a));
    if (sortDir === "asc") recent.reverse();

    // Próximas: lo próximo primero
    upcoming.sort((a, b) => (bookingScheduledMs(a) || Infinity) - (bookingScheduledMs(b) || Infinity));

    // Completadas y Otras: más nuevas arriba/abajo según selector
    const histSort = (a, b) => (bookingScheduledMs(b) || bookingCreatedMs(b)) - (bookingScheduledMs(a) || bookingCreatedMs(a));
    completed.sort(histSort);
    other.sort(histSort);
    if (sortDir === "asc") {
      completed.reverse();
      other.reverse();
    }

    return { recent, upcoming, completed, other };
  }, [items, status, sortDir]);

  const DesktopActions = (
    <div className="hidden md:flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 rounded border bg-white text-[#0a0e17] min-w-[140px] cursor-pointer"
        title="Filtrar por estado"
      >
        <option value="">Todos</option>
        <option value="pending">Pendiente</option>
        <option value="accepted">Aceptada</option>
        <option value="rejected">Rechazada</option>
        <option value="completed">Completada</option>
        <option value="canceled">Cancelada</option>
      </select>

      <select
        value={sortDir}
        onChange={(e) => setSortDir(e.target.value)}
        className="px-3 py-2 rounded border bg-white text-[#0a0e17] min-w-[190px] cursor-pointer"
        title="Ordenar"
      >
        <option value="desc">Últimas primero</option>
        <option value="asc">Primeras primero</option>
      </select>

      <button onClick={fetchData} className="px-3 py-2 rounded bg-slate-800 text-white hover:bg-black cursor-pointer">
        Refrescar
      </button>
    </div>
  );

  const Section = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <div className="mb-8">
        <div className="sticky top-[calc(theme(spacing.14)+theme(height.12)+48px)] md:top-[calc(theme(spacing.14)+theme(height.12))] z-[1] bg-white/90 backdrop-blur border-b pb-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((bk) => {
            const peerId =
              role === "pro"
                ? (bk?.client?._id || bk?.client?.user?._id)
                : (bk?.professional?.user?._id);

            const canReview =
              role !== "pro" &&
              bk?.status === "completed" &&
              reviewMap[bk._id] !== true;

            const created = bookingCreatedMs(bk);
            const isNew = created && Date.now() - created <= 24 * 60 * 60 * 1000;

            const newPill = isNew ? (
              <span
                className="text-[10px] px-2 py-[3px] rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200"
                title="Creada recientemente"
              >
                Nuevo
              </span>
            ) : null;

            const reviewButton = canReview ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setReviewTarget({ bookingId: bk._id, professionalId: bk?.professional?._id });
                  setReviewOpen(true);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600"
                title="Dejar reseña"
              >
                Dejar reseña
              </button>
            ) : null;

            return (
              <BookingCard
                key={bk._id}
                booking={bk}
                role={role}
                rightSlot={
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    {newPill}
                    {reviewButton}
                    <BookingActions booking={bk} role={role} onChanged={fetchData} />
                  </div>
                }
                onOpenChat={peerId ? () => navigate(`/chats/${peerId}`) : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <BackBar title="📅 Reservas" subtitle="Gestioná tus reservas en tiempo real." right={DesktopActions} />

      {/* Controles móviles */}
      <div className="md:hidden sticky top-[calc(theme(spacing.14)+theme(height.12))] z-[9] bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded border bg-white text-[#0a0e17] cursor-pointer"
            title="Filtrar por estado"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
            <option value="completed">Completada</option>
            <option value="canceled">Cancelada</option>
          </select>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded border bg-white text-[#0a0e17] cursor-pointer"
            title="Vista"
          >
            <option value="auto">Auto</option>
            <option value="client">Cliente</option>
            <option value="pro">Profesional</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded border bg-white text-[#0a0e17] cursor-pointer"
            title="Ordenar"
          >
            <option value="desc">Últimas primero</option>
            <option value="asc">Primeras primero</option>
          </select>

          <button onClick={fetchData} className="w-full px-3 py-2 rounded bg-slate-800 text-white hover:bg-black cursor-pointer">
            Refrescar
          </button>
        </div>
      </div>

      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <p className="text-gray-600">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No hay reservas.</p>
          ) : status ? (
            // con filtro, mostramos como una sola sección (“Resultados”)
            <Section title="Resultados" items={grouped.upcoming} />
          ) : (
            <>
              <Section title="🆕 Recientes (últimas 24 h)" items={grouped.recent} />
              <Section title="🔜 Próximas" items={grouped.upcoming} />
              <Section title="✅ Completadas" items={grouped.completed} />
              <Section title="🗂️ Otras (canceladas / rechazadas / vencidas)" items={grouped.other} />
            </>
          )}
        </div>
      </section>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        professionalId={reviewTarget.professionalId}
        bookingId={reviewTarget.bookingId}
        onSaved={() => {
          setReviewMap((m) => ({ ...m, [reviewTarget.bookingId]: true }));
          fetchData();
        }}
      />
    </>
  );
}
