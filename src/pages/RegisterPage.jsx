// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/userService";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:3000";

  const handleGoogle = () => {
    const next = "/dashboard/user";
    window.location.href = `${API_BASE}/api/auth/google?next=${encodeURIComponent(
      next
    )}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError([]);
    setLoading(true);

    try {
      const safeRole = role === "professional" ? "professional" : "user";
      await registerUser({ name, email, password, role: safeRole });
      navigate(`/verify-email-sent?email=${encodeURIComponent(email)}`, {
        replace: true,
      });
    } catch (err) {
      if (err.response && err.response.data?.errors) {
        const messages = err.response.data.errors.map((e) => e.msg);
        setError(messages);
      } else if (err.response?.data?.message) {
        setError([err.response.data.message]);
      } else {
        setError(["No se pudo registrar. Intente más tarde."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Crear cuenta
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded disabled:opacity-60"
          disabled={loading}
        />

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded disabled:opacity-60"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded disabled:opacity-60"
          disabled={loading}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white disabled:opacity-60"
          disabled={loading}
        >
          <option value="user">👤 Soy Cliente</option>
          <option value="professional">🔧 Soy Profesional</option>
        </select>

        {error.length > 0 && (
          <ul className="text-red-500 text-sm space-y-1">
            {error.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full cursor-pointer text-white py-2 rounded transition ${
            loading ? "opacity-80" : "hover:brightness-110"
          } bg-gradient-to-tr from-[#0b1220] to-[#1f2a44]`}
        >
          <div className="flex items-center justify-center gap-2">
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.25"
                ></circle>
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></path>
              </svg>
            )}
            <span>{loading ? "Enviando..." : "Registrarme"}</span>
          </div>
        </button>

        {loading && (
          <p className="text-xs text-gray-500 text-center">
            Creando tu cuenta y enviando el correo de verificación…
          </p>
        )}
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full border rounded py-2 flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer"
        title="Registrarme con Google"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.4 35 24 35c-7.2 0-13-5.8-13-13S16.8 9 24 9c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 3.6 29.6 1.5 24 1.5 11.7 1.5 1.5 11.7 1.5 24S11.7 46.5 24 46.5 46.5 36.3 46.5 24c0-1.2-.1-2.3-.3-3.5z"
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
        <span className="text-sm font-medium">Continuar con Google</span>
      </button>
    </div>
  );
}

export default RegisterPage;
