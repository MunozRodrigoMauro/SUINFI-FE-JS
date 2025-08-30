// src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosUser from "../api/axiosUser";
import { getProfessionals } from "../api/professionalService";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/* ──────────────────────────────────────────────────────────
   UI helpers
────────────────────────────────────────────────────────── */
function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function Kbd({ children }) {
  return (
    <span className="rounded-md border bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
      {children}
    </span>
  );
}

function SearchBox({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function Drawer({ open, onClose, title, children }) {
  return (
    <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-50`}>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function Table({ cols = [], rows = [], getKey }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left font-semibold">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="px-3 py-6 text-center text-gray-500">
                Sin resultados
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr key={getKey?.(r, idx) ?? idx} className="border-t">
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-top">
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // stats
  const [stats, setStats] = useState({
    users: { total: 0, loading: true },
    pros: { total: 0, loading: true },
    services: { total: 0, loading: true },
  });

  // drawers
  const [openUsers, setOpenUsers] = useState(false);
  const [openPros, setOpenPros] = useState(false);
  const [openServices, setOpenServices] = useState(false);

  // data
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState("");
  const usersFiltered = useMemo(() => {
    const q = usersSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, usersSearch]);

  const [pros, setPros] = useState([]);
  const [prosSearch, setProsSearch] = useState("");
  const prosFiltered = useMemo(() => {
    const q = prosSearch.trim().toLowerCase();
    if (!q) return pros;
    return pros.filter(
      (p) =>
        p?.user?.name?.toLowerCase().includes(q) ||
        p?.user?.email?.toLowerCase().includes(q) ||
        (p?.categories || []).join(" ").toLowerCase().includes(q)
    );
  }, [pros, prosSearch]);

  const [services, setServices] = useState([]);
  const [servicesSearch, setServicesSearch] = useState("");
  const servicesFiltered = useMemo(() => {
    const q = servicesSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q)
    );
  }, [services, servicesSearch]);

  // load stats (fast)
  useEffect(() => {
    let alive = true;

    const load = async () => {
      // users
      try {
        const { data } = await axiosUser.get(`${API}/users`);
        if (!alive) return;
        setStats((s) => ({ ...s, users: { total: (data || []).length, loading: false } }));
      } catch {
        if (!alive) return;
        setStats((s) => ({ ...s, users: { total: 0, loading: false } }));
      }
      // professionals
      try {
        const plist = await getProfessionals();
        const arr = Array.isArray(plist) ? plist : plist?.items || [];
        if (!alive) return;
        setStats((s) => ({ ...s, pros: { total: arr.length, loading: false } }));
      } catch {
        if (!alive) return;
        setStats((s) => ({ ...s, pros: { total: 0, loading: false } }));
      }
      // services
      try {
        const { data } = await axiosUser.get(`${API}/services`); // si existe
        if (alive) {
          setStats((s) => ({ ...s, services: { total: (data || []).length, loading: false } }));
        }
      } catch {
        // fallback: contar servicios desde profesionales
        try {
          const plist = await getProfessionals();
          const arr = Array.isArray(plist) ? plist : plist?.items || [];
          const total = arr.reduce((acc, p) => acc + ((p?.services || []).length || 0), 0);
          if (alive) setStats((s) => ({ ...s, services: { total, loading: false } }));
        } catch {
          if (alive) setStats((s) => ({ ...s, services: { total: 0, loading: false } }));
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  // drawers lazy-load
  const openUsersDrawer = async () => {
    setOpenUsers(true);
    if (users.length > 0) return;
    try {
      const { data } = await axiosUser.get(`${API}/users`);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  };

  const openProsDrawer = async () => {
    setOpenPros(true);
    if (pros.length > 0) return;
    try {
      const plist = await getProfessionals();
      const arr = Array.isArray(plist) ? plist : plist?.items || [];
      setPros(arr);
    } catch {
      setPros([]);
    }
  };

  const openServicesDrawer = async () => {
    setOpenServices(true);
    if (services.length > 0) return;

    // 1) intento directo
    try {
      const { data } = await axiosUser.get(`${API}/services`);
      const flat = (Array.isArray(data) ? data : []).map((s) => ({
        _id: s._id,
        name: s.name,
        category: s.category || s.type || "",
        price: s.price,
        currency: s.currency || "ARS",
        durationMin: s.durationMin || s.duration || null,
        ownerName: s?.owner?.name || s?.professional?.user?.name || "",
        ownerEmail: s?.owner?.email || s?.professional?.user?.email || "",
      }));
      setServices(flat);
      return;
    } catch {
      /* fallback abajo */
    }

    // 2) fallback desde profesionales
    try {
      const plist = await getProfessionals();
      const arr = Array.isArray(plist) ? plist : plist?.items || [];
      const flat = [];
      arr.forEach((p) => {
        const ownerName = p?.user?.name || "";
        const ownerEmail = p?.user?.email || "";
        (p?.services || []).forEach((s) => {
          flat.push({
            _id: s._id,
            name: s.name,
            category: s.category || s.type || "",
            price: s.price,
            currency: s.currency || "ARS",
            durationMin: s.durationMin || s.duration || null,
            ownerName,
            ownerEmail,
          });
        });
      });
      setServices(flat);
    } catch {
      setServices([]);
    }
  };

  const userName = useMemo(
    () => user?.name || user?.email?.split("@")[0] || "Admin",
    [user?.name, user?.email]
  );

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-20 px-4">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">👑 Administrador: {userName}</h1>
          </div>
          <div className="flex gap-2">
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat
            label="Usuarios"
            value={stats.users.loading ? "…" : stats.users.total}
            hint="Registrados en la plataforma"
          />
          <Stat
            label="Profesionales"
            value={stats.pros.loading ? "…" : stats.pros.total}
            hint="Perfiles publicados"
          />
          <Stat
            label="Servicios"
            value={stats.services.loading ? "…" : stats.services.total}
            hint="Activos en el catálogo"
          />
        </div>

        {/* Quick actions */}
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={openUsersDrawer}
            className="cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow"
          >
            <div className="text-xl font-semibold">👥 Usuarios</div>
            <p className="mt-1 text-sm text-gray-600">Gestionar usuarios registrados</p>
            <div className="mt-3 text-xs text-gray-400">
              Tip: buscá con <Kbd>nombre</Kbd>, <Kbd>email</Kbd> o <Kbd>rol</Kbd>
            </div>
          </button>

          <button
            onClick={openProsDrawer}
            className="cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow"
          >
            <div className="text-xl font-semibold">🧰 Profesionales</div>
            <p className="mt-1 text-sm text-gray-600">Revisar perfiles de expertos</p>
            <div className="mt-3 text-xs text-gray-400">Incluye categorías y contacto</div>
          </button>

          <button
            onClick={openServicesDrawer}
            className="cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow"
          >
            <div className="text-xl font-semibold">🛠️ Servicios</div>
            <p className="mt-1 text-sm text-gray-600">Controlar rubros y oferta</p>
            <div className="mt-3 text-xs text-gray-400">Agrupados por profesional</div>
          </button>

          {/* placeholders (desactivados por ahora) */}
          <button className="cursor-not-allowed rounded-2xl border bg-gray-50 p-5 text-left opacity-70">
            <div className="text-xl font-semibold">📊 Reportes</div>
            <p className="mt-1 text-sm text-gray-600">Próximamente</p>
          </button>
          <button className="cursor-not-allowed rounded-2xl border bg-gray-50 p-5 text-left opacity-70">
            <div className="text-xl font-semibold">💸 Pagos</div>
            <p className="mt-1 text-sm text-gray-600">Próximamente</p>
          </button>
          <button className="cursor-not-allowed rounded-2xl border bg-gray-50 p-5 text-left opacity-70">
            <div className="text-xl font-semibold">🔔 Notificaciones</div>
            <p className="mt-1 text-sm text-gray-600">Próximamente</p>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Último acceso: {new Date(user?.lastLogin || Date.now()).toLocaleString()}
        </div>
      </div>

      {/* ─────────── Drawers ─────────── */}
      <Drawer open={openUsers} onClose={() => setOpenUsers(false)} title="Usuarios">
        <div className="mb-3">
          <SearchBox value={usersSearch} onChange={setUsersSearch} placeholder="Buscar por nombre, email o rol…" />
        </div>
        <Table
          cols={[
            { key: "name", label: "Nombre", render: (u) => <span className="font-medium">{u.name}</span> },
            { key: "email", label: "Email" },
            { key: "role", label: "Rol", render: (u) => <span className="capitalize">{u.role}</span> },
            {
              key: "createdAt",
              label: "Alta",
              render: (u) =>
                u.createdAt ? new Date(u.createdAt).toLocaleDateString() : <span className="text-gray-400">—</span>,
            },
          ]}
          rows={usersFiltered}
          getKey={(u) => u._id}
        />
      </Drawer>

      <Drawer open={openPros} onClose={() => setOpenPros(false)} title="Profesionales">
        <div className="mb-3">
          <SearchBox value={prosSearch} onChange={setProsSearch} placeholder="Buscar por nombre, email o categoría…" />
        </div>
        <Table
          cols={[
            {
              key: "user",
              label: "Profesional",
              render: (p) => (
                <div>
                  <div className="font-medium">{p?.user?.name || "—"}</div>
                  <div className="text-xs text-gray-500">{p?.user?.email}</div>
                </div>
              ),
            },
            {
              key: "categories",
              label: "Categorías",
              render: (p) =>
                (p?.categories || []).length ? (
                  <div className="flex flex-wrap gap-1">
                    {p.categories.map((c, i) => (
                      <span key={i} className="rounded-full border px-2 py-0.5 text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              key: "services",
              label: "Servicios",
              render: (p) => <span>{(p?.services || []).length || 0}</span>,
            },
            {
              key: "actions",
              label: "Acciones",
              render: (p) => (
                <div className="flex gap-2">
                  {/* <button
                    onClick={() => navigate(`/professional/${p?._id || p?.user?._id}`)}
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Ver perfil
                  </button> */}
                </div>
              ),
            },
          ]}
          rows={prosFiltered}
          getKey={(p) => p._id || p?.user?._id}
        />
      </Drawer>

      <Drawer open={openServices} onClose={() => setOpenServices(false)} title="Servicios">
        <div className="mb-3">
          <SearchBox value={servicesSearch} onChange={setServicesSearch} placeholder="Buscar por nombre o categoría…" />
        </div>
        <Table
          cols={[
            { key: "name", label: "Servicio", render: (s) => <span className="font-medium">{s.name}</span> },
            { key: "category", label: "Categoría", render: (s) => s.category || <span className="text-gray-400">—</span> },
            {
              key: "price",
              label: "Precio",
              render: (s) =>
                s.price != null ? (
                  <span>
                    {new Intl.NumberFormat("es-AR", { style: "currency", currency: s.currency || "ARS" }).format(s.price)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              key: "durationMin",
              label: "Duración",
              render: (s) => (s.durationMin ? `${s.durationMin} min` : <span className="text-gray-400">—</span>),
            },
            {
              key: "owner",
              label: "Profesional",
              render: (s) => (
                <div>
                  <div className="font-medium">{s.ownerName || "—"}</div>
                  <div className="text-xs text-gray-500">{s.ownerEmail}</div>
                </div>
              ),
            },
          ]}
          rows={servicesFiltered}
          getKey={(s) => s._id}
        />
      </Drawer>
    </section>
  );
}
