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

export default function BookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("auto"); // auto: detecta por rol
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

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
      setItems(Array.isArray(data) ? data : []);
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

  // Acciones (se renderizan en BackBar solo en >= md)
  const DesktopActions = (
    <div className="hidden md:flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-2 rounded border bg-white text-[#0a0e17] min-w-[140px]"
        title="Filtrar por estado"
      >
        <option value="">Todos</option>
        <option value="pending">Pendiente</option>
        <option value="accepted">Aceptada</option>
        <option value="rejected">Rechazada</option>
        <option value="completed">Completada</option>
        <option value="canceled">Cancelada</option>
      </select>
      {/* <select
        value={tab}
        onChange={(e) => setTab(e.target.value)}
        className="px-3 py-2 rounded border bg-white text-[#0a0e17] min-w-[140px]"
        title="Vista"
      >
        <option value="auto">Auto</option>
        <option value="client">Cliente</option>
        <option value="pro">Profesional</option>
      </select> */}
      <button onClick={fetchData} className="px-3 py-2 rounded bg-slate-800 text-white hover:bg-black">
        Refrescar
      </button>
    </div>
  );

  return (
    <>
      <Navbar />

      {/* BackBar coherente en mobile/desktop (no se superpone) */}
      <BackBar
        title="📅 Reservas"
        subtitle="Gestioná tus reservas en tiempo real."
        right={DesktopActions}
      />

      {/* Toolbar MOBILE debajo del BackBar (evita desfasaje) */}
      <div className="md:hidden sticky top-[calc(theme(spacing.14)+theme(height.12))] z-[9] bg-white/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2 rounded border bg-white text-[#0a0e17]"
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
            className="flex-1 min-w-[140px] px-3 py-2 rounded border bg-white text-[#0a0e17]"
            title="Vista"
          >
            <option value="auto">Auto</option>
            <option value="client">Cliente</option>
            <option value="pro">Profesional</option>
          </select>
          <button
            onClick={fetchData}
            className="w-full px-3 py-2 rounded bg-slate-800 text-white hover:bg-black"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Contenido */}
      <section className="min-h-screen bg-white text-[#0a0e17] pt-30 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <p className="text-gray-600">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No hay reservas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((bk) => {
                const peerId =
                  role === "pro"
                    ? (bk?.client?._id || bk?.client?.user?._id)
                    : (bk?.professional?.user?._id);
                return (
                <BookingCard
                  key={bk._id}
                  booking={bk}
                  role={role}
                  rightSlot={<BookingActions booking={bk} role={role} onChanged={fetchData} />}
                  onOpenChat={peerId ? () => navigate(`/chats/${peerId}`) : undefined}
                />
              )})}
            </div>
          )}
        </div>
      </section>
    </>
  );
}