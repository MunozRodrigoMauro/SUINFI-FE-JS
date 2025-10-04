// src/pages/LoginPage.jsx
// 🛠 CAMBIO: micro-copy aclaratoria y API_BASE prioriza VITE_API_URL

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, password });
      const roleRoute = {
        admin: "/dashboard/admin",
        user: "/dashboard/user",
        professional: "/dashboard/professional",
      };
      if (roleRoute[user.role]) {
        navigate(roleRoute[user.role]);
      } else {
        navigate("/dashboard/user");
      }
    } catch (err) {
      if (
        err?.response?.status === 403 &&
        err.response?.data?.code === "EMAIL_NOT_VERIFIED"
      ) {
        navigate(`/verify-email-sent?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Normaliza la base para evitar doble /api o barras de más
  const RAW_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:3000/api";

  // -> nos quedamos con el origin (sin slash final y sin /api)
  const API_BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/i, "");

  // inicia OAuth por rol (usa /api exactamente una vez)
  const startGoogle = (role) => {
    const nextByRole = {
      user: "/dashboard/user",
      professional: "/dashboard/professional",
    };
    const intent = "login";
    const next = nextByRole[role] || "/dashboard/user";
    const path = role === "professional" ? "professional" : "client";
    window.location.href = `${API_BASE}/api/auth/google/${path}?intent=${encodeURIComponent(
      intent
    )}&next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Iniciar sesión
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
          autoComplete="current-password"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center justify-between -mt-2">
          <div />
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white py-2 rounded cursor-pointer transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Procesando...
            </span>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      {/* separador */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* 🛠 CAMBIO: micro-copy que elimina la duda */}
      <p className="text-xs text-gray-500 text-center mb-2">
        Elegí el botón según tu rol:
      </p>

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => startGoogle("user")}
          className="w-full border rounded py-2 flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer"
          title="Google (Cliente)"
        >
          <GoogleIcon />
          <span className="text-sm font-medium">Google (Cliente)</span>
        </button>

        <button
          type="button"
          onClick={() => startGoogle("professional")}
          className="w-full border rounded py-2 flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer"
          title="Google (Profesional)"
        >
          <GoogleIcon />
          <span className="text-sm font-medium">Google (Profesional)</span>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.4 35 24 35c-7.2 0-13-5.8-13-13S16.8 9 24 9c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 3.6 29.6 5.5 24 5.5c-7.7 0-14.3 4.4-17.7 10.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16.4 19 13 24 13c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 7.6 29.6 5.5 24 5.5c-7.7 0-14.3 4.4-17.7 10.9z"
      />
      <path
        fill="#4CAF50"
        d="M24 42.5c5.3 0 10.1-2 13.7-5.3l-6.3-5.2c-1.9 1.3-4.4 2.1-7.4 2.1-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C8.3 38.1 15.6 42.5 24 42.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.9-5.6 7-11.3 7-5 0-9.4-3.1-11.1-7.4l-6.6 5.1C8.3 38.1 15.6 42.5 24 42.5c8.7 0 16.1-5.9 18.5-13.8 0-1.2.3-2.4.3-3.7 0-1.2-.1-2.3-.2-3.5z"
      />
    </svg>
  );
}

export default LoginPage;
