import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
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
// [SFX-RECV-GLOBAL] importar SFX para reproducir sonido al recibir
import SFX from "../lib/sfx";

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

// CHANGES: helper central para estado de perfil (cliente/profesional)
// AHORA: NO se considera más "whatsapp" como faltante.
// Sólo se usa nombre + dirección básica y, opcionalmente, disponibilidad.
function computeProfileStatus(user) {
  const missing = [];
  if (!user) return { isComplete: false, missing, role: null };

  const role = user.role || "user";
  const nameOk = (user.name || "").trim().length >= 2;

  const a = user.address || {};
  // Dirección básica: sin exigir label/location
  const addrOk =
    !!(a.country && a.country.trim()) &&
    !!(a.state && a.state.trim()) &&
    !!(a.city && a.city.trim()) &&
    !!(a.street && a.street.trim()) &&
    !!(a.number && String(a.number).trim()) &&
    !!(a.postalCode && String(a.postalCode).trim());

  if (!nameOk) missing.push("name");
  if (!addrOk) missing.push("address");

  if (role === "professional") {
    // OPCIONAL: sólo marcamos disponibilidad si el backend la trae explícita y vacía
    const av = user.availability;
    if (av !== undefined && av !== null) {
      const availabilityOk =
        Boolean(av.weekly) ||
        (Array.isArray(av.blocks) && av.blocks.length > 0);
      if (!availabilityOk) {
        missing.push("availability");
      }
    }

    // ⚠️ IMPORTANTE: WhatsApp YA NO se chequea acá.
    // El popup nunca va a mostrar "WhatsApp" como pendiente.
  }

  const isComplete = missing.length === 0;
  return { isComplete, missing, role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const bumpAvatarVersion = () => setAvatarVersion((v) => v + 1);

  const navigate = useNavigate();
  const location = useLocation();

  const requiresOnboarding = useMemo(() => needsOnboarding(user), [user]);

  // CHANGES: status de perfil derivado (para PopApp)
  const profileStatus = useMemo(() => computeProfileStatus(user), [user]);

  // [SFX-RECV-GLOBAL] flag: desbloqueo de audio tras primer gesto del usuario (sin reproducir sonido)
  const audioUnlockedRef = useRef(false);
  useEffect(() => {
    const unlock = () => {
      audioUnlockedRef.current = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

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
        const base = vr?.user || {};
        const u = await hydrateUserAfterAuth(token, base);
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

  // [SFX-RECV-GLOBAL] Sonido global al recibir mensaje (evita duplicar si estás en /chats)
  useEffect(() => {
    if (!socket) return;

    const chatRoutes = [
      "/chats",
      "/messages",
      "/dashboard/professional/messages",
    ];

    const shouldMuteOnThisPage = (path) => {
      // Si la ruta actual empieza con alguno de los paths de chat, dejamos que la página maneje el sonido
      return chatRoutes.some((p) => path === p || path.startsWith(p + "/"));
    };

    const onNewMessage = (payload) => {
      try {
        if (!payload || !payload.message) return;

        const myId = user?.id || user?._id;
        const msg = payload.message;
        const fromId = msg?.from?._id || msg?.from;

        // Ignorar mis propios mensajes
        if (String(fromId) === String(myId)) return;

        // Evitar doble sonido cuando estamos dentro de la vista de chats (ChatsPage.jsx ya suena)
        if (shouldMuteOnThisPage(window.location.pathname)) return;

        // Opcional: si querés mutear cuando el documento está visible, sacá esta condición.
        // La dejamos para sonar incluso si la pestaña está visible (pero fuera de la vista de chat).
        // Si el usuario no hizo un gesto aún (mobile), no intentamos sonar para evitar bloqueos.
        if (!audioUnlockedRef.current) return;

        SFX.playRecv();
      } catch {
        // noop
      }
    };

    socket.on("chat:message", onNewMessage);
    return () => socket.off("chat:message", onNewMessage);
  }, [user?.id, user?._id, location.pathname]);

  const value = {
    user,
    setUser,
    login,
    logout,
    loading,
    requiresOnboarding,
    avatarVersion,
    bumpAvatarVersion,
    // CHANGES: exponemos estado de perfil para el PopApp
    profileStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
