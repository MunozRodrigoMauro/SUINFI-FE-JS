import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import logo from "../../assets/LogoNavbar.png";
import { setAvailableNow, getAvailableNowProfessionals } from "../../api/professionalService";
import { socket } from "../../lib/socket";

function Navbar() {
  const { user, logout, avatarVersion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Estado inicial de "Disponible ahora"
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user?.role !== "professional") return;
      try {
        const list = await getAvailableNowProfessionals();
        if (!mounted) return;
        const mine = (list || []).find((p) => p?.user?._id === (user?.id || user?._id));
        setIsAvailableNow(Boolean(mine));
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [user?.role, user?.id, user?._id]);

  // Sockets
  useEffect(() => {
    if (!socket || user?.role !== "professional") return;
    const myId = user?.id || user?._id;

    const onAvailability = ({ userId, isAvailableNow }) => {
      if (userId === myId) setIsAvailableNow(!!isAvailableNow);
    };
    socket.on("availability:update", onAvailability);
    socket.on("availability:changed", onAvailability);

    const onConnect = async () => {
      try {
        const list = await getAvailableNowProfessionals();
        const mine = (list || []).find((p) => p?.user?._id === myId);
        setIsAvailableNow(Boolean(mine));
      } catch {}
    };
    socket.on("connect", onConnect);

    return () => {
      socket.off("availability:update", onAvailability);
      socket.off("availability:changed", onAvailability);
      socket.off("connect", onConnect);
    };
  }, [user?.role, user?.id, user?._id]);

  // Sync entre tabs (availability)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "suinfi:availabilityNow") return;
      try {
        const { v, who } = JSON.parse(e.newValue || "{}");
        const myId = user?.id || user?._id;
        if (who === myId) setIsAvailableNow(!!v);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id, user?._id]);

  const goToDashboard = () => {
    if (!user) return;
    const routes = {
      user: "/dashboard/user",
      professional: "/dashboard/professional",
      admin: "/dashboard/admin",
    };
    navigate(routes[user.role] || "/");
    setOpenMenu(false);
  };

  const broadcastAvailability = (next) => {
    const myId = user?.id || user?._id;
    if (!myId) return;
    socket?.emit?.("availability:changed", { userId: myId, isAvailableNow: next });
    localStorage.setItem(
      "suinfi:availabilityNow",
      JSON.stringify({ v: next, who: myId, at: Date.now() })
    );
  };

  const toggleAvailability = async () => {
    if (user?.role !== "professional") return;
    try {
      setLoadingAvail(true);
      const next = !isAvailableNow;
      setIsAvailableNow(next);
      await setAvailableNow(next);
      setAvailMsg(next ? "Ahora estás disponible" : "Dejaste de estar disponible");
      broadcastAvailability(next);
      setTimeout(() => setAvailMsg(""), 1800);
    } catch {
      setIsAvailableNow((prev) => !prev);
      setAvailMsg("No se pudo actualizar");
      setTimeout(() => setAvailMsg(""), 1800);
    } finally {
      setLoadingAvail(false);
    }
  };

  const showHelpOnly = user?.role === "professional" && location.pathname === "/profile";

  // Helper avatar
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
  const absUrl = (u) =>
    !u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`;

  // ⚡️ cache-busting estable por contexto (independiente del BE)
  const cacheKey = avatarVersion || 0;
  const avatarUrl = user?.avatarUrl
    ? `${absUrl(user.avatarUrl)}${cacheKey ? `?v=${encodeURIComponent(String(cacheKey))}` : ""}`
    : "";
  const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-b from-[#0a0e17]/80 to-[#0a0e17]/80 backdrop-blur"
          : "bg-gradient-to-r from-black to-[#111827]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center h-14 md:h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center" color="white">
        <img src={logo} alt="CuyIT logo" className="h-7 md:h-7 object-contain" />
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
          {showHelpOnly ? (
            <div className="relative">
              <details className="group">
                <summary className="list-none flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 cursor-pointer">
                  <span className="font-semibold">Ayuda</span>
                  <svg className="h-5 w-5 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </summary>
                <div className="absolute right-0 mt-2 w-72 bg-white text-black border rounded-xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => {
                      /* abrir chat de soporte */
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    Chat con soporte
                  </button>
                  <button
                    onClick={() => window.open("https://tus-requisitos-ejemplo", "_blank")}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                  >
                    Requisitos para socios de la app
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </details>
            </div>
          ) : (
            <>
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setOpenMenu((o) => !o)}
                    className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 transition"
                  >
                    <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold overflow-hidden">
                      {avatarUrl ? (
                        <img
                          key={avatarUrl}           // fuerza re-render al cambiar ?v=
                          src={avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                      {user?.role === "professional" && (
                        <span
                          title={isAvailableNow ? "Estás disponible" : "No disponible"}
                          className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                            isAvailableNow ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <span className="max-w-[140px] md:max-w-[160px] truncate">
                      {(user?.name?.trim() || user?.email || "").replace(/\s+/g, " ").split(" ")[0].toUpperCase()}
                    </span>
                    <svg className={`h-4 w-4 transition ${openMenu ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {openMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-black border rounded-xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b">
                        <p className="text-xs text-gray-500">Sesión</p>
                        <p className="font-semibold truncate">{user?.email}</p>
                      </div>

                      <button
                        onClick={goToDashboard}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        Ir a mi panel
                      </button>
                      <Link
                        to="/profile"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        Mi perfil
                      </Link>
                      <Link
                        to="/chats"
                        onClick={() => setOpenMenu(false)}
                        className="block px-4 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        Mensajes
                      </Link>

                      {user?.role === "professional" && (
                        <>
                          <div className="px-4 py-2 border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                                    isAvailableNow ? "bg-emerald-500" : "bg-gray-400"
                                  }`}
                                />
                                <span className="text-sm font-medium">Disponible ahora</span>
                              </div>

                              <button
                                onClick={toggleAvailability}
                                disabled={loadingAvail}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                                  isAvailableNow ? "bg-emerald-500" : "bg-gray-300"
                                } ${loadingAvail ? "opacity-60" : ""}`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                    isAvailableNow ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                            {availMsg && <p className="text-xs text-gray-500 mt-2">{availMsg}</p>}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setOpenMenu(false);
                          logout();
                          navigate("/login");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 hover:text-rose-600 transition-colors border-t cursor-pointer"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {location.pathname !== "/login" && (
                    <Link to="/login" className="text-white hover:text-amber-400 transition-colors">
                      Iniciar sesión
                    </Link>
                  )}
                  {location.pathname !== "/register" && (
                    <Link
                      to="/register"
                      className="border border-white text-white px-4 py-2 rounded-md hover:bg-white hover:text-[#0a0e17] transition-colors"
                    >
                      Registrate
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
