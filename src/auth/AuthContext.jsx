import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, verifyToken, getMyProfile } from "../api/userService";
import { socket, joinUserRoom, leaveUserRoom } from "../lib/socket";

const AuthContext = createContext();

const isEmpty = (v) => v == null || String(v).trim() === "";

// Solo aplica a profesionales: obliga a completar perfil básico
function needsOnboarding(user) {
  if (!user || user.role !== "professional") return false;
  if (!user.name || String(user.name).trim().length < 2) return true;
  const a = user.address || {};
  // front usa "state"
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

  // --- helper: hidratar user tras auth (login/restore)
  const hydrateUserAfterAuth = async (token, baseUser) => {
    // Prioridad: /users/me (trae campos completos) y si falla, verifyToken
    try {
      const me = await getMyProfile(); // { ...userFull }
      return { ...baseUser, ...me };
    } catch {
      try {
        const vr = await verifyToken(token); // { user }
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

    // ⚠️ Algunos roles no traen avatarUrl en /login -> hidratamos
    const hydrated = await hydrateUserAfterAuth(res.token, res.user || {});
    setUser(hydrated);

    // unir a la room del usuario
    try {
      joinUserRoom(hydrated.id || hydrated._id);
    } catch {}

    if (needsOnboarding(hydrated)) {
      navigate("/profile", { replace: true });
    }
    return hydrated;
  };

  // 2) Logout
  const logout = () => {
    try {
      leaveUserRoom(user?.id || user?._id);
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

        // Si por algún motivo viene incompleto (sin avatarUrl), hidratamos
        if (!u?.avatarUrl || isEmpty(u.avatarUrl)) {
          u = await hydrateUserAfterAuth(token, u || {});
        }

        setUser(u);

        // unir a la room (sesión restaurada)
        joinUserRoom(u?.id || u?._id);

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

  // 4) Si el socket se reconecta, volver a unirse a la room
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
