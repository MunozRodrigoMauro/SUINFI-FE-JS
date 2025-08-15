// src/pages/ProfessionalDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  setAvailableNow,
  getAvailableNowProfessionals,
} from "../api/professionalService";
import { socket } from "../lib/socket"; // ✅ singleton compartido
import ReservationCard from "../components/ReservationCard";
import ChatPreviewCard from "../components/ChatPreviewCard";

function ProfessionalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [savingNow, setSavingNow] = useState(false);
  const [msgNow, setMsgNow] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [onlinePros, setOnlinePros] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(true);

  // ---- helpers -------------------------------------------------------------
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

  // 1) Primer fetch al montar
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refetchOnline();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // id no cambia durante la sesión

  // 2) Suscripción a socket (ambos eventos) + refetch al conectar
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      // reconexión o primera conexión -> garantizamos estado fresco
      refetchOnline();
    };

    const handler = async ({ userId, isAvailableNow: avail }) => {
      // si soy yo -> reflejo switch
      if (userId === (user?.id || user?._id)) {
        setIsAvailableNow(!!avail);
        setLastUpdated(new Date());
        softMessage(avail ? "Ahora figurás como disponible." : "Modo disponible desactivado.");
      }
      // re-cargar la grilla para mantener consistencia
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?._id]);

  // 3) Re-sync al volver a la pestaña (si pasa el tiempo del cron)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetchOnline();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Polling de respaldo cada 60s (por si cae el socket)
  useEffect(() => {
    const id = window.setInterval(refetchOnline, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5) Sync entre pestañas (si cambiás desde navbar u otra tab)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6) Toggle “Disponible ahora” (UI optimista)
  const toggleNow = async () => {
    try {
      setSavingNow(true);
      const next = !isAvailableNow;
      setIsAvailableNow(next); // optimista
      // cross-tab hint
      localStorage.setItem(
        "suinfi:availabilityNow",
        JSON.stringify({ v: next, who: (user?.id || user?._id) })
      );
      await setAvailableNow(next);
      // el backend emite evento -> terminará de sincronizar todo
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
    // si el evento es para mí:
    const myId = user?.id || user?._id;
    if (!myId || payload?.professionalUserId !== myId) return;
    console.log("🆕 Nueva reserva para vos:", payload);
    // acá podrías refetchear tu lista de reservas si tenés una
  };
  const onUpdated = (payload) => {
    console.log("🔄 Reserva actualizada:", payload);
  };

  socket.on("booking:created", onCreated);
  socket.on("booking:updated", onUpdated);
  return () => {
    socket.off("booking:created", onCreated);
    socket.off("booking:updated", onUpdated);
  };
}, [user?.id, user?._id]);

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">🔧 Panel del Profesional</h1>
            <p className="text-gray-700">
              Hola, <span className="font-semibold">{myName}</span>. Gestioná tus servicios y reservas.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border rounded-xl shadow-sm px-4 py-2">
            <span
              className={`inline-flex items-center gap-2 text-sm font-medium ${
                isAvailableNow ? "text-emerald-600" : "text-gray-600"
              }`}
              title={isAvailableNow ? "Aparecés como disponible" : "No figurás como disponible"}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isAvailableNow ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
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

        {/* Accesos rápidos minimalistas */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button
            onClick={() => navigate("/profile")}
            className="bg-[#111827] text-white p-4 rounded-xl shadow hover:shadow-lg transition text-left"
          >
            ⚙️ Configuración
            <p className="text-gray-300 text-xs mt-1">Perfil, agenda semanal y más</p>
          </button>
          <div className="bg-[#111827] text-white p-4 rounded-xl shadow">
            📅 Reservas
            <p className="text-gray-300 text-xs mt-1">Próximas y pendientes</p>
          </div>
          <div className="bg-[#111827] text-white p-4 rounded-xl shadow">
            💬 Mensajes
            <p className="text-gray-300 text-xs mt-1">Conversaciones recientes</p>
          </div>
          <div className="bg-[#111827] text-white p-4 rounded-xl shadow">
            🧰 Servicios
            <p className="text-gray-300 text-xs mt-1">Tu oferta actual</p>
          </div>
        </div>

        {/* Próximas reservas (dummy) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📋 Próximas reservas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ReservationCard
              user="Rodrigo Fernández"
              service="Gasista matriculado"
              date="2025-08-05"
              status="confirmado"
            />
            <ReservationCard
              user="Elena Sánchez"
              service="Electricista"
              date="2025-08-09"
              status="pendiente"
            />
          </div>
        </div>

        {/* Chats (dummy) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">💬 Chats recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ChatPreviewCard
              name="Mariano Duarte"
              lastMessage="¿Cuánto cuesta una revisión de gas?"
              time="hace 2 horas"
            />
            <ChatPreviewCard
              name="Laura Ledesma"
              lastMessage="¡Gracias! Nos vemos el sábado."
              time="hace 4 horas"
            />
          </div>
        </div>

        {/* Profesionales disponibles ahora (live) */}
        <div className="text-left">
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
        </div>
      </div>
    </section>
  );
}

export default ProfessionalDashboard;