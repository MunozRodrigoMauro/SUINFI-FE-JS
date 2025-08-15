// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReservationCard from "../components/ReservationCard";
import ChatPreviewCard from "../components/ChatPreviewCard";
import { getProfessionals } from "../api/professionalService";
import axiosUser from "../api/axiosUser";
import { socket } from "../lib/socket"; // ✅ singleton

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- estado de filtros ---
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [availableNow, setAvailableNow] = useState(false);

  // listas para selects
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  // catálogo
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // paginación
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  // cargar combos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cats, servs] = await Promise.all([
          axiosUser.get(`${API}/categories`),
          axiosUser.get(`${API}/services`),
        ]);
        if (!mounted) return;
        setCategories(cats.data || []);
        setServices(servs.data || []);
      } catch {
        /* noop */
      }
    })();
    return () => { mounted = false; };
  }, []);

  // si cambia categoría, filtramos services del combo (sin pegarle al back de nuevo)
  const filteredServices = useMemo(() => {
    if (!categoryId) return services;
    return (services || []).filter(
      (s) => s?.category?._id === categoryId || s?.category === categoryId
    );
  }, [services, categoryId]);

  // fetch catálogo (con paginación y filtros)
  const fetchCatalog = async (pageArg = 1) => {
    setLoading(true);
    try {
      const params = { page: pageArg, limit };
      if (availableNow) params.availableNow = true;
      if (categoryId) params.categoryId = categoryId;
      if (serviceId) params.serviceId = serviceId;

      const data = await getProfessionals(params);
      if (Array.isArray(data)) {
        setItems(data);
        setTotal(data.length);
        setPages(1);
        setPage(1);
      } else {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        setPage(data.page || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  // cargar catálogo al inicio y cuando cambian filtros
  useEffect(() => {
    fetchCatalog(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableNow, categoryId, serviceId]);

  // si cambia category, limpiar service seleccionado
  useEffect(() => {
    setServiceId("");
  }, [categoryId]);

  const displayName = (u) => u?.name || u?.email?.split("@")[0] || "Usuario";

  // 🔴 LIVE: actualizar catálogo en tiempo real ante cambios de disponibilidad
  useEffect(() => {
    if (!socket) return; // ✅ evita "socket is not defined"

    const handler = () => fetchCatalog(page);
    const onConnect = () => fetchCatalog(page);

    socket.on("availability:update", handler);
    socket.on("availability:changed", handler);
    socket.on("connect", onConnect);

    return () => {
      socket.off("availability:update", handler);
      socket.off("availability:changed", handler);
      socket.off("connect", onConnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">🎯 Panel del Cliente</h1>
          <p className="text-lg text-gray-700">
            Bienvenido,{" "}
            <span className="text-[#0a0e17] font-semibold">
              {displayName(user)}
            </span>.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[#111827] rounded-lg p-6 mb-6 shadow-md">
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-white text-black"
              >
                <option value="">Todas</option>
                {(categories || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Servicio</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-white text-black"
              >
                <option value="">Todos</option>
                {(filteredServices || []).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Disponibilidad</label>
              <button
                onClick={() => setAvailableNow((v) => !v)}
                className={`w-full px-3 py-2 rounded border transition ${
                  availableNow
                    ? "bg-emerald-500 border-emerald-600 text-white"
                    : "bg-white text-black border-gray-300"
                }`}
              >
                {availableNow ? "✅ Solo disponibles ahora" : "Todos"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchCatalog(1)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border ${
                  loading
                    ? "opacity-60 cursor-wait"
                    : "bg-white hover:bg-gray-100 text-black"
                }`}
              >
                {loading ? "Aplicando…" : "Aplicar"}
              </button>
              <button
                onClick={() => {
                  setCategoryId("");
                  setServiceId("");
                  setAvailableNow(false);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
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
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-600">No se encontraron profesionales con esos filtros.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {items.map((p) => {
              const name = p?.user?.name || "Profesional";
              const email = p?.user?.email || "";
              const servicesNames = (p.services || []).map(s => s?.name).filter(Boolean);
              const firstService = servicesNames[0] || "Servicio";
              const restCount = Math.max(0, servicesNames.length - 1);

              return (
                <div
                  key={p._id}
                  className="group bg-white text-black rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  {/* Header visual */}
                  <div className="relative h-28 bg-gradient-to-r from-slate-800 to-slate-700">
                    <span
                      className={`absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded-full border ${
                        p.isAvailableNow
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {p.isAvailableNow ? "Disponible ahora" : "Offline"}
                    </span>
                    <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-full ring-4 ring-white bg-white grid place-items-center text-slate-800 font-bold">
                      {(name[0] || "P").toUpperCase()}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="pt-8 px-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-5 line-clamp-1">{name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{email}</p>
                      </div>
                      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        ⭐ 4.8
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

                    {/* Botón alineado a la derecha */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => navigate(`/professional/${p._id}?reserve=1`)}
                        className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors duration-150 cursor-pointer"
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

        {/* Paginación */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-16">
            <button
              disabled={page <= 1}
              onClick={() => fetchCatalog(page - 1)}
              className={`px-3 py-1 rounded border ${
                page <= 1 ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
              }`}
            >
              ←
            </button>
            <span className="text-sm text-gray-700">Página {page} de {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => fetchCatalog(page + 1)}
              className={`px-3 py-1 rounded border ${
                page >= pages ? "opacity-40 cursor-not-allowed" : "bg-white hover:bg-gray-100"
              }`}
            >
              →
            </button>
          </div>
        )}

        {/* Tu contenido existente */}
        <div className="text-left mb-16">
          <h2 className="text-2xl font-bold mb-4">📋 Reservas recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ReservationCard user="Juan García" service="Electricista" date="2025-08-15" status="confirmado" />
            <ReservationCard user="Carla Pérez" service="Plomero" date="2025-08-10" status="pendiente" />
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-2xl font-bold mb-4">💬 Chats recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ChatPreviewCard name="Marcelo López" lastMessage="¿En qué horario estarías disponible?" time="hace 1 hora" />
            <ChatPreviewCard name="Lautaro Peña" lastMessage="Perfecto, te agendo para mañana." time="hace 3 horas" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserDashboard;