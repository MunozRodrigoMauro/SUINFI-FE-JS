// src/pages/ProfessionalServicesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import axiosUser from "../api/axiosUser";
import { getMyProfessional, updateMyProfessional } from "../api/professionalService";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
// [CAMBIO RENDIMIENTO] menor debounce para sensación más ágil
const DEBOUNCE_MS = 120;

export default function ProfessionalServicesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]); // fuente global
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [qLive, setQLive] = useState("");

  const [selected, setSelected] = useState([]);
  const originalRef = useRef([]);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [viewTab, setViewTab] = useState("all");

  const searchRef = useRef(null);

  // -----------------------
  // Helpers de búsqueda
  // -----------------------
  // [CAMBIO BUSQUEDA] normalizar para buscar sin acentos / mayúsculas
  const normalize = (str = "") =>
    str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const highlight = (text = "", query = "") => {
    if (!query) return text;
    const qEsc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${qEsc})`, "ig"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-black px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const scoreService = (s, qRaw) => {
    if (!qRaw) return 0;
    const qn = normalize(qRaw);
    const name = normalize(s?.name || "");
    const desc = normalize(s?.description || "");
    const cat = normalize(s?.category?.name || "");
    let score = 0;
    if (name === qn) score += 50;
    if (name.startsWith(qn)) score += 20;
    if (name.includes(qn)) score += 10;
    if (cat.includes(qn)) score += 5;
    if (desc.includes(qn)) score += 2;
    return -score;
  };

  // inicial
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [catsRes, me, allSrv] = await Promise.all([
          axiosUser.get(`${API}/categories`),
          getMyProfessional(),
          axiosUser.get(`${API}/services`),
        ]);

        if (!mounted) return;

        const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
        setCategories(cats);

        const all = Array.isArray(allSrv.data) ? allSrv.data : [];
        setAllServices(all);

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

  // cargar servicios por categoría (o todos)
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

  // debounce búsqueda (rápida)
  useEffect(() => {
    const id = window.setTimeout(() => setQ(qLive.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [qLive]);

  // Atajo de teclado
  useEffect(() => {
    const handler = (e) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/";
      if (isCmdK || isSlash) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // mapas
  const allMap = useMemo(() => new Map(allServices.map((s) => [s._id, s])), [allServices]);
  const categoriesMap = useMemo(() => new Map((categories || []).map((c) => [c._id, c.name])), [categories]);

  // [CAMBIO BUSQUEDA] índice global normalizado (para búsqueda instantánea sobre TODO)
  const searchIndex = useMemo(() => {
    return (allServices || []).map((s) => {
      const catName =
        s?.category?.name || categoriesMap.get(s?.category?._id || s?.category) || "";
      const norm = `${normalize(s?.name)} ${normalize(catName)} ${normalize(s?.description || "")}`;
      return { _id: s._id, norm, service: s };
    });
  }, [allServices, categoriesMap]); // se recalcula solo si cambian fuentes

  // Conteos seleccionados por categoría
  const selectedCountByCategory = useMemo(() => {
    const counts = new Map();
    selected.forEach((id) => {
      const s = allMap.get(id);
      const catId = s?.category?._id || s?.category;
      if (!catId) return;
      counts.set(catId, (counts.get(catId) || 0) + 1);
    });
    return counts;
  }, [selected, allMap]);

  // [CAMBIO BUSQUEDA] resultados globales por texto (sin considerar categoría todavía)
  const globalMatches = useMemo(() => {
    if (!q) return null; // sin query no procesamos
    const qn = normalize(q);
    // buscar en índice normalizado, luego ordenar por score
    const matched = searchIndex
      .filter((row) => row.norm.includes(qn))
      .map((row) => row.service)
      .sort((a, b) => {
        const as = scoreService(a, q);
        const bs = scoreService(b, q);
        if (as !== bs) return as - bs;
        return (a?.name || "").localeCompare(b?.name || "");
      });
    return matched;
  }, [q, searchIndex]);

  // Lista base: si hay query, usar global y luego (si corresponde) filtrar por categoría.
  const baseList = useMemo(() => {
    let data;
    if (globalMatches) {
      data = categoryId
        ? globalMatches.filter((s) => {
            const id = s?.category?._id || s?.category;
            return id === categoryId;
          })
        : globalMatches;
    } else {
      // sin query: usar la lista por categoría del backend
      data = services || [];
      data = [...data].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    }

    // seleccionados primero
    data = [...data].sort((a, b) => {
      const aSel = selected.includes(a._id) ? -1 : 0;
      const bSel = selected.includes(b._id) ? -1 : 0;
      if (aSel !== bSel) return aSel - bSel;
      return 0;
    });

    return data;
  }, [globalMatches, services, categoryId, selected]);

  // Tabs: Todos / Solo elegidos
  const filtered = useMemo(() => {
    if (viewTab === "selected") {
      const setSel = new Set(selected);
      return baseList.filter((s) => setSel.has(s._id));
    }
    return baseList;
  }, [baseList, viewTab, selected]);

  // [FIX COUNT] contar sólo IDs válidos (existentes en allMap)
  const selectedCount = useMemo(() => {
    if (!selected?.length) return 0;
    const set = new Set(allMap.keys());
    let n = 0;
    for (const id of selected) if (set.has(id)) n++;
    return n;
  }, [selected, allMap]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  const clearSearch = () => setQLive("");

  // =========================
  // UI
  // =========================
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
              <button disabled className="px-4 py-2 rounded-lg bg-gray-300 text-white">Guardar</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse border rounded-2xl p-4">
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

  // [CAMBIO BUSQUEDA] si hay query y la categoría filtra todo, ofrecer ver todo
  const hiddenByCategory =
    q && globalMatches && globalMatches.length > 0 && (filtered?.length || 0) === 0 && !!categoryId;

  return (
    <>
      <Navbar />
      <BackBar title="Mis servicios" subtitle="Elegí las categorías y servicios que ofrecés" />
      <section className="min-h-screen pt-30 pb-28 px-4 bg-white text-[#0a0e17]">
        <div className="max-w-6xl mx-auto">
          {/* Header + CTA */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">🧰 Mis servicios</h1>
              <p className="text-gray-700 mt-1">
                {/* [UX COPY] */}
                Podés <b>buscar directo</b> (ej. “Plomero”) o <b>elegir una categoría</b> y luego buscar. Para sumar, tocá <b>“Agregar”</b>.
              </p>
            </div>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className={`px-4 py-2 rounded-xl text-white shadow transition ${
                saving || !dirty ? "bg-gray-300 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black cursor-pointer"
              }`}
            >
              {saving ? "Guardando…" : `Guardar (${selectedCount})`}
            </button>
          </div>

          {(error || msg) && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {error || msg}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-[#111827] rounded-2xl p-4 md:p-5 mb-4 text-white shadow-sm">
            <div className="grid lg:grid-cols-12 gap-3 items-end">
              {/* Categoría */}
              <div className="lg:col-span-4">
                <label className="block text-sm text-gray-300 mb-1">Categoría</label>
                {/* ===== evitar superposición del botón con el desplegable ===== */}
                <div className="flex items-center gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white text-black cursor-pointer"
                    aria-label="Seleccionar categoría"
                  >
                    <option value="">Todas</option>
                    {(categories || []).map((c) => {
                      const selCount = selectedCountByCategory.get(c._id) || 0;
                      return (
                        <option key={c._id} value={c._id}>
                          {c.name}{selCount ? ` (${selCount})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  {categoryId && (
                    <button
                      onClick={() => setCategoryId("")}
                      className="text-xs px-2 py-2 rounded bg-gray-400 hover:bg-gray-500 cursor-pointer shrink-0"
                    >
                      LIMPIAR
                    </button>
                  )}
                </div>
              </div>

              {/* Buscador */}
              <div className="lg:col-span-8">
                <label className="block text-sm text-gray-300 mb-1">Buscar</label>
                <div className="relative">
                  <input
                    ref={searchRef}
                    type="text"
                    value={qLive}
                    onChange={(e) => setQLive(e.target.value)}
                    placeholder="Escribí: Plomero, Electricista, Docente, Ingeniería… (⌘/Ctrl+K)"
                    className="w-full px-10 py-2.5 rounded-xl bg-white text-black pr-20"
                    aria-label="Buscar por nombre, descripción o categoría"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">🔎</span>
                  {qLive && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-gray-400 rounded hover:bg-gray-500 cursor-pointer"
                    >
                      LIMPIAR
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Resumen simple */}
            <div className="text-sm text-gray-300 mt-3">
              Mostrando <b>{filtered.length}</b> de {globalMatches ? globalMatches.length : services.length} resultados
              {q && !categoryId && " (todas las categorías)"}
              {q && categoryId && " (filtrando por categoría)"}
            </div>

            {/* Aviso cuando la categoría oculta resultados */}
            {hiddenByCategory && (
              <div className="mt-3 text-sm bg-amber-100 text-amber-900 rounded-lg px-3 py-2">
                Hay <b>{globalMatches.length}</b> resultado(s) para “{q}” en otras categorías.{" "}
                <button
                  onClick={() => setCategoryId("")}
                  className="underline underline-offset-2 hover:opacity-80 cursor-pointer"
                >
                  Ver resultados en todas
                </button>
              </div>
            )}
          </div>

          {/* Tus elegidos */}
          <div className="bg-white border rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">🧩 Tus elegidos</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewTab("selected")}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    viewTab === "selected" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-gray-50"
                  } cursor-pointer`}
                >
                  Ver solo elegidos ({selectedCount})
                </button>
                <button
                  onClick={() => setViewTab("all")}
                  className={`text-sm px-3 py-1 rounded-full border ${
                    viewTab === "all" ? "bg-gray-100" : "bg-gray-50"
                  } cursor-pointer`}
                >
                  Ver todos
                </button>
              </div>
            </div>

            {selectedCount === 0 ? (
              <p className="text-sm text-gray-600">
                Todavía no elegiste nada. Buscá arriba y tocá <b>“Agregar”</b>.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selected.map((id) => {
                  const name = allMap.get(id)?.name;
                  if (!name) return null;
                  return (
                    <span
                      key={id}
                      className="group text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"
                    >
                      {name}
                      <button
                        aria-label={`Quitar ${name}`}
                        className="opacity-70 group-hover:opacity-100 cursor-pointer"
                        onClick={() => toggle(id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {selected.some((id) => !!allMap.get(id)?.name) && (
                  <button
                    onClick={clearAll}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border hover:bg-gray-200 cursor-pointer"
                  >
                    Quitar todos
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs obvias */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewTab("all")}
              className={`px-4 py-2 rounded-xl border text-sm ${
                viewTab === "all" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white"
              } cursor-pointer`}
            >
              👀 Ver TODOS
            </button>
            <button
              onClick={() => setViewTab("selected")}
              className={`px-4 py-2 rounded-xl border text-sm ${
                viewTab === "selected" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white"
              } cursor-pointer`}
            >
              ✅ Solo ELEGIDOS ({selectedCount})
            </button>
          </div>

          {/* Lista/Grid */}
          {filtered.length === 0 ? (
            <div className="border rounded-2xl p-6 bg-white">
              <p className="text-gray-700 mb-2">No encontramos servicios con esos filtros.</p>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li>Probá con palabras simples: “Plomero”, “Electricista”, “Docente”, “Ingeniería”.</li>
                <li>Mostrá “Ver TODOS” o limpiá la categoría.</li>
              </ul>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((s) => {
                const checked = selected.includes(s._id);
                const catName =
                  s?.category?.name ||
                  categoriesMap.get(s?.category?._id || s?.category) ||
                  "";
                return (
                  <div
                    key={s._id}
                    className={`border rounded-2xl p-4 transition shadow-sm ${
                      checked ? "bg-amber-50 border-amber-200" : "bg-white hover:shadow"
                    }`}
                    title={`${s?.name} · ${catName}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[16px]">
                          {q ? highlight(s.name, q) : s.name}
                        </div>
                        {catName && (
                          <div className="text-xs text-gray-600">
                            {q ? highlight(catName, q) : catName}
                          </div>
                        )}
                        {s.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {q ? highlight(s.description, q) : s.description}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end">
                        <button
                          onClick={() => toggle(s._id)}
                          className={`text-sm px-3 py-1.5 rounded-lg border ${
                            checked
                              ? "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                              : "bg-[#0a0e17] text-white border-[#0a0e17] hover:opacity-90"
                          } cursor-pointer`}
                          aria-label={checked ? `Quitar ${s?.name}` : `Agregar ${s?.name}`}
                        >
                          {checked ? "Quitar" : "Agregar"}
                        </button>
                        <label className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <input
                            type="checkbox"
                            className="accent-amber-500"
                            checked={checked}
                            onChange={() => toggle(s._id)}
                          />
                          {checked ? "Elegido" : "No elegido"}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra fija inferior */}
        <div
          className={`fixed left-0 right-0 bottom-4 flex justify-center px-4 pointer-events-none ${
            dirty ? "opacity-100" : "opacity-0"
          } transition`}
        >
          <div className="pointer-events-auto bg-white/95 backdrop-blur border rounded-full shadow px-3 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Cambios sin guardar · <b>{selectedCount}</b> elegidos
            </span>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className="px-3 py-1.5 rounded-full bg-[#0a0e17] text-white hover:bg-black disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
