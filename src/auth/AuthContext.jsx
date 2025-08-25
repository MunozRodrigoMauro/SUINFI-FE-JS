// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, verifyToken } from "../api/userService";
import { socket, joinUserRoom } from "../lib/socket"; // ⬅️ NUEVO

const AuthContext = createContext();

const isEmpty = (v) => v == null || String(v).trim() === "";

// src/auth/AuthContext.jsx
function needsOnboarding(user) {
  if (!user || user.role !== "professional") return false;
  if (!user.name || String(user.name).trim().length < 2) return true;

  const a = user.address || {};
  // 👇 tu front usa "state", no "province"
  if (
    !a.country?.trim() ||
    !a.state?.trim() ||
    !a.city?.trim() ||
    !a.street?.trim() ||
    !a.number?.trim() ||
    !a.postalCode?.trim()
  ) {
    return true;
  }
  return false;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const requiresOnboarding = useMemo(() => needsOnboarding(user), [user]);

  // 1) Login
  const login = async (credentials) => {
    const res = await loginUser(credentials); // { user, token }
    localStorage.setItem("token", res.token);
    setUser(res.user);

    // 🔗 unir a la room del usuario
    try {
      joinUserRoom(res.user.id || res.user._id);
    } catch {}

    if (needsOnboarding(res.user)) {
      navigate("/profile", { replace: true });
    }
    return res.user;
  };

  // 2) Logout
  const logout = () => {
    try {
      leaveUserRoom(user?.id || user?._id); // 🔌 salir de la room si existe
    } catch {}
    setUser(null);
    localStorage.removeItem("token");
  };

  // 3) Restaurar sesión por token
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await verifyToken(token); // { user }
        setUser(res.user);

        // 🔗 unir a la room del usuario (por si entró con sesión guardada)
        joinUserRoom(res.user.id || res.user._id);

        if (needsOnboarding(res.user) && location.pathname !== "/profile") {
          navigate("/profile", { replace: true });
        }
      } catch (e) {
        console.error("Token inválido/expirado:", e);
        logout();
      } finally {
        setLoading(false);
      }
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Reunirse a la room si el socket se reconecta (pérdida de red, HMR, etc.)
  useEffect(() => {
    const onConnect = () => {
      const uid = user?.id || user?._id;
      if (uid) joinUserRoom(uid);
    };
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [user?.id, user?._id]);

  const value = {
    user,
    setUser,
    login,
    logout,
    loading,
    requiresOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);