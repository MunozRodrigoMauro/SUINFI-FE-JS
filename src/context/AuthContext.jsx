// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, verifyToken } from "../api/userService";

const AuthContext = createContext();

const isEmpty = (v) => v == null || String(v).trim() === "";

// Heurística mínima de onboarding para profesionales
function needsOnboarding(user) {
  if (!user || user.role !== "professional") return false;

  // Nombre obligatorio
  if (isEmpty(user.name)) return true;

  // Dirección obligatoria (hasta que el BE te devuelva un booleano)
  // Esperamos estructura: user.address = { country, province, street, number, postalCode, unit }
  const a = user.address || {};
  if (isEmpty(a.country) || isEmpty(a.province) || isEmpty(a.street) || isEmpty(a.number)) {
    return true;
  }

  // Podés agregar más checks suaves (ej: avatar opcional, antecedentes opcionales)
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

    // Redirección post-login
    if (needsOnboarding(res.user)) {
      navigate("/profile", { replace: true });
    }
    return res.user;
  };

  // 2) Logout
  const logout = () => {
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

        // Si entra directo a otra ruta y necesita onboarding, lo traemos a /profile
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