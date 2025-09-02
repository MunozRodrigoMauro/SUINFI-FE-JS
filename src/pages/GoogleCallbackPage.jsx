// src/pages/GoogleCallbackPage.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { verifyToken, getMyProfile } from "../api/userService";
import { joinUserRoom } from "../lib/socket";

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const run = async () => {
      const token = params.get("token");
      const next = params.get("next");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      localStorage.setItem("token", token);

      try {
        let u = null;
        try {
          const vr = await verifyToken(token); // { user }
          u = vr?.user || null;
        } catch {}

        if (!u) {
          const me = await getMyProfile(); // { user, requiresOnboarding? }
          u = me?.user || me || null;
        }

        if (u) {
          setUser(u);
          try { joinUserRoom(u.id || u._id); } catch {}
        }

        if (next) {
          navigate(next, { replace: true });
          return;
        }

        const roleRoute = {
          admin: "/dashboard/admin",
          user: "/dashboard/user",
          professional: "/dashboard/professional",
        };
        navigate(roleRoute[u?.role] || "/dashboard/user", { replace: true });
      } catch (e) {
        console.error("OAuth hydrate error:", e);
        navigate("/login", { replace: true });
      }
    };
    run();
  }, [params, navigate, setUser]);

  return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <p className="text-gray-700">Ingresando con Google…</p>
    </div>
  );
}
