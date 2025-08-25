// src/pages/ProfessionalDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  setAvailableNow,
  getAvailableNowProfessionals,
} from "../api/professionalService";
import { socket } from "../lib/socket";
import ChatPreviewCard from "../components/chat/ChatPreviewCard";
import BookingStatusBadge from "../components/booking/BookingStatusBadge";
import BookingActions from "../components/booking/BookingActions";
import { getBookingsForMe } from "../api/bookingService";
import { formatDateTime } from "../utils/datetime";
import { fetchMyChats } from "../api/chatService";
import ChatDock from "../components/chat/ChatDock";

function ProfessionalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [savingNow, setSavingNow] = useState(false);
  const [msgNow, setMsgNow] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [onlinePros, setOnlinePros] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(true);

  const refetchOnline = async () => {
    try {
      setLoadingOnline(true);
      const list = await getAvailableNowProfessionals();
      setOnlinePros(list || []);
      const me = (list || []).find(
        (p) => p?.user?._id === (user?.id || user?._id)
      );
      setIsAvailableNow(Boolean(me));
    } finally {
      setLoadingOnline(false);
    }
  };

  const softMessage = (text) => {
    setMsgNow(text);
    window.clearTimeout((softMessage._t || 0));
    softMessage._t = window.setTimeout(() => setMsgNow(""), 2200);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refetchOnline();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => { refetchOnline(); };

    const handler = async ({ userId, isAvailableNow: avail }) => {
      if (userId === (user?.id || user?._id)) {
        setIsAvailableNow(!!avail);
        setLastUpdated(new Date());
        softMessage(avail ? "Ahora figurás como disponible." : "Modo disponible desactivado.");
      }
      await refetchOnline();
    };

    socket.on("connect", onConnect);
    socket.on("availability:update", handler);
    socket.on("availability:changed", handler);

    return () => {
      socket.off("connect", onConnect);
      socket.off("availability:update", handler);
      socket.off("availability:changed", handler);
    };
  }, [user?.id, user?._id]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchNextBookings();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const id = window.setInterval(refetchOnline, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onStorage = async (e) => {
      if (e.key !== "suinfi:availabilityNow") return;
      try {
        const { v, who } = JSON.parse(e.newValue || "{}");
        if (!who) return;
        if (who === (user?.id || user?._id)) {
          setIsAvailableNow(!!v);
          await refetchOnline();
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleNow = async () => {
    try {
      setSavingNow(true);
      const next = !isAvailableNow;
      setIsAvailableNow(next);
      localStorage.setItem(
        "suinfi:availabilityNow",
        JSON.stringify({ v: next, who: (user?.id || user?._id) })
      );
      await setAvailableNow(next);
    } catch (e) {
      console.error(e);
      setIsAvailableNow((prev) => !prev);
      softMessage("No se pudo actualizar el estado.");
    } finally {
      setSavingNow(false);
    }
  };

  const myName = useMemo(
    () => user?.name || user?.email?.split("@")[0] || "Profesional",
    [user?.name, user?.email]
  );

  useEffect(() => {
    if (!socket) return;
    const onCreated = (payload) => {
      const myId = user?.id || user?._id;
      if (!myId || payload?.professionalUserId !== myId) return;
      fetchNextBookings();
    };
    const onUpdated = () => { fetchNextBookings(); };
    socket.on("booking:created", onCreated);
    socket.on("booking:updated", onUpdated);
    return () => {
      socket.off("booking:created", onCreated);
      socket.off("booking:updated", onUpdated);
    };
  }, [user?.id, user?._id]);

  // Próximas reservas
  const [nextBookings, setNextBookings] = useState([]);
  const [loadingNext, setLoadingNext] = useState(true);
  const RECENT_LIMIT_PRO = 3;

  const fetchNextBookings = async () => {
    setLoadingNext(true);
    try {
      const list = await getBookingsForMe();
      const arr = Array.isArray(list) ? list : [];
      const now = Date.now();
      const futureSorted = arr
        .filter(b => new Date(b?.scheduledAt || b?.createdAt).getTime() >= now || b?.status === "pending")
        .sort((a, b) => new Date(a?.scheduledAt || a?.createdAt) - new Date(b?.scheduledAt || b?.createdAt));
      setNextBookings(futureSorted.slice(0, RECENT_LIMIT_PRO));
    } finally {
      setLoadingNext(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refetchOnline();
      await fetchNextBookings();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  // 💬 Chats recientes + paginación (2 por página) — igual que en UserDash
  const [recentChats, setRecentChats] = useState([]);
  const RECENT_CHATS_PAGE_SIZE = 2;
  const [chatPage, setChatPage] = useState(1);
  const [chatPages, setChatPages] = useState(1);
  const [chatSlice, setChatSlice] = useState([]);

  useEffect(() => { (async () => setRecentChats(await fetchMyChats()))(); }, []);
  useEffect(() => {
    const total = recentChats.length;
    const pgs = Math.max(1, Math.ceil(total / RECENT_CHATS_PAGE_SIZE));
    setChatPages(pgs);
    setChatPage(1);
    setChatSlice(recentChats.slice(0, RECENT_CHATS_PAGE_SIZE));
  }, [recentChats]);
  const goChatPage = (n) => {
    const p = Math.min(Math.max(1, n), chatPages);
    const start = (p - 1) * RECENT_CHATS_PAGE_SIZE;
    setChatPage(p);
    setChatSlice(recentChats.slice(start, start + RECENT_CHATS_PAGE_SIZE));
  };

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              🔧 Profesional: {myName.charAt(0).toUpperCase() + myName.slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white border rounded-xl shadow-sm px-4 py-2">
            <span
              className={`inline-flex items-center gap-2 text-sm font-medium ${
                isAvailableNow ? "text-emerald-600" : "text-gray-600"
              }`}
              title={isAvailableNow ? "Aparecés como disponible" : "No figurás como disponible"}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${
                isAvailableNow ? "bg-emerald-500" : "bg-gray-400"
              }`} />
              {isAvailableNow ? "Disponible" : "No disponible"}
              {lastUpdated && (
                <span className="text-xs text-gray-400">· {lastUpdated.toLocaleTimeString()}</span>
              )}
            </span>

            <button
              onClick={toggleNow}
              disabled={savingNow}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                isAvailableNow ? "bg-emerald-500" : "bg-gray-300"
              } ${savingNow ? "opacity-60" : ""}`}
              aria-label="Conmutar disponibilidad ahora"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  isAvailableNow ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {msgNow && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              msgNow.startsWith("Ahora")
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {msgNow}
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button
            onClick={() => navigate("/profile")}
            className="bg-white border border-gray-200 text-[#111827] p-4 rounded-xl shadow hover:shadow-lg transition text-left cursor-pointer"
          >
            ⚙️ Configuración
            <p className="text-[#111827] text-xs mt-1">Perfil, agenda semanal y más</p>
          </button>
          <button
            onClick={() => navigate("/bookings")}
            className="bg-white border border-gray-200 text-[#111827] p-4 rounded-xl shadow hover:shadow-lg transition text-left cursor-pointer"
          >
            📅 Reservas
            <p className="text-[#111827] text-xs mt-1">Próximas y pendientes</p>
          </button>
          <button
            onClick={() => navigate("/chats")}
            className="bg-white border border-gray-200 text-[#111827] p-4 rounded-xl shadow hover:shadow-lg transition text-left cursor-pointer"
          >
            💬 Mensajes
            <p className="text-[#111827] text-xs mt-1">Conversaciones recientes</p>
          </button>
          <button
            onClick={() => navigate("/dashboard/professional/services")}
            className="bg-white border border-gray-200 text-[#111827] p-4 rounded-xl shadow hover:shadow-lg transition text-left cursor-pointer"
          >
            🧰 Servicios
            <p className="text-[#111827] text-xs mt-1">Gestioná tu oferta</p>
          </button>
        </div>

        {/* Próximas reservas */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📋 Próximas reservas</h2>
            <button
              onClick={() => navigate("/bookings")}
              className="text-sm px-3 py-1.5 rounded-md bg-slate-800 text-white hover:bg-black cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {loadingNext ? (
            <p className="text-gray-600">Cargando…</p>
          ) : nextBookings.length === 0 ? (
            <div className="border rounded-xl p-6 bg-white">
              <p className="text-gray-600 mb-2">No tenés reservas próximas.</p>
              <p className="text-gray-500 text-sm">Cuando te lleguen, aparecerán acá.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {nextBookings.map((b) => {
                const clientName = b?.client?.name || b?.client?.email || "Cliente";
                const serviceName = b?.service?.name || "Servicio";
                const when = formatDateTime(b?.scheduledAt || b?.createdAt);

                return (
                  <div
                    key={b._id}
                    className="border rounded-xl p-4 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={() => {
                      const peerId = b?.client?._id || b?.client?.user?._id;
                      if (peerId) navigate(`/chats/${peerId}`);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const peerId = b?.client?._id || b?.client?.user?._id;
                        if (peerId) navigate(`/chats/${peerId}`);
                      }
                    }}
                    title="Abrir chat con el cliente"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold leading-5">{clientName}</div>
                        <div className="text-sm text-gray-700">{serviceName}</div>
                        <div className="text-sm text-gray-600">{when}</div>
                      </div>
                      <BookingStatusBadge status={b?.status} />
                    </div>
                    {b?.note && (
                      <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2 mt-3">
                        {b.note}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/chats/${b?.client?._id}`)}
                        className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Chatear con cliente
                      </button>
                      <BookingActions booking={b} role="pro" onChanged={fetchNextBookings} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 💬 Chats recientes (con paginación 2x página) */}
        {/* <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">💬 Chats recientes</h2>
            {recentChats.length > 0 && (
              <span className="text-sm text-gray-600">{recentChats.length} en total</span>
            )}
          </div>

          {recentChats.length === 0 ? (
            <p className="text-gray-600">Aún no tenés chats.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {chatSlice.map((c) => (
                  <ChatPreviewCard
                    key={c._id}
                    name={c?.otherUser?.name || c?.otherUser?.email || "Usuario"}
                    lastMessage={c?.lastMessage?.text || "—"}
                    time={
                      c?.lastMessage?.createdAt
                        ? new Date(c.lastMessage.createdAt).toLocaleString()
                        : ""
                    }
                    peerId={c?.otherUser?._id}
                  />
                ))}
              </div>

              {chatPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    disabled={chatPage <= 1}
                    onClick={() => goChatPage(chatPage - 1)}
                    className={`px-3 py-1 rounded border cursor-pointer ${
                      chatPage <= 1
                        ? "opacity-40 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {chatPage} de {chatPages}
                  </span>
                  <button
                    disabled={chatPage >= chatPages}
                    onClick={() => goChatPage(chatPage + 1)}
                    className={`px-3 py-1 rounded border cursor-pointer ${
                      chatPage >= chatPages
                        ? "opacity-40 cursor-not-allowed"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div> */}

        {/* Profesionales disponibles ahora */}
        {/* <div className="text-left">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">🟢 Profesionales disponibles ahora</h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              {onlinePros.length}
            </span>
          </div>
          {loadingOnline ? (
            <p className="text-gray-600">Cargando…</p>
          ) : onlinePros.length === 0 ? (
            <p className="text-gray-600">No hay profesionales en línea ahora.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {onlinePros.map((p) => (
                <div key={p._id} className="border rounded-xl p-4 bg-white shadow-sm">
                  <p className="font-semibold">{p?.user?.name || "Profesional"}</p>
                  <p className="text-sm text-gray-600">{p?.user?.email}</p>
                  <p className="text-sm text-emerald-600 mt-1">Disponible ahora</p>
                </div>
              ))}
            </div>
          )}
        </div> */}
      </div>

      {/* Dock de chat IG/FB */}
      <ChatDock
        chats={recentChats}
        onOpenChat={(peerId) => navigate(`/chats/${peerId}`)}
      />
    </section>
  );
}

export default ProfessionalDashboard;