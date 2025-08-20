// src/pages/ProfessionalServicesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import axiosUser from "../api/axiosUser";
import { getMyProfessional, updateMyProfessional } from "../api/professionalService";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const DEBOUNCE_MS = 300;

export default function ProfessionalServicesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [qLive, setQLive] = useState("");

  const [selected, setSelected] = useState([]);
  const originalRef = useRef([]);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [catsRes, me] = await Promise.all([
          axiosUser.get(`${API}/categories`),
          getMyProfessional(),
        ]);
        if (!mounted) return;
        setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);

        const sel =
          (me?.services || [])
            .map((s) => (typeof s === "string" ? s : s?._id))
            .filter(Boolean) || [];

        setSelected(sel);
        originalRef.current = sel;
      } catch (e) {
        console.error(e);
        setError("No pudimos cargar tus servicios. Probá de nuevo.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // cargar servicios por categoría
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError("");
      try {
        const params = categoryId ? { params: { categoryId } } : {};
        const { data } = await axiosUser.get(`${API}/services`, params);
        if (!mounted) return;
        setServices(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("No pudimos listar los servicios.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  // debounce búsqueda
  useEffect(() => {
    const id = window.setTimeout(() => setQ(qLive.trim().toLowerCase()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [qLive]);

  const filtered = useMemo(() => {
    if (!q) return services;
    return (services || []).filter((s) => {
      const name = (s?.name || "").toLowerCase();
      const desc = (s?.description || "").toLowerCase();
      const catName = (s?.category?.name || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || catName.includes(q);
    });
  }, [services, q]);

  const selectedCount = selected.length;

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((s) => s._id).filter(Boolean);
    setSelected((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearAllFiltered = () => {
    const ids = new Set(filtered.map((s) => s._id).filter(Boolean));
    setSelected((prev) => prev.filter((id) => !ids.has(id)));
  };

  const clearAll = () => setSelected([]);

  const dirty = useMemo(() => {
    const a = new Set(originalRef.current);
    const b = new Set(selected);
    if (a.size !== b.size) return true;
    for (const id of a) if (!b.has(id)) return true;
    return false;
  }, [selected]);

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMsg("");
      await updateMyProfessional({ services: selected });
      originalRef.current = selected;
      setMsg("Servicios actualizados ✅");
      window.setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar. Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const selectedChips = useMemo(() => {
    const map = new Map((services || []).map((s) => [s._id, s.name]));
    const names = selected.map((id) => map.get(id)).filter(Boolean);
    const top = names.slice(0, 6);
    const more = Math.max(0, names.length - 6);
    return { top, more };
  }, [selected, services]);

  if (loading) {
    return (
      <>
        <Navbar />
        <BackBar title="Mis servicios" subtitle="Elegí las categorías y servicios que ofrecés" />
        <section className="min-h-screen pt-30 pb-16 px-4 bg-white text-[#0a0e17]">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold">🧰 Mis servicios</h1>
                <p className="text-gray-700">Cargando datos…</p>
              </div>
              <button disabled className="px-4 py-2 rounded-lg bg-gray-300 text-white">
                Guardar
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse border rounded-xl p-4">
                  <div className="h-4 bg-gray-200 w-1/2 mb-2 rounded" />
                  <div className="h-3 bg-gray-200 w-1/3 rounded" />
                  <div className="h-3 bg-gray-200 w-2/3 mt-3 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <BackBar title="Mis servicios" subtitle="Elegí las categorías y servicios que ofrecés" />
      <section className="min-h-screen pt-30 pb-24 px-4 bg-white text-[#0a0e17]">
        <div className="max-w-5xl mx-auto">
          {/* Header + acciones */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">🧰 Mis servicios</h1>
              <p className="text-gray-700">Elegí las categorías y servicios que ofrecés.</p>
            </div>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className={`px-4 py-2 rounded-lg text-white ${
                saving || !dirty ? "bg-gray-300 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black"
              }`}
            >
              {saving ? "Guardando…" : `Guardar (${selectedCount})`}
            </button>
          </div>

          {(error || msg) && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {error || msg}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-[#111827] rounded-lg p-4 mb-6 text-white">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-300 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white text-black"
                >
                  <option value="">Todas</option>
                  {(categories || []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Buscar</label>
                <input
                  type="text"
                  value={qLive}
                  onChange={(e) => setQLive(e.target.value)}
                  placeholder="Nombre, descripción o categoría…"
                  className="w-full px-3 py-2 rounded bg-white text-black"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
              <button onClick={selectAllFiltered} className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white">
                Seleccionar todo (vista)
              </button>
              <button onClick={clearAllFiltered} className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-white">
                Quitar todo (vista)
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 rounded border border-gray-300 bg-white text-black hover:bg-gray-50"
              >
                Limpiar selección
              </button>

              <span className="ml-auto text-gray-300">
                Mostrando <b>{filtered.length}</b> / {services.length} servicios
              </span>
            </div>
          </div>

          {/* Chips seleccionados */}
          {selectedCount > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Seleccionados:</div>
              <div className="flex flex-wrap gap-2">
                {selectedChips.top.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    {name}
                  </span>
                ))}
                {selectedChips.more > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    +{selectedChips.more} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="border rounded-xl p-6 bg-white">
              <p className="text-gray-600">No encontramos servicios con esos filtros.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((s) => {
                const checked = selected.includes(s._id);
                return (
                  <label
                    key={s._id}
                    className={`border rounded-xl p-4 cursor-pointer flex items-start gap-3 transition ${
                      checked ? "bg-amber-50 border-amber-200" : "bg-white hover:shadow-sm"
                    }`}
                  >
                    <input type="checkbox" className="mt-1" checked={checked} onChange={() => toggle(s._id)} />
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      {s?.category?.name && <div className="text-xs text-gray-600">{s.category.name}</div>}
                      {!!s.price && <div className="text-sm text-gray-800 mt-1">$ {s.price}</div>}
                      {s.description && <div className="text-xs text-gray-600 mt-1">{s.description}</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra fija inferior en mobile */}
        <div
          className={`fixed left-0 right-0 bottom-4 flex justify-center px-4 pointer-events-none ${
            dirty ? "opacity-100" : "opacity-0"
          } transition`}
        >
          <div className="pointer-events-auto bg-white border rounded-xl shadow px-3 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-700">Cambios sin guardar ({selectedCount})</span>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className="px-3 py-1.5 rounded bg-[#0a0e17] text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}