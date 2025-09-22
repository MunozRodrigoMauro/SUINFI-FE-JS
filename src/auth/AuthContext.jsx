// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, verifyToken, getMyProfile } from "../api/userService";
import {
  socket,
  joinUserRoom,
  connectSocket,
  disconnectSocket,
  startActivityTracking,
  stopActivityTracking,
  beat,
} from "../lib/socket";

const AuthContext = createContext();

const isEmpty = (v) => v == null || String(v).trim() === "";

// Solo aplica a profesionales: obliga a completar perfil básico
function needsOnboarding(user) {
  if (!user || user.role !== "professional") return false;
  if (!user.name || String(user.name).trim().length < 2) return true;
  const a = user.address || {};
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
  const [avatarVersion, setAvatarVersion] = useState(0);
  const bumpAvatarVersion = () => setAvatarVersion((v) => v + 1);

  const navigate = useNavigate();
  const location = useLocation();

  const requiresOnboarding = useMemo(() => needsOnboarding(user), [user]);

  // --- helper: hidratar user tras auth (login/restore)
  const hydrateUserAfterAuth = async (token, baseUser) => {
    try {
      const me = await getMyProfile();
      return { ...baseUser, ...me };
    } catch {
      try {
        const vr = await verifyToken(token);
        return { ...baseUser, ...(vr?.user || {}) };
      } catch {
        return baseUser;
      }
    }
  };

  // 1) Login
  const login = async (credentials) => {
    const res = await loginUser(credentials); // { user, token }
    localStorage.setItem("token", res.token);

    const hydrated = await hydrateUserAfterAuth(res.token, res.user || {});
    setUser(hydrated);

    try {
      joinUserRoom(hydrated.id || hydrated._id, res.token);
      startActivityTracking();
      beat();
    } catch {}

    if (needsOnboarding(hydrated)) {
      navigate("/profile", { replace: true });
    }
    return hydrated;
  };

  // 2) Logout
  const logout = () => {
    try {
      stopActivityTracking();
      disconnectSocket();
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
        const vr = await verifyToken(token); // { user }
        let u = vr?.user || null;

        if (!u?.avatarUrl || isEmpty(u.avatarUrl)) {
          u = await hydrateUserAfterAuth(token, u || {});
        }

        setUser(u);

        // socket + tracking
        try {
          joinUserRoom(u?.id || u?._id, token);
          startActivityTracking();
          beat();
        } catch {}

        if (needsOnboarding(u) && location.pathname !== "/profile") {
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

  // 4) Si el socket se reconecta, volver a unirse + beat
  useEffect(() => {
    const onConnect = () => {
      const uid = user?.id || user?._id;
      const token = localStorage.getItem("token") || "";
      if (uid) joinUserRoom(uid, token);
      beat();
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
    avatarVersion,
    bumpAvatarVersion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
