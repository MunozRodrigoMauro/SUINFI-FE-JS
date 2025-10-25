// src/components/Shared/ServiceStep.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosUser from "../../api/axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/* ===== Helpers de búsqueda ===== */
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const stem = (w) => {
  let x = norm(w);
  x = x.replace(/(mente)$/g, "");
  x = x.replace(/(ciones)$/g, "cion");
  x = x.replace(/(iones)$/g, "ion");
  x = x.replace(/(idades)$/g, "idad");
  x = x.replace(/(icos|icas|ico|ica)$/g, "");
  x = x.replace(/(eros|eras|ero|era)$/g, "");
  x = x.replace(/(istas|ista)$/g, "ista");
  x = x.replace(/(ia|ias)$/g, "ia");
  x = x.replace(/(es|s)$/g, "");
  return x;
};

const SYN = {
  docente: [
    "docente",
    "profesor",
    "profesora",
    "maestro",
    "maestra",
    "clase",
    "clases",
    "educacion",
    "ensenanza",
    "tutor",
    "tutoria",
  ],
  primaria: ["primaria", "inicial", "jardin", "ninos", "ninas", "chicos", "chicas"],
  secundaria: ["secundaria", "colegio", "bachiller", "liceo"],
  ingenieria: [
    "ingenieria",
    "ingeniero",
    "ingeniera",
    "ing",
    "industrial",
    "civil",
    "mecanica",
    "mecatronica",
    "electrica",
    "electronica",
    "sistemas",
    "software",
    "quimica",
    "ambiental",
    "estructural",
  ],
  electricidad: ["electricidad", "electricista", "tablero", "iluminacion"],
  plomeria: [
    "plomeria",
    "plomero",
    "plomera",
    "caneria",
    "cloaca",
    "sanitario",
    "sanitarios",
    "gas",
  ],
};

const buildQueryGroups = (q) => {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  return toks.map((raw) => {
    const t = stem(raw);
    const group = new Set([t]);

    if (t.startsWith("docent") || t.startsWith("profes") || t.startsWith("maestr")) {
      SYN.docente.forEach((w) => group.add(stem(w)));
    }
    if (t === "ing" || t.startsWith("ingenier")) {
      SYN.ingenieria.forEach((w) => group.add(stem(w)));
    }
    if (t.startsWith("primar") || t.startsWith("jardin")) {
      SYN.primaria.forEach((w) => group.add(stem(w)));
    }
    if (t.startsWith("secund") || t.startsWith("bachill")) {
      SYN.secundaria.forEach((w) => group.add(stem(w)));
    }
    if (t.startsWith("electr")) {
      SYN.electricidad.forEach((w) => group.add(stem(w)));
    }
    if (t.startsWith("plom") || t.startsWith("sanit")) {
      SYN.plomeria.forEach((w) => group.add(stem(w)));
    }

    if (t.length >= 3) group.add(t.slice(0, 3));
    if (t.length >= 4) group.add(t.slice(0, 4));

    return Array.from(group);
  });
};

const matchAllGroups = (groups, idx) => {
  if (!groups.length) return true;
  const big = idx.big;
  const words = idx.words;
  return groups.every((grp) =>
    grp.some((t) => big.includes(t) || words.has(t) || [...words].some((w) => w.startsWith(t)))
  );
};

/* ===== [CAMBIO HIGHLIGHT] helper para resaltar coincidencias (igual estilo que en ProfessionalServicesPage) ===== */
const highlight = (text = "", query = "") => {
  if (!query) return text;
  try {
    const qEsc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${qEsc})`, "ig"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-black px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  } catch {
    return text;
  }
};

/* ===== Componente ===== */

export default function ServiceStep({ selectedIds = [], onAdd, onRemove, onConfirm }) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [svcRes, catRes] = await Promise.all([
          axiosUser.get(`${API}/services`, { params: { perPage: 1200 } }),
          axiosUser.get(`${API}/categories`, { params: { perPage: 1200 } }),
        ]);
        if (!mounted) return;

        const raw = Array.isArray(svcRes.data) ? svcRes.data : svcRes.data?.items || [];
        const cats = Array.isArray(catRes.data) ? catRes.data : catRes.data?.items || [];
        const catById = new Map(cats.map((c) => [c._id, c]));

        const getCatName = (category) => {
          if (!category) return "";
          if (typeof category === "object") return category.name || "";
          const obj = catById.get(category);
          return obj?.name || "";
        };
        const getCatPath = (category) => {
          const obj = typeof category === "object" ? category : catById.get(category);
          if (!obj) return "";
          const p2 = obj?.parent?.parent?.name;
          const p1 = obj?.parent?.name;
          const p0 = obj?.name;
          return [p2, p1, p0].filter(Boolean).join(" ");
        };

        const normalized = raw.map((s) => {
          const catName = getCatName(s.category);
          const path = getCatPath(s.category);
          const name = String(s?.name || "");
          const desc = String(s?.description || "");

          const big = stem(norm([name, catName, path, desc].join(" ")));
          const words = new Set(
            norm([name, catName, path, desc].join(" "))
              .split(/\s+/)
              .filter(Boolean)
              .map(stem)
          );

          return {
            ...s,
            categoryName: catName,
            _idx: { big, words },
          };
        });

        setAll(normalized);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const results = useMemo(() => {
    const base = Array.isArray(all) ? all : [];
    const groups = buildQueryGroups(q);
    if (!groups.length) return base.slice(0, 400);

    // --- Ranking por relevancia ---
    const nq = norm(q);
    const sq = stem(nq);
    const firstTok = nq.split(/\s+/).filter(Boolean)[0] || "";

    const scoreOf = (s) => {
      const nameN = norm(s.name || "");
      const nameS = stem(nameN);
      const catN = norm(s.categoryName || "");
      const big = s._idx.big;
      const words = s._idx.words;

      let score = 0;

      for (const grp of groups) {
        let got = false;
        if (grp.some((t) => words.has(t))) {
          score += 25;
          got = true;
        }
        if (!got && grp.some((t) => [...words].some((w) => w.startsWith(t)))) {
          score += 14;
          got = true;
        }
        if (!got && grp.some((t) => big.includes(t))) {
          score += 6;
        }
      }

      if (nameN === nq) score += 120;
      if (nameN.startsWith(nq)) score += 40;
      if (nameS === sq) score += 35;
      if (nameS.startsWith(sq)) score += 22;

      if (firstTok && nameN.startsWith(firstTok)) score += 28;

      if (catN.includes(nq)) score += 8;
      if (catN.startsWith(firstTok)) score += 10;

      score += Math.max(0, 18 - Math.min(18, (nameN.length / 4) | 0));

      return score;
    };

    const matched = base.filter((s) => matchAllGroups(groups, s._idx));
    return matched
      .map((s) => ({ s, score: scoreOf(s) }))
      .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name))
      .slice(0, 250)
      .map((x) => x.s);
  }, [all, q]);

  const confirmEnabled = selectedIds.length > 0;

  return (
    <div className="w-full">
      <div className="bg-white/95 text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-3">¿Qué servicio necesitás?</h2>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej.: Docente primaria, Ingeniería civil, Electricista…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
        />

        {/* Scroll visible también en mobile 👇 */}
        <div
          className="mt-3 max-h-64 overflow-y-scroll rounded-xl border border-slate-200 bg-white text-slate-900 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {loading ? (
            <div className="px-4 py-3 text-slate-500">Cargando servicios…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-slate-500">Sin resultados.</div>
          ) : (
            results.map((s) => {
              const checked = selectedIds.includes(s._id);
              return (
                <label
                  key={s._id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 cursor-pointer"
                  title={s.categoryName ? `${s.name} · ${s.categoryName}` : s.name}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      e.target.checked ? onAdd?.(s._id) : onRemove?.(s._id)
                    }
                  />
                  <span className="truncate">
                    {/* [CAMBIO HIGHLIGHT] */}
                    {highlight(s.name, q)}
                    {s.categoryName ? (
                      <span className="ml-2 text-xs text-slate-500">
                        · {highlight(s.categoryName, q)}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <button
          onClick={() => confirmEnabled && onConfirm?.()}
          disabled={!confirmEnabled}
          className={`mt-5 w-full rounded-xl py-3 cursor-pointer ${
            confirmEnabled
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-emerald-200 text-white cursor-not-allowed"
          }`}
        >
          Confirmar servicio
        </button>
      </div>
    </div>
  );
}
