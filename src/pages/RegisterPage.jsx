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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError([]);
    setLoading(true);

    try {
      //blindar por si alguien manipula el DOM admin
      const safeRole = role === "professional" ? "professional" : "user";
      await registerUser({ name, email, password, role: safeRole });
      // 👉 No logueamos: vamos directo a la página que avisa que enviamos el mail
      navigate(`/verify-email-sent?email=${encodeURIComponent(email)}`, { replace: true });
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
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Crear cuenta</h2>

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
          {/* <option value="admin">👑 Soy Admin</option> */}
          <option value="user">👤 Soy Cliente</option>
          <option value="professional">🔧 Soy Profesional</option>
        </select>

        {/* Errores */}
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
          className={`w-full cursor-pointer text-white py-2 rounded transition
            ${loading
              ? "opacity-80"
              : "hover:brightness-110"}
            bg-gradient-to-tr from-[#0b1220] to-[#1f2a44]`}
        >
          <div className="flex items-center justify-center gap-2">
            {loading && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none"></path>
              </svg>
            )}
            <span>{loading ? "Enviando..." : "Registrarme"}</span>
          </div>
        </button>

        {/* Hint de feedback extra (opcional) */}
        {loading && (
          <p className="text-xs text-gray-500 text-center">
            Creando tu cuenta y enviando el correo de verificación…
          </p>
        )}
      </form>
    </div>
  );
}

export default RegisterPage;