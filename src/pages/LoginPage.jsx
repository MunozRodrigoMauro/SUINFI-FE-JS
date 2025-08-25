// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // 👈 nuevo estado para loader

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

      if (roleRoute[user.role]) navigate(roleRoute[user.role]);
      else setError("Rol no reconocido");
    } catch (err) {
      // Si el BE devolvió 403 por email no verificado
      if (
        err?.response?.status === 403 &&
        err.response.data?.code === "EMAIL_NOT_VERIFIED"
      ) {
        navigate(`/verify-email-sent?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Credenciales inválidas");
    } finally {
      setLoading(false); // 👈 siempre desactiva el loader
    }
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
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white py-2 rounded cursor-pointer transition 
          ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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
    </div>
  );
}

export default LoginPage;